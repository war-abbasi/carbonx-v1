/**
 * Quick check that the AI provider in backend/.env answers.
 * Usage: node scripts/checkAI.js
 */
require('dotenv').config();
const { llm, MODEL, FAST_MODEL } = require('../services/llm');

async function ping(model) {
  const started = Date.now();
  const resp = await llm.chat.completions.create({
    model,
    max_tokens: 50,
    messages: [{ role: 'user', content: 'Reply with exactly: CarbonX AI online' }],
  });
  console.log(`  ✓ ${model} (${Date.now() - started} ms): ${resp.choices[0]?.message?.content?.trim()}`);
}

(async () => {
  console.log(`Provider: ${process.env.LLM_BASE_URL}`);
  try {
    await ping(MODEL);
    if (FAST_MODEL !== MODEL) await ping(FAST_MODEL);
    console.log('\nAI is working.');
  } catch (e) {
    console.error(`  ✗ ${e.status ?? ''} ${e.message}`);
    console.error('\nCheck LLM_API_KEY / LLM_MODEL in backend/.env.');
    process.exit(1);
  }
})();
