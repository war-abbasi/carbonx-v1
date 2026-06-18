const Groq              = require('groq-sdk');
const { prisma }        = require('../config/db');
const { errorResponse } = require('../utils/response');
const { FACTORS }       = require('../services/carbonService');

/* ── Activity extractor (fast model, parallel with system prompt) ── */
const FACTOR_CATALOGUE = Object.entries(FACTORS)
  .map(([cat, subs]) =>
    `${cat}: ${Object.entries(subs).map(([sub, fi]) => `${sub}(${fi.unit})`).join(', ')}`)
  .join('\n');

async function extractActivity(text) {
  if (!process.env.GROQ_API_KEY) return null;
  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const resp = await groq.chat.completions.create({
      model:       'llama-3.1-8b-instant',
      max_tokens:  100,
      temperature: 0,
      messages: [
        {
          role: 'system',
          content: `Extract carbon emission activities from user messages. Return ONLY valid JSON, no markdown.

Valid categories and their sub-categories (unit):
${FACTOR_CATALOGUE}

If the user describes a specific activity they did/are reporting WITH a measurable quantity, return:
{"detected":true,"category":"...","subCategory":"...","quantity":NUMBER}

Otherwise return: {"detected":false}

Rules:
- quantity must be a positive number
- only return detected:true when confident about all three fields
- for flights with city names, estimate km (e.g. Karachi→Lahore ≈ 1050, Lahore→Dubai ≈ 2150)
- do NOT detect questions, tips requests, or general discussion as activities`,
        },
        { role: 'user', content: text },
      ],
    });

    let raw = (resp.choices[0]?.message?.content ?? '').trim()
      .replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/i, '').trim();
    const parsed = JSON.parse(raw);
    if (!parsed.detected) return null;

    const fi = FACTORS[parsed.category]?.[parsed.subCategory];
    if (!fi || !(parsed.quantity > 0)) return null;

    return {
      category:    parsed.category,
      subCategory: parsed.subCategory,
      quantity:    parsed.quantity,
      unit:        fi.unit,
      label:       fi.label,
      scope:       fi.scope,
      valueKg:     parseFloat((parsed.quantity * fi.factor).toFixed(4)),
    };
  } catch {
    return null;
  }
}

/* ── Build system prompt with user's live carbon data ── */
async function buildSystemPrompt(userId, isAdmin) {
  const userWhere = isAdmin ? {} : { userId };
  let dataBlock   = 'The user has not logged any carbon entries yet. Encourage them to use Activities → Calculator.';

  try {
    const entries = await prisma.carbonEntry.findMany({
      where:   userWhere,
      select:  { valueKg: true, category: true, subCategory: true, scope: true, entryDate: true },
      orderBy: { entryDate: 'desc' },
    });

    if (entries.length > 0) {
      const total   = entries.reduce((s, e) => s + e.valueKg, 0);
      const catMap  = {};
      entries.forEach(e => { catMap[e.category] = (catMap[e.category] ?? 0) + e.valueKg; });
      const byCategory = Object.entries(catMap).sort((a,b)=>b[1]-a[1])
        .map(([c,kg]) => `${c}: ${kg.toFixed(2)} kg (${(kg/total*100).toFixed(1)}%)`).join(', ');

      const scopeMap = {};
      entries.forEach(e => { scopeMap[e.scope] = (scopeMap[e.scope] ?? 0) + e.valueKg; });
      const byScope = Object.entries(scopeMap)
        .map(([s,kg]) => `${s}: ${kg.toFixed(2)} kg`).join(', ');

      const subMap = {};
      entries.forEach(e => { subMap[e.subCategory] = (subMap[e.subCategory] ?? 0) + e.valueKg; });
      const topSub = Object.entries(subMap).sort((a,b)=>b[1]-a[1])[0];

      const cutoff = new Date();
      cutoff.setMonth(cutoff.getMonth() - 3);
      const recent = entries.filter(e => new Date(e.entryDate) >= cutoff)
        .reduce((s,e) => s + e.valueKg, 0);

      dataBlock = [
        `Total logged: ${total.toFixed(2)} kg CO₂e across ${entries.length} entries`,
        `By category: ${byCategory}`,
        `By GHG scope: ${byScope}`,
        `Biggest single source: ${topSub[0].replace(/_/g,' ')} — ${topSub[1].toFixed(2)} kg`,
        `Last 3 months: ${recent.toFixed(2)} kg CO₂e`,
        isAdmin ? '(Organisation-wide data — all employees combined.)' : '',
      ].filter(Boolean).join('\n');
    }
  } catch (_) {}

  return `You are CarbonX AI — an expert carbon management and sustainability assistant embedded in the CarbonX platform, a GHG emission tracking tool used by organisations in Pakistan.

EXPERTISE:
- GHG Protocol: Scope 1 (direct), Scope 2 (indirect electricity), Scope 3 (value chain)
- Carbon accounting, emission factors, net-zero pathways, science-based targets (SBTs)
- Pakistan-specific context: NEPRA electricity grid factor (0.45 kg CO₂e/kWh), NCCC standards
- Practical, actionable reduction strategies for individuals and organisations

LANGUAGE RULES (strictly follow):
- If the user writes in English → respond in English
- If the user writes in Roman Urdu (Urdu in Latin script, e.g. "mera footprint kam karna hai") → respond in Roman Urdu
- If the user mixes both → match their mix naturally
- Always be warm, encouraging, and specific

RESPONSE STYLE:
- Concise but complete. Use **bold** for key terms
- Bullet points (•) for lists
- Under 280 words unless asked for detail
- Reference the user's real emission data when relevant

USER'S CURRENT EMISSION DATA:
${dataBlock}`;
}

/* ── Derive a short title from the first user message ── */
function deriveTitle(text) {
  const clean = text.trim().replace(/\s+/g, ' ');
  return clean.length > 52 ? clean.slice(0, 50) + '…' : clean;
}

/* ════════════════════════════════════════════════
   POST /api/chat  — streaming SSE, persists messages
   Body: { messages, conversationId? }
════════════════════════════════════════════════ */
async function chat(req, res, next) {
  try {
    const { messages, conversationId: existingId } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return errorResponse(res, 'messages array is required.', 400);
    }
    if (!process.env.GROQ_API_KEY) {
      return errorResponse(res, 'GROQ_API_KEY is not set. Add it to Railway environment variables. Free key at console.groq.com', 503);
    }

    /* Resolve or create conversation */
    let conv;
    if (existingId) {
      conv = await prisma.conversation.findFirst({
        where: { id: parseInt(existingId), userId: req.user.id },
      });
      if (!conv) return errorResponse(res, 'Conversation not found.', 404);
    } else {
      conv = await prisma.conversation.create({
        data: { userId: req.user.id, title: 'New Chat' },
      });
    }

    /* Save the latest user message */
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
    if (lastUserMsg) {
      await prisma.message.create({
        data: {
          conversationId: conv.id,
          role:    'user',
          content: String(lastUserMsg.text || lastUserMsg.content || ''),
        },
      });

      /* Auto-title on first real message */
      if (conv.title === 'New Chat') {
        await prisma.conversation.update({
          where: { id: conv.id },
          data:  { title: deriveTitle(lastUserMsg.text || lastUserMsg.content || '') },
        });
      }
    }

    /* Run system prompt build + activity extraction in parallel */
    const userText = String(lastUserMsg?.text || lastUserMsg?.content || '');
    const [systemPrompt, activityCard] = await Promise.all([
      buildSystemPrompt(req.user.id, req.user.role === 'ADMIN'),
      extractActivity(userText),
    ]);

    /* SSE stream headers */
    res.writeHead(200, {
      'Content-Type':      'text/event-stream',
      'Cache-Control':     'no-cache',
      'Connection':        'keep-alive',
      'X-Accel-Buffering': 'no',
    });

    /* First event: conversationId so frontend can track the thread */
    res.write(`data: ${JSON.stringify({ init: true, conversationId: conv.id })}\n\n`);

    /* Activity card event — if extraction detected an activity */
    if (activityCard) {
      res.write(`data: ${JSON.stringify({ activityCard })}\n\n`);
    }

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    /* Last 12 messages as history */
    const history = messages.slice(-12).map(m => ({
      role:    m.role === 'user' ? 'user' : 'assistant',
      content: String(m.text || m.content || ''),
    }));

    const stream = await groq.chat.completions.create({
      model:       'llama-3.3-70b-versatile',
      max_tokens:  1024,
      temperature: 0.7,
      messages: [{ role: 'system', content: systemPrompt }, ...history],
      stream: true,
    });

    let fullReply = '';
    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content ?? '';
      if (text) {
        fullReply += text;
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
      }
    }

    /* Persist assistant reply */
    if (fullReply) {
      await prisma.message.create({
        data: {
          conversationId: conv.id,
          role:    'assistant',
          content: fullReply,
        },
      });
      /* Bump updatedAt */
      await prisma.conversation.update({
        where: { id: conv.id },
        data:  { updatedAt: new Date() },
      });
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
