const { prisma }                         = require('../config/db');
const { successResponse, errorResponse } = require('../utils/response');
const { CHALLENGES }                     = require('../data/challenges');
const { OFFSET_PROJECTS }                = require('../data/offsetProjects');
const Groq                               = require('groq-sdk').default;

/* ════════════════════════════════════════════════
   PERSONALISED RECOMMENDATIONS
   AI-powered via Groq LLaMA, driven by real carbon data
════════════════════════════════════════════════ */
async function getRecommendations(req, res, next) {
  try {
    const isAdmin   = req.user.role === 'ADMIN';
    const userWhere = isAdmin ? {} : { userId: req.user.id };

    const since = new Date();
    since.setDate(since.getDate() - 30);

    const entries = await prisma.carbonEntry.findMany({
      where:  { ...userWhere, entryDate: { gte: since } },
      select: { valueKg: true, category: true, subCategory: true },
    });

    if (!entries.length) {
      return successResponse(res, {
        recommendations: [],
        dataAvailable:   false,
        message:         'Log at least one carbon entry to receive personalised recommendations.',
      });
    }

    const total   = entries.reduce((s, e) => s + e.valueKg, 0);
    const catMap  = {};
    const subMap  = {};
    entries.forEach(e => {
      catMap[e.category]    = (catMap[e.category]    ?? 0) + e.valueKg;
      subMap[e.subCategory] = (subMap[e.subCategory] ?? 0) + e.valueKg;
    });

    const pct = (cat) => total > 0 ? (catMap[cat] ?? 0) / total * 100 : 0;

    /* Build data summary for LLaMA */
    const dataStr = `
User's carbon emissions (last 30 days):
- Total: ${total.toFixed(1)} kg CO₂e
- Breakdown by category:
  * Commute: ${catMap.commute?.toFixed(1) ?? 0} kg (${pct('commute').toFixed(0)}%)
  * Energy: ${catMap.energy?.toFixed(1) ?? 0} kg (${pct('energy').toFixed(0)}%)
  * Food: ${catMap.food?.toFixed(1) ?? 0} kg (${pct('food').toFixed(0)}%)
  * Travel: ${catMap.travel?.toFixed(1) ?? 0} kg (${pct('travel').toFixed(0)}%)
- Top emission sources: car=${subMap.car_petrol?.toFixed(1) ?? 0}, electricity=${subMap.electricity?.toFixed(1) ?? 0}, beef=${subMap.beef?.toFixed(1) ?? 0}

Context: This user is from Pakistan. Use local examples and familiar solutions.
${isAdmin ? 'NOTE: This is an ADMIN user viewing organization-wide data.' : ''}
    `.trim();

    const prompt = `You are a carbon footprint expert advisor. Based on the following user's carbon data, generate exactly 3 concrete, personalized recommendations.

${dataStr}

For each recommendation, provide a JSON object with these fields (NO extra text, ONLY valid JSON array):
- id: unique slug (e.g. "switch_to_bus")
- title: clear action title
- summary: 1-2 sentence explanation with actual kg numbers from their data
- category: one of [commute, energy, food, travel, general, organisation]
- priority: high|medium|low (based on their actual emissions in that category)
- icon: single emoji
- impact: estimated kg saved per month (e.g. "−24.5 kg CO₂e/month")
- effort: Low effort|Medium effort|High effort
- steps: array of 3 actionable steps (specific to Pakistan if relevant)

Return ONLY a valid JSON array of 3 objects. No explanations, no markdown.`;

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const completion = await groq.chat.completions.create({
      model:       'llama-3.3-70b-versatile',
      messages:    [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens:  1500,
    });

    let recs = [];
    try {
      const aiResponse = completion.choices[0]?.message?.content || '[]';
      recs = JSON.parse(aiResponse);
      if (!Array.isArray(recs)) recs = [];
      recs = recs.slice(0, 3); // Max 3
    } catch (e) {
      console.warn('LLaMA response parse failed, falling back to rules', e.message);
      recs = await getFallbackRecommendations(catMap, subMap, total, isAdmin);
    }

    const priority = { high: 0, medium: 1, low: 2 };
    recs.sort((a, b) => (priority[a.priority] ?? 2) - (priority[b.priority] ?? 2));

    return successResponse(res, {
      recommendations: recs,
      dataAvailable:   true,
      totalKg:         parseFloat(total.toFixed(2)),
      period:          '30 days',
      aiGenerated:     true,
    });
  } catch (err) { next(err); }
}

/* Fallback rule-based recommendations if LLaMA fails */
async function getFallbackRecommendations(catMap, subMap, total, isAdmin) {
  const pct = (cat) => total > 0 ? (catMap[cat] ?? 0) / total * 100 : 0;
  const recs = [];

  const carKg = (subMap.car_petrol ?? 0) + (subMap.car_diesel ?? 0);
  if (carKg > 0 && pct('commute') > 20) {
    recs.push({
      id: 'switch_to_bus',
      category: 'commute',
      priority: pct('commute') > 45 ? 'high' : 'medium',
      icon: '🚌',
      title: 'Switch Your Daily Commute to Public Transport',
      summary: `Your car contributes ${carKg.toFixed(1)} kg CO₂e this month (${pct('commute').toFixed(0)}% of your total). Taking the bus instead saves up to ${(carKg * 0.54).toFixed(1)} kg.`,
      impact: `−${(carKg * 0.54).toFixed(1)} kg CO₂e/month`,
      effort: 'Low effort',
      steps: [
        'Check Google Maps for bus routes to your office',
        'Start with 2–3 bus days per week',
        'Use commute time for podcasts or reading',
      ],
    });
  }

  if (recs.length < 3) {
    const beefKg = subMap.beef ?? 0;
    if (beefKg > 0) {
      recs.push({
        id: 'reduce_beef',
        category: 'food',
        priority: beefKg > 25 ? 'high' : 'medium',
        icon: '🥗',
        title: 'Replace Beef Meals with Lower-Emission Alternatives',
        summary: `Beef is ${beefKg.toFixed(1)} kg CO₂e this month. Switching half your beef meals to chicken saves ${(beefKg * 0.43).toFixed(1)} kg.`,
        impact: `−${(beefKg * 0.43).toFixed(1)} kg CO₂e/month`,
        effort: 'Low effort',
        steps: [
          'Try chicken biryani instead of beef',
          'Daal (lentils) are nutrient-rich and nearly zero-emission',
          'Aim for one beef-free day per week',
        ],
      });
    }
  }

  if (recs.length < 3) {
    const elecKg = subMap.electricity ?? 0;
    if (elecKg > 0 && pct('energy') > 20) {
      recs.push({
        id: 'reduce_electricity',
        category: 'energy',
        priority: pct('energy') > 40 ? 'high' : 'medium',
        icon: '⚡',
        title: 'Reduce Your Electricity Footprint',
        summary: `Electricity is ${pct('energy').toFixed(0)}% of your emissions (${elecKg.toFixed(1)} kg). Setting AC to 26°C and switching to LED can save ~20%.`,
        impact: `−${(elecKg * 0.20).toFixed(1)} kg CO₂e/month`,
        effort: 'Low effort',
        steps: [
          'Set AC thermostat to 26°C',
          'Replace bulbs with LED (75% less energy)',
          'Unplug devices at night',
        ],
      });
    }
  }

  return recs;
}

/* ════════════════════════════════════════════════
   CHALLENGES
════════════════════════════════════════════════ */

/* GET /api/insights/challenges — list all + user's join status */
async function listChallenges(req, res, next) {
  try {
    const userJoined = await prisma.userChallenge.findMany({
      where: { userId: req.user.id },
      select: { challengeId: true, status: true, startedAt: true, completedAt: true },
    });
    const joinMap = Object.fromEntries(userJoined.map(uc => [uc.challengeId, uc]));

    const result = CHALLENGES.map(c => ({
      ...c,
      userStatus:   joinMap[c.id]?.status   ?? null,
      startedAt:    joinMap[c.id]?.startedAt  ?? null,
      completedAt:  joinMap[c.id]?.completedAt ?? null,
    }));

    return successResponse(res, result, 'Challenges fetched.');
  } catch (err) { next(err); }
}

/* POST /api/insights/challenges/:id/join */
async function joinChallenge(req, res, next) {
  try {
    const { id } = req.params;
    const challenge = CHALLENGES.find(c => c.id === id);
    if (!challenge) return errorResponse(res, 'Challenge not found.', 404);

    const existing = await prisma.userChallenge.findUnique({
      where: { userId_challengeId: { userId: req.user.id, challengeId: id } },
    });
    if (existing) {
      if (existing.status === 'active')
        return errorResponse(res, 'You have already joined this challenge.', 409);
      // Re-join abandoned challenge
      await prisma.userChallenge.update({
        where: { userId_challengeId: { userId: req.user.id, challengeId: id } },
        data:  { status: 'active', startedAt: new Date(), completedAt: null },
      });
    } else {
      await prisma.userChallenge.create({
        data: { userId: req.user.id, challengeId: id },
      });
    }

    return successResponse(res, { challengeId: id, status: 'active' }, `Joined: ${challenge.title}`);
  } catch (err) { next(err); }
}

/* PATCH /api/insights/challenges/:id/complete */
async function completeChallenge(req, res, next) {
  try {
    const { id } = req.params;
    const uc = await prisma.userChallenge.findUnique({
      where: { userId_challengeId: { userId: req.user.id, challengeId: id } },
    });
    if (!uc)              return errorResponse(res, 'You have not joined this challenge.', 404);
    if (uc.status === 'completed') return errorResponse(res, 'Already completed.', 409);

    await prisma.userChallenge.update({
      where: { userId_challengeId: { userId: req.user.id, challengeId: id } },
      data:  { status: 'completed', completedAt: new Date() },
    });

    const challenge = CHALLENGES.find(c => c.id === id);
    return successResponse(res, { challengeId: id, status: 'completed' },
      `Challenge completed! You saved ~${challenge?.targetKg ?? 0} kg CO₂e. 🎉`);
  } catch (err) { next(err); }
}

/* DELETE /api/insights/challenges/:id/leave */
async function leaveChallenge(req, res, next) {
  try {
    const { id } = req.params;
    await prisma.userChallenge.updateMany({
      where: { userId: req.user.id, challengeId: id, status: 'active' },
      data:  { status: 'abandoned' },
    });
    return successResponse(res, null, 'Left challenge.');
  } catch (err) { next(err); }
}

/* ════════════════════════════════════════════════
   OFFSET PROJECTS  (admin only)
════════════════════════════════════════════════ */
async function getOffsetProjects(req, res) {
  return successResponse(res, OFFSET_PROJECTS, 'Offset projects fetched.');
}

module.exports = {
  getRecommendations,
  listChallenges, joinChallenge, completeChallenge, leaveChallenge,
  getOffsetProjects,
};
