const Groq           = require('groq-sdk');
const { prisma }     = require('../config/db');
const { errorResponse } = require('../utils/response');

/* ── Build system prompt with user's live carbon data ── */
async function buildSystemPrompt(userId, isAdmin) {
  const userWhere = isAdmin ? {} : { userId };

  let dataBlock = 'The user has not logged any carbon entries yet. Encourage them to use Activities → Calculator.';

  try {
    const entries = await prisma.carbonEntry.findMany({
      where:   userWhere,
      select:  { valueKg: true, category: true, subCategory: true, scope: true, entryDate: true },
      orderBy: { entryDate: 'desc' },
    });

    if (entries.length > 0) {
      const total = entries.reduce((s, e) => s + e.valueKg, 0);

      const catMap = {};
      entries.forEach(e => { catMap[e.category] = (catMap[e.category] ?? 0) + e.valueKg; });
      const byCategory = Object.entries(catMap)
        .sort((a, b) => b[1] - a[1])
        .map(([c, kg]) => `${c}: ${kg.toFixed(2)} kg (${(kg / total * 100).toFixed(1)}%)`)
        .join(', ');

      const scopeMap = {};
      entries.forEach(e => { scopeMap[e.scope] = (scopeMap[e.scope] ?? 0) + e.valueKg; });
      const byScope = Object.entries(scopeMap)
        .map(([s, kg]) => `${s}: ${kg.toFixed(2)} kg`).join(', ');

      const subMap = {};
      entries.forEach(e => { subMap[e.subCategory] = (subMap[e.subCategory] ?? 0) + e.valueKg; });
      const topSub = Object.entries(subMap).sort((a, b) => b[1] - a[1])[0];

      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      const recent = entries
        .filter(e => new Date(e.entryDate) >= threeMonthsAgo)
        .reduce((s, e) => s + e.valueKg, 0);

      dataBlock = [
        `Total logged: ${total.toFixed(2)} kg CO₂e across ${entries.length} entries`,
        `By category: ${byCategory}`,
        `By GHG scope: ${byScope}`,
        `Biggest single source: ${topSub[0].replace(/_/g, ' ')} — ${topSub[1].toFixed(2)} kg`,
        `Last 3 months: ${recent.toFixed(2)} kg CO₂e`,
        isAdmin ? '(Organisation-wide data — all employees combined.)' : '',
      ].filter(Boolean).join('\n');
    }
  } catch (_) { /* non-fatal */ }

  return `You are CarbonX AI — an expert carbon management and sustainability assistant embedded in the CarbonX platform, a GHG emission tracking tool used by organisations in Pakistan.

EXPERTISE:
- GHG Protocol: Scope 1 (direct), Scope 2 (indirect electricity), Scope 3 (value chain)
- Carbon accounting, emission factors, net-zero pathways, science-based targets (SBTs)
- Pakistan-specific context: NEPRA electricity grid factor (0.45 kg CO₂e/kWh), NCCC standards, local transport and energy patterns
- Practical, actionable reduction strategies for individuals and organisations

LANGUAGE RULES (very important):
- If the user writes in Roman Urdu (Urdu in Latin/English script, e.g. "mera footprint kam karna hai", "aaj kia karun"), reply in Roman Urdu using natural, friendly Urdu phrasing in Latin script
- If the user writes in English, reply in English
- If the user mixes both, match their mix naturally
- Always be warm and encouraging — sustainability is a journey, not a test

RESPONSE STYLE:
- Concise but complete. Use **bold** for key terms
- Bullet points (•) for lists and action items
- Keep replies under 280 words unless the user asks for detail
- Always reference the user's real emission data when it is relevant to their question

USER'S CURRENT EMISSION DATA:
${dataBlock}`;
}

/* ════════════════════════════════════════════════
   POST /api/chat  — streaming SSE via Groq LLaMA 3
════════════════════════════════════════════════ */
async function chat(req, res, next) {
  try {
    const { messages } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return errorResponse(res, 'messages array is required.', 400);
    }

    if (!process.env.GROQ_API_KEY) {
      return errorResponse(
        res,
        'GROQ_API_KEY is not set. Add it to Railway environment variables. Get a free key at console.groq.com',
        503,
      );
    }

    /* SSE stream headers */
    res.writeHead(200, {
      'Content-Type':      'text/event-stream',
      'Cache-Control':     'no-cache',
      'Connection':        'keep-alive',
      'X-Accel-Buffering': 'no',
    });

    const groq          = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const systemPrompt  = await buildSystemPrompt(req.user.id, req.user.role === 'ADMIN');

    /* Last 12 messages for context */
    const history = messages.slice(-12).map(m => ({
      role:    m.role === 'user' ? 'user' : 'assistant',
      content: String(m.text || m.content || ''),
    }));

    const stream = await groq.chat.completions.create({
      model:       'llama-3.3-70b-versatile',
      max_tokens:  1024,
      temperature: 0.7,
      messages: [
        { role: 'system', content: systemPrompt },
        ...history,
      ],
      stream: true,
    });

    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content ?? '';
      if (text) {
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();

  } catch (err) {
    if (res.headersSent) {
      res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
      res.end();
    } else {
      next(err);
    }
  }
}

module.exports = { chat };
