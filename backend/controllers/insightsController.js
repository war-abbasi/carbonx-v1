const { prisma }                         = require('../config/db');
const { successResponse, errorResponse } = require('../utils/response');
const { CHALLENGES }                     = require('../data/challenges');
const { OFFSET_PROJECTS }                = require('../data/offsetProjects');
const { llm, MODEL, parseJSON }         = require('../services/llm');

/* ════════════════════════════════════════════════
   PERSONALISED RECOMMENDATIONS
   AI-powered via the local LLM (services/llm.js), driven by real carbon data
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

    let recs = [];
    try {
      const completion = await llm.chat.completions.create({
        model:       MODEL,
        messages:    [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens:  1500,
      });
      const aiResponse = completion.choices[0]?.message?.content || '[]';
      recs = parseJSON(aiResponse);
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

/* ════════════════════════════════════════════════
   AI REPORT GENERATOR (admin only)
════════════════════════════════════════════════ */
async function generateReport(req, res, next) {
  try {
    if (req.user.role !== 'ADMIN') return errorResponse(res, 'Admin only.', 403);

    // Fetch org-wide data
    const allEntries = await prisma.carbonEntry.findMany({
      select: { valueKg: true, category: true, subCategory: true, userId: true, entryDate: true },
    });

    if (!allEntries.length) {
      return successResponse(res, {
        report: '# Sustainability Report\n\nNo carbon data logged yet. Start tracking to generate insights.',
        generated: false,
      });
    }

    // Aggregate by user + category
    const userMap = {};
    const catMap = {};
    const monthMap = {};
    const subMap = {};

    allEntries.forEach(e => {
      userMap[e.userId] = (userMap[e.userId] ?? 0) + e.valueKg;
      catMap[e.category] = (catMap[e.category] ?? 0) + e.valueKg;
      subMap[e.subCategory] = (subMap[e.subCategory] ?? 0) + e.valueKg;

      const d = new Date(e.entryDate);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthMap[key] = (monthMap[key] ?? 0) + e.valueKg;
    });

    const totalKg = allEntries.reduce((s, e) => s + e.valueKg, 0);
    const avgPerUser = totalKg / Object.keys(userMap).length;
    const topEmitter = Object.entries(userMap).sort(([,a], [,b]) => b - a)[0];
    const topCategory = Object.entries(catMap).sort(([,a], [,b]) => b - a)[0];
    const sortedMonths = Object.entries(monthMap).sort(([a], [b]) => a.localeCompare(b));
    const monthlyTrend = sortedMonths.length >= 2
      ? ((sortedMonths[sortedMonths.length - 1][1] - sortedMonths[0][1]) / sortedMonths[0][1] * 100).toFixed(1)
      : 'N/A';

    const topUsers = Object.entries(userMap)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([uId, kg], i) => `${i+1}. User #${uId}: ${kg.toFixed(1)} kg`);

    const dataStr = `
Organization Carbon Footprint Report

Total Emissions: ${totalKg.toFixed(1)} kg CO₂e
Employees: ${Object.keys(userMap).length}
Average per Employee: ${avgPerUser.toFixed(1)} kg CO₂e

Top Emission Sources (kg):
- ${topCategory[0]}: ${topCategory[1].toFixed(1)} kg (${(topCategory[1]/totalKg*100).toFixed(0)}%)
- Top emitter: User #${topEmitter[0]} with ${topEmitter[1].toFixed(1)} kg

Top 5 Employees by Emissions:
${topUsers.join('\n')}

Monthly Trend: ${monthlyTrend}% over ${sortedMonths.length} months
Recent Month (latest): ${sortedMonths[sortedMonths.length - 1]?.[1]?.toFixed(1) ?? 'N/A'} kg

Breakdown by Category:
${Object.entries(catMap)
  .sort(([,a], [,b]) => b - a)
  .map(([cat, kg]) => `- ${cat}: ${kg.toFixed(1)} kg (${(kg/totalKg*100).toFixed(1)}%)`)
  .join('\n')}
    `.trim();

    const prompt = `You are a corporate sustainability consultant. Based on this organization's carbon data, write a professional 1-page sustainability report. Include:

${dataStr}

Generate a report with:
1. Executive Summary (2-3 sentences on total emissions, trend, and key insight)
2. Key Findings (3-4 bullet points: top sources, biggest contributor, opportunity area)
3. Recommendations (3-4 specific, actionable steps the organization can take)
4. Commitment Proposal (suggest a 6-month or 12-month emission reduction goal and how to achieve it)

Format in markdown. Be specific with numbers and percentages from the data provided.`;

    let report;
    try {
      const completion = await llm.chat.completions.create({
        model:       MODEL,
        messages:    [{ role: 'user', content: prompt }],
        temperature: 0.8,
        max_tokens:  1200,
      });
      report = completion.choices[0]?.message?.content;
    } catch (e) {
      console.warn('Report LLM call failed, using data-only report', e.message);
    }
    /* LLM offline or empty → still give the admin a report built from the numbers */
    if (!report) report = `# Sustainability Report\n\n## Data Summary\n\n${dataStr}`;

    return successResponse(res, {
      report,
      generated: true,
      stats: {
        totalKg: parseFloat(totalKg.toFixed(1)),
        employees: Object.keys(userMap).length,
        topCategory: topCategory[0],
        trend: monthlyTrend,
      },
    }, 'Report generated successfully.');
  } catch (err) { next(err); }
}

/* ════════════════════════════════════════════════
   AI GOAL SETTING
════════════════════════════════════════════════ */
async function getSuggestedGoals(req, res, next) {
  try {
    const isAdmin = req.user.role === 'ADMIN';
    const userWhere = isAdmin ? {} : { userId: req.user.id };

    // Get last 60 days of data
    const since = new Date();
    since.setDate(since.getDate() - 60);

    const entries = await prisma.carbonEntry.findMany({
      where:  { ...userWhere, entryDate: { gte: since } },
      select: { valueKg: true, entryDate: true },
      orderBy: { entryDate: 'asc' },
    });

    if (entries.length < 5) {
      return successResponse(res, {
        goals: [],
        message: 'Log at least 5 entries over a few weeks to get personalized goals.',
      });
    }

    // Calculate current trajectory
    const monthMap = {};
    entries.forEach(e => {
      const d = new Date(e.entryDate);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthMap[key] = (monthMap[key] ?? 0) + e.valueKg;
    });

    const sortedMonths = Object.entries(monthMap).sort(([a], [b]) => a.localeCompare(b));
    const currentMonth = sortedMonths[sortedMonths.length - 1];
    const prevMonth = sortedMonths[sortedMonths.length - 2];
    const currentKg = currentMonth ? currentMonth[1] : 0;
    const prevKg = prevMonth ? prevMonth[1] : currentKg;
    const monthlyTrend = ((currentKg - prevKg) / (prevKg || 1) * 100).toFixed(1);

    const avgMonthly = sortedMonths.reduce((s, [,kg]) => s + kg, 0) / sortedMonths.length;
    const dailyAvg = currentKg / 30;

    const prompt = `You are a climate coach. Given a user's current carbon footprint, suggest 3 realistic reduction goals for 3 months, 6 months, and 12 months. The goals should be achievable, motivating, and specific.

Current Emissions:
- Current month: ${currentKg.toFixed(1)} kg CO₂e
- Monthly trend: ${monthlyTrend}% (${monthlyTrend > 0 ? 'increasing' : 'decreasing'})
- Average monthly: ${avgMonthly.toFixed(1)} kg
- Daily average: ${dailyAvg.toFixed(1)} kg

Create 3 reduction goals with:
1. Period (3 months, 6 months, 12 months)
2. Target kg CO₂e (specific number, realistic reduction of 10-35% per goal)
3. Primary strategy (e.g., reduce commute, switch diet, lower energy)
4. Confidence level (Low/Medium/High — based on how achievable it is)

Return ONLY a valid JSON array with 3 objects:
{ "period": "3 months", "targetKg": NUMBER, "strategy": "...", "confidence": "High", "rationale": "..." }`;

    let goals = [];
    try {
      const completion = await llm.chat.completions.create({
        model:       MODEL,
        messages:    [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens:  800,
      });
      const aiResponse = completion.choices[0]?.message?.content || '[]';
      goals = parseJSON(aiResponse);
      if (!Array.isArray(goals)) goals = [];
      goals = goals.slice(0, 3);
    } catch (e) {
      console.warn('Goal parsing failed, returning basic goals');
      const r = 0.15; // 15% reduction per period
      goals = [
        { period: '3 months', targetKg: Math.max(0, avgMonthly * (1 - r)), strategy: 'Start with one main source (commute or diet)', confidence: 'High' },
        { period: '6 months', targetKg: Math.max(0, avgMonthly * (1 - r * 2)), strategy: 'Combine 2-3 action areas for compounding impact', confidence: 'Medium' },
        { period: '12 months', targetKg: Math.max(0, avgMonthly * (1 - r * 3)), strategy: 'Establish sustainable habits across all categories', confidence: 'Medium' },
      ];
    }

    // Add context
    goals = goals.map(g => ({
      ...g,
      targetKg: parseFloat(Number(g.targetKg).toFixed(1)),
      reduction: parseFloat(((avgMonthly - Number(g.targetKg)) / avgMonthly * 100).toFixed(1)),
      currentKg: parseFloat(avgMonthly.toFixed(1)),
    }));

    return successResponse(res, {
      goals,
      currentMonthly: parseFloat(currentKg.toFixed(1)),
      monthlyTrend: parseFloat(monthlyTrend),
      message: 'AI-generated reduction goals based on your trajectory.',
    });
  } catch (err) { next(err); }
}

/* ════════════════════════════════════════════════
   AI CHALLENGE SUGGESTER
════════════════════════════════════════════════ */
async function suggestChallenge(req, res, next) {
  try {
    const since = new Date();
    since.setDate(since.getDate() - 30);

    const entries = await prisma.carbonEntry.findMany({
      where:  { userId: req.user.id, entryDate: { gte: since } },
      select: { valueKg: true, category: true, subCategory: true },
    });

    if (!entries.length) {
      return successResponse(res, {
        suggestion: null,
        message: 'Log at least one entry to get a challenge suggestion.',
      });
    }

    // Find top emission source
    const subMap = {};
    entries.forEach(e => {
      subMap[e.subCategory] = (subMap[e.subCategory] ?? 0) + e.valueKg;
    });
    const topSource = Object.entries(subMap).sort(([,a], [,b]) => b - a)[0];

    // Get user's completed challenges
    const completed = await prisma.userChallenge.findMany({
      where: { userId: req.user.id, status: 'completed' },
      select: { challengeId: true },
    });
    const completedIds = new Set(completed.map(c => c.challengeId));

    // Map sub-category to challenge category
    const CATEGORY_MAP = {
      car_petrol: 'commute', car_diesel: 'commute', car_electric: 'commute', motorbike: 'commute', bus: 'commute', train: 'commute', walking: 'commute',
      electricity: 'energy', natural_gas: 'energy', lpg: 'energy', diesel_gen: 'energy',
      flight_short: 'travel', flight_long: 'travel', car_rental: 'travel', taxi: 'travel',
      beef: 'food', chicken: 'food', fish: 'food', vegetarian: 'food', vegan: 'food',
    };
    const topCategory = CATEGORY_MAP[topSource[0]] || 'general';

    // Filter available challenges that match or complement top source
    const matching = CHALLENGES.filter(c =>
      (c.category === topCategory || c.category === 'general') && !completedIds.has(c.id)
    );
    const available = CHALLENGES.filter(c => !completedIds.has(c.id));

    const topSourceStr = topSource[0] || 'general';
    const dataStr = `
User's top emission source (last 30 days): ${topSourceStr} = ${topSource[1].toFixed(1)} kg
Total emissions: ${entries.reduce((s, e) => s + e.valueKg, 0).toFixed(1)} kg

Available challenges (user has not completed):
${available.slice(0, 10).map(c => `- ${c.id}: ${c.title} (${c.category}, difficulty: ${c.difficulty}, saves ~${c.targetKg} kg)`).join('\n')}

Matching category challenges:
${matching.slice(0, 5).map(c => `- ${c.id}: ${c.title}`).join('\n')}`;

    const prompt = `You are a carbon reduction coach. Given the user's top emission source and available challenges, suggest the SINGLE MOST IMPACTFUL challenge they should do next.

${dataStr}

Consider:
1. Does the challenge directly address their top source?
2. Is it realistic for them (difficulty matching)?
3. Will it save the most CO₂e?

Return ONLY a JSON object:
{ "challengeId": "STRING", "reasoning": "Why this challenge will have the most impact for this user" }`;

    let suggestion = null;
    try {
      const completion = await llm.chat.completions.create({
        model:       MODEL,
        messages:    [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens:  400,
      });
      const aiResponse = completion.choices[0]?.message?.content || '{}';
      const parsed = parseJSON(aiResponse);
      const chal = CHALLENGES.find(c => c.id === parsed.challengeId);
      if (chal) {
        suggestion = {
          challengeId: parsed.challengeId,
          challenge: chal,
          reasoning: parsed.reasoning || 'Recommended to address your top emission source.',
        };
      }
    } catch (e) {
      // Fallback: pick highest-impact matching challenge
      if (matching.length > 0) {
        const best = matching.sort((a, b) => b.targetKg - a.targetKg)[0];
        suggestion = {
          challengeId: best.id,
          challenge: best,
          reasoning: `Directly targets your top source (${topSourceStr}). Expected savings: ${best.targetKg} kg CO₂e.`,
        };
      }
    }

    return successResponse(res, {
      suggestion,
      topSource: topSourceStr,
      topSourceKg: parseFloat(topSource[1].toFixed(1)),
      message: suggestion ? 'Challenge suggested based on your emissions profile.' : 'No suggestion available.',
    });
  } catch (err) { next(err); }
}

/* ════════════════════════════════════════════════
   ML FORECASTING & PREDICTIONS
   Powered by ML microservice (Prophet, XGBoost, Holt-Winters)
════════════════════════════════════════════════ */

const mlService = require('../api/mlServiceClient');
const logger    = require('../utils/logger');

/**
 * Generate carbon emissions forecast
 * GET /api/insights/forecast?months=12
 */
async function getForecast(req, res, next) {
  try {
    const userId = req.user.id;
    const months = Math.min(parseInt(req.query.months) || 12, 24); // Max 24 months
    const forceRefresh = req.query.refresh === 'true';

    logger.info(`[Forecast] Forecast request for user ${userId} (refresh=${forceRefresh})`);

    // Get user's carbon entries
    const entries = await prisma.carbonEntry.findMany({
      where: { userId },
      select: { entryDate: true, valueKg: true },
      orderBy: { entryDate: 'asc' }
    });

    // Check minimum data
    if (entries.length < 2) {
      return successResponse(res, {
        success: false,
        error: 'Insufficient data. Need at least 2 months of historical data.',
        dataPoints: entries.length,
        message: 'Log carbon entries to enable forecasting.'
      }, 400);
    }

    // Group by month
    const monthlyData = {};
    entries.forEach(entry => {
      const month = entry.entryDate.toISOString().slice(0, 7); // YYYY-MM
      if (!monthlyData[month]) monthlyData[month] = 0;
      monthlyData[month] += entry.valueKg;
    });

    const sortedMonths   = Object.keys(monthlyData).sort();
    const historicalData = sortedMonths.map(m => monthlyData[m]);
    const historical     = sortedMonths.map(m => ({ month: m, value: Math.round(monthlyData[m]) }));

    // ── Cache: reuse the most recent stored forecast when nothing material
    //    changed (same horizon, same #months of data) and it is < 24h old.
    //    This avoids retraining all 3 models on every page view.
    if (!forceRefresh) {
      const cached = await prisma.forecast.findFirst({
        where: { userId, monthsAhead: months, dataPoints: historicalData.length },
        orderBy: { createdAt: 'desc' }
      }).catch(() => null);

      const DAY = 24 * 60 * 60 * 1000;
      if (cached && (Date.now() - new Date(cached.createdAt).getTime()) < DAY) {
        logger.info(`[Forecast] Serving cached forecast #${cached.id} for user ${userId}`);
        return successResponse(res, {
          success: true,
          forecast: cached.payload,
          historical: cached.historical,
          dataPoints: cached.dataPoints,
          months,
          cached: true,
          generatedAt: cached.createdAt,
          timestamp: new Date().toISOString()
        });
      }
    }

    // Call ML service (User has no org/employee fields → empty employee list)
    const forecast = await mlService.generateForecast(
      `org_${userId}`,
      historicalData,
      { months, employeeCounts: [], startDate: sortedMonths[0] }
    );

    // Persist for history + caching (best-effort; never block the response)
    prisma.forecast.create({
      data: {
        userId,
        bestModel:   forecast.best_model || 'unknown',
        monthsAhead: months,
        dataPoints:  historicalData.length,
        payload:     forecast,
        historical:  historical
      }
    }).catch(err => logger.warn(`Could not store forecast: ${err.message}`));

    return successResponse(res, {
      success: true,
      forecast,
      historical,
      dataPoints: historicalData.length,
      months,
      cached: false,
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    logger.error(`Forecast error: ${err.message}`);
    return errorResponse(res, 'Failed to generate forecast', 500);
  }
}

/**
 * Compare all 3 ML models (Admin only)
 * GET /api/insights/compare-models
 */
async function compareModels(req, res, next) {
  try {
    // Check admin permission
    if (req.user.role !== 'ADMIN') {
      return errorResponse(res, 'Only admins can compare models', 403);
    }

    logger.info('[Models] Comparing all 3 models');

    // Get all organization carbon entries
    const entries = await prisma.carbonEntry.findMany({
      select: { entryDate: true, valueKg: true },
      orderBy: { entryDate: 'asc' }
    });

    if (entries.length < 12) {
      return errorResponse(res, `Need 12+ months of data. Have ${entries.length} entries.`, 400);
    }

    // Group by month
    const monthlyData = {};
    entries.forEach(entry => {
      const month = entry.entryDate.toISOString().slice(0, 7);
      if (!monthlyData[month]) {
        monthlyData[month] = 0;
      }
      monthlyData[month] += entry.valueKg;
    });

    const sortedMonths = Object.keys(monthlyData).sort();
    const historicalData = sortedMonths.map(m => monthlyData[m]);

    // Call ML service
    const comparison = await mlService.compareModels(
      `org_admin_${req.user.id}`,
      historicalData,
      { horizon: 12 }
    );

    // Get metrics table
    const metrics = await mlService.getModelComparison();

    return successResponse(res, {
      success: true,
      comparison: comparison,
      metrics: metrics,
      dataPoints: historicalData.length,
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    logger.error(`Model comparison error: ${err.message}`);
    return errorResponse(res, 'Failed to compare models', 500);
  }
}

/**
 * Check ML service health
 * GET /api/insights/ml-health
 */
async function checkMLServiceHealth(req, res, next) {
  try {
    const health = await mlService.healthCheck();

    if (['available', 'up', 'healthy', 'ok'].includes(health.status)) {
      return successResponse(res, {
        status: 'up',
        mlService: health,
        timestamp: new Date().toISOString()
      });
    } else {
      return errorResponse(res, 'ML Service is unavailable', 503);
    }

  } catch (err) {
    return errorResponse(res, 'ML Service health check failed', 503);
  }
}

module.exports = {
  getRecommendations,
  listChallenges, joinChallenge, completeChallenge, leaveChallenge,
  getOffsetProjects,
  generateReport, getSuggestedGoals, suggestChallenge,
  getForecast, compareModels, checkMLServiceHealth,
};
