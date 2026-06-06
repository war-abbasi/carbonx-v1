const Anthropic          = require('@anthropic-ai/sdk');
const { prisma }         = require('../config/db');
const { errorResponse }  = require('../utils/response');

const client = new Anthropic(); // reads ANTHROPIC_API_KEY from env automatically

/* ── Build a rich system prompt with the user's real data ── */
async function buildSystemPrompt(userId, isAdmin) {
  const userWhere = isAdmin ? {} : { userId };

  /* Carbon summary */
  let dataBlock = 'The user has not logged any carbon entries yet. Encourage them to use the Activities → Calculator tab.';

  try {
    const entries = await prisma.carbonEntry.findMany({
      where:   userWhere,
      select:  { valueKg: true, category: true, subCategory: true, scope: true, entryDate: true },
      orderBy: { entryDate: 'desc' },
    });

    if (entries.length > 0) {
      const total = entries.reduce((s, e) => s + e.valueKg, 0);

      /* By category */
      const catMap = {};
      entries.forEach(e => { catMap[e.category] = (catMap[e.category] ?? 0) + e.valueKg; });
      const byCategory = Object.entries(catMap)
        .sort((a, b) => b[1] - a[1])
        .map(([c, kg]) => `${c}: ${kg.toFixed(2)} kg (${(kg/total*100).toFixed(1)}%)`)
        .join(', ');

      /* By scope */
      const scopeMap = {};
      entries.forEach(e => { scopeMap[e.scope] = (scopeMap[e.scope] ?? 0) + e.valueKg; });
      const byScope = Object.entries(scopeMap)
        .map(([s, kg]) => `${s}: ${kg.toFixed(2)} kg`)
        .join(', ');

      /* Top sub-activity */
      const subMap = {};
      entries.forEach(e => { subMap[e.subCategory] = (subMap[e.subCategory] ?? 0) + e.valueKg; });
      const topSub = Object.entries(subMap).sort((a,b)=>b[1]-a[1])[0];

      /* Recent trend (last 3 months) */
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      const recent = entries.filter(e => new Date(e.entryDate) >= threeMonthsAgo)
        .reduce((s,e) => s + e.valueKg, 0);

      dataBlock = [
        `Total logged emissions: ${total.toFixed(2)} kg CO₂e across ${entries.length} entries`,
        `By category: ${byCategory}`,
        `By GHG scope: ${byScope}`,
        `Top single source: ${topSub[0].replace(/_/g,' ')} (${topSub[1].toFixed(2)} kg)`,
        `Last 3 months: ${recent.toFixed(2)} kg CO₂e`,
        isAdmin ? '(This is organisation-wide data across all employees.)' : '',
      ].filter(Boolean).join('\n');
    }
  } catch (_) { /* non-fatal — continue without data */ }

  return `You are CarbonX AI, an expert carbon management assistant embedded in the CarbonX platform — a GHG tracking and sustainability intelligence tool.

Your role:
- Help users understand their personal and organisational carbon footprint
- Explain carbon accounting concepts clearly (GHG Protocol, Scope 1/2/3, net-zero, SBTs)
- Provide actionable, specific emission reduction strategies
- Reference the user's actual emission data whenever relevant
- Pakistan-specific context: NEPRA electricity grid (0.45 kg CO₂e/kWh), NCCC standards

Tone: Concise, professional, encouraging. Use **bold** for key terms. Use bullet points for lists. Keep responses under 300 words unless asked for more detail.

CURRENT USER DATA:
${dataBlock}

Always reference this data when the user asks about their emissions, biggest sources, or how to reduce. If they ask a general knowledge question, answer it accurately without needing to reference their data.`;
}

/* ════════════════════════════════════════════════
   POST /api/chat  (streaming via SSE)
════════════════════════════════════════════════ */
async function chat(req, res, next) {
  try {
    const { messages } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return errorResponse(res, 'messages array is required.', 400);
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return errorResponse(res, 'ANTHROPIC_API_KEY is not set on the server. Add it to Railway environment variables.', 503);
    }

    /* SSE headers — stream text back to client */
    res.writeHead(200, {
      'Content-Type':  'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection':    'keep-alive',
      'X-Accel-Buffering': 'no',   // disable Nginx buffering on Railway
    });

    const systemPrompt = await buildSystemPrompt(req.user.id, req.user.role === 'ADMIN');

    /* Keep last 12 messages for context (6 turns) */
    const history = messages.slice(-12).map(m => ({
      role:    m.role === 'user' ? 'user' : 'assistant',
      content: String(m.text || m.content || ''),
    }));

    const stream = await client.messages.stream({
      model:      'claude-haiku-4-5',
      max_tokens: 1024,
      system:     systemPrompt,
      messages:   history,
    });

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
        res.write(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();

  } catch (err) {
    /* Try to send error over the stream if headers already sent */
    if (res.headersSent) {
      res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
      res.end();
    } else {
      next(err);
    }
  }
}

module.exports = { chat };
