const OpenAI = require('openai');

/*
 * Provider-agnostic LLM client (OpenAI-compatible API).
 *
 * Works with any OpenAI-compatible provider (Groq, Gemini, OpenRouter, OpenAI,
 * or a local Ollama). Switching provider is only a matter of changing
 * LLM_BASE_URL / LLM_API_KEY / LLM_MODEL in backend/.env.
 */
const BASE_URL   = process.env.LLM_BASE_URL   || 'https://api.groq.com/openai/v1';
const API_KEY    = process.env.LLM_API_KEY    || process.env.GROQ_API_KEY || 'missing';
const MODEL      = process.env.LLM_MODEL      || 'llama-3.3-70b-versatile';
const FAST_MODEL = process.env.LLM_FAST_MODEL || MODEL;
const TIMEOUT_MS = parseInt(process.env.LLM_TIMEOUT_MS || '60000');
/* Tried when the primary model is overloaded (503) or rate-limited (429) */
const FALLBACK_MODEL = process.env.LLM_FALLBACK_MODEL || FAST_MODEL;

const client = new OpenAI({ baseURL: BASE_URL, apiKey: API_KEY, timeout: TIMEOUT_MS, maxRetries: 1 });

/* e.g. "none" stops Gemini "thinking" models spending the max_tokens budget before answering */
const REASONING_EFFORT = process.env.LLM_REASONING_EFFORT;

const rawCreate = client.chat.completions.create.bind(client.chat.completions);
client.chat.completions.create = async (params, options) => {
  /* Only the main model gets it; Gemini lite models reject reasoning_effort */
  if (REASONING_EFFORT && params.model === MODEL) params = { ...params, reasoning_effort: REASONING_EFFORT };
  try {
    return await rawCreate(params, options);
  } catch (err) {
    if (![429, 503].includes(err.status) || params.model === FALLBACK_MODEL) throw err;
    const { reasoning_effort, ...rest } = params;
    return rawCreate({ ...rest, model: FALLBACK_MODEL }, options);
  }
};

async function isAvailable() {
  if (API_KEY === 'missing') return false;
  try {
    await client.models.list({ timeout: 3000 });
    return true;
  } catch {
    return false;
  }
}

/*
 * Small local models often wrap JSON in prose or code fences; pull out the first JSON value.
 * Throws when nothing parses and no fallback is given, so callers can drop to rule-based output.
 */
function parseJSON(text, fallback) {
  const raw = String(text ?? '').replace(/```[a-z]*\n?/gi, '').trim();
  try { return JSON.parse(raw); } catch { /* try extraction below */ }
  const match = raw.match(/(\[[\s\S]*\]|\{[\s\S]*\})/);
  if (match) {
    try { return JSON.parse(match[1]); } catch { /* fall through */ }
  }
  if (fallback === undefined) throw new Error('LLM returned no parseable JSON');
  return fallback;
}

module.exports = { llm: client, MODEL, FAST_MODEL, isAvailable, parseJSON };
