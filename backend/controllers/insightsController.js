const { prisma }                         = require('../config/db');
const { successResponse, errorResponse } = require('../utils/response');
const { CHALLENGES }                     = require('../data/challenges');
const { OFFSET_PROJECTS }                = require('../data/offsetProjects');

/* ════════════════════════════════════════════════
   PERSONALISED RECOMMENDATIONS
   Rule-based, driven by user's real carbon data
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
    const recs = [];

    /* ── Commute ── */
    const carKg = (subMap.car_petrol ?? 0) + (subMap.car_diesel ?? 0);
    if (carKg > 0 && pct('commute') > 20) {
      recs.push({
        id: 'switch_to_bus', category: 'commute',
        priority: pct('commute') > 45 ? 'high' : 'medium',
        icon: '🚌',
        title: 'Switch Your Daily Commute to Public Transport',
        summary: `Your car contributes **${carKg.toFixed(1)} kg CO₂e** this month (${pct('commute').toFixed(0)}% of your total). Taking the bus instead saves up to **${(carKg * 0.54).toFixed(1)} kg** — a 54% reduction.`,
        impact: `−${(carKg * 0.54).toFixed(1)} kg CO₂e/month`,
        effort: 'Low effort',
        steps: [
          'Check Google Maps for bus or metro routes to your office',
          'Start with 2–3 bus days per week',
          'Use commute time productively with a podcast or book',
        ],
      });
    }

    if (subMap.motorbike > 0 && pct('commute') > 15) {
      recs.push({
        id: 'walk_short_distances', category: 'commute',
        priority: 'medium',
        icon: '🚶',
        title: 'Walk Short Distances Instead of Riding',
        summary: `Your motorbike emits **${subMap.motorbike.toFixed(1)} kg CO₂e** this month. Walking trips under 2km cuts those emissions to zero and improves cardiovascular health.`,
        impact: `−${(subMap.motorbike * 0.3).toFixed(1)} kg CO₂e/month`,
        effort: 'Low effort',
        steps: [
          'Identify which trips are under 2km',
          'Walk to the nearest shop, mosque, or café',
          'Use a step counter to track your progress',
        ],
      });
    }

    /* ── Energy ── */
    const elecKg = subMap.electricity ?? 0;
    if (elecKg > 0 && pct('energy') > 20) {
      recs.push({
        id: 'reduce_electricity', category: 'energy',
        priority: pct('energy') > 40 ? 'high' : 'medium',
        icon: '⚡',
        title: 'Reduce Your Electricity Footprint',
        summary: `Electricity is **${pct('energy').toFixed(0)}%** of your emissions (${elecKg.toFixed(1)} kg CO₂e). The Pakistan grid emits 0.45 kg per kWh — setting AC to 26°C and switching to LED can save ~20%.`,
        impact: `−${(elecKg * 0.20).toFixed(1)} kg CO₂e/month`,
        effort: 'Low effort',
        steps: [
          'Set AC thermostat to 26°C (saves 6% per degree above 24°C)',
          'Replace bulbs with LED — 75% less energy',
          'Unplug devices at night (standby power = 5–10% of bill)',
        ],
      });
    }

    const genKg = subMap.diesel_gen ?? 0;
    if (genKg > 0) {
      recs.push({
        id: 'reduce_generator', category: 'energy',
        priority: 'high',
        icon: '🔋',
        title: 'Cut Generator (Diesel) Emissions',
        summary: `Diesel generators emit **2.68 kg CO₂e per litre** — your highest-emission energy source at ${genKg.toFixed(1)} kg this month. A solar UPS backup could eliminate this entirely.`,
        impact: `−${genKg.toFixed(1)} kg CO₂e/month`,
        effort: 'Medium effort',
        steps: [
          'Consider a solar UPS system (payback in 2–3 years)',
          'Run only essential appliances during load shedding',
          'Invest in a good inverter battery for short outages',
        ],
      });
    }

    /* ── Food ── */
    const beefKg = subMap.beef ?? 0;
    if (beefKg > 0) {
      recs.push({
        id: 'reduce_beef', category: 'food',
        priority: beefKg > 25 ? 'high' : 'medium',
        icon: '🥗',
        title: 'Replace Beef Meals with Lower-Emission Alternatives',
        summary: `Beef is your highest-emission food source at **${beefKg.toFixed(1)} kg CO₂e** (6.1 kg per meal). Switching half your beef meals to chicken saves **${(beefKg * 0.43).toFixed(1)} kg** without much sacrifice.`,
        impact: `−${(beefKg * 0.43).toFixed(1)} kg CO₂e/month`,
        effort: 'Low effort',
        steps: [
          'Try chicken biryani — 86% fewer emissions than beef biryani',
          'Daal (lentils) are nutrient-rich and near-zero emission',
          'Even one beef-free day per week makes a difference',
        ],
      });
    }

    /* ── Travel ── */
    const flightKg = (subMap.flight_short ?? 0) + (subMap.flight_long ?? 0);
    if (flightKg > 0) {
      recs.push({
        id: 'reduce_flights', category: 'travel',
        priority: 'high',
        icon: '✈️',
        title: 'Replace Short Flights with Train Travel',
        summary: `Flights contributed **${flightKg.toFixed(1)} kg CO₂e** this month. The Karachi–Lahore train emits **95% less** per passenger than the equivalent flight — and is often cheaper.`,
        impact: `−${(flightKg * 0.7).toFixed(1)} kg per trip replaced`,
        effort: 'Medium effort',
        steps: [
          'Check Pakistan Railways for intercity bookings (pr.gov.pk)',
          'Use video calls for meetings under 4 hours travel time',
          'Book trains 2 weeks ahead for best availability',
        ],
      });
    }

    /* ── General if few recs ── */
    if (recs.length < 2) {
      recs.push({
        id: 'log_consistently', category: 'general',
        priority: 'medium',
        icon: '📊',
        title: 'Log Daily for Deeper Personalisation',
        summary: `With more consistent logging, CarbonX identifies exact patterns and gives you more precise recommendations. Aim to log every activity — commute, meals, energy — within 24 hours.`,
        impact: 'Better insights accuracy',
        effort: 'Low effort',
        steps: [
          'Set a daily reminder to log activities',
          'Start with commute and meals — they're the biggest sources',
          'Use the quick calculator in the Activities tab',
        ],
      });
    }

    /* Admin: add org-level tip */
    if (isAdmin) {
      recs.push({
        id: 'engage_employees', category: 'organisation',
        priority: 'high',
        icon: '🏢',
        title: 'Launch an Employee Carbon Challenge',
        summary: `As admin, you can create a **company-wide challenge** (e.g. Bus Month) for all employees. Organisations that run group challenges typically see 15–25% emission reductions within 30 days.`,
        impact: 'Up to −25% org emissions',
        effort: 'Low effort',
        steps: [
          'Pick one challenge from the Challenges tab',
          'Announce it in your team WhatsApp or email',
          'Use the Leaderboard to track who participates',
        ],
      });
    }

    const priority = { high: 0, medium: 1, low: 2 };
    recs.sort((a, b) => priority[a.priority] - priority[b.priority]);

    return successResponse(res, {
      recommendations: recs,
      dataAvailable:   true,
      totalKg:         parseFloat(total.toFixed(2)),
      period:          '30 days',
    });
  } catch (err) { next(err); }
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
