const { prisma }     = require('../config/db');
const { CHALLENGES } = require('../data/challenges');

/* ─────────────────────────────────────────────────
   Awards & points
   Users earn points from four sources over a rolling window:
     • Footprint    0–200  lowest footprint in the org = 200, highest = 0
     • Improvement  0–150  % cut in the last 30 days vs the 30 before (×5)
     • Consistency  0–100  2 pts per distinct day with a logged entry
     • Challenges          50 + saved kg per completed challenge, 10 per active one
     • Admin awards        points attached to recognition given by an admin
   Badges are derived from the same numbers, plus admin-given awards.
───────────────────────────────────────────────── */
const DAY = 86_400_000;
const CAR_SUBS = new Set(['car_petrol', 'car_diesel', 'taxi', 'car_rental']);

const TIERS = [
  { min: 450, name: 'Platinum', color: '#5B7C99' },
  { min: 300, name: 'Gold',     color: '#C4952A' },
  { min: 180, name: 'Silver',   color: '#8B9E95' },
  { min: 0,   name: 'Bronze',   color: '#CD7F32' },
];

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const round1 = (v) => Math.round(v * 10) / 10;

async function getOrgAwards(organizationId, { days = 60 } = {}) {
  /* Whole-day boundaries, so rankings don't shift as the clock moves during the day */
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const since = new Date(today.getTime() - (days - 1) * DAY);
  const mid   = new Date(today.getTime() - 29 * DAY);

  const users = await prisma.user.findMany({
    where:  { organizationId: organizationId ?? null, role: 'USER', active: true },
    select: {
      id: true, name: true, email: true,
      carbonEntries:  { where: { entryDate: { gte: since } }, select: { valueKg: true, entryDate: true, subCategory: true } },
      userChallenges: { select: { challengeId: true, status: true, completedAt: true } },
      awards:         { select: { id: true, title: true, icon: true, reason: true, points: true, createdAt: true }, orderBy: { createdAt: 'desc' } },
    },
  });

  const stats = users.map((u) => {
    const totalKg  = u.carbonEntries.reduce((s, e) => s + e.valueKg, 0);
    const recentKg = u.carbonEntries.filter((e) => e.entryDate >= mid).reduce((s, e) => s + e.valueKg, 0);
    const priorKg  = totalKg - recentKg;
    const changePct = priorKg > 0 ? ((recentKg - priorKg) / priorKg) * 100 : 0;
    const activeDays = new Set(u.carbonEntries.map((e) => e.entryDate.toISOString().slice(0, 10))).size;
    const usesCar  = u.carbonEntries.some((e) => CAR_SUBS.has(e.subCategory));
    const completed = u.userChallenges.filter((c) => c.status === 'completed');
    const active    = u.userChallenges.filter((c) => c.status === 'active');
    return { u, totalKg, changePct, activeDays, usesCar, completed, active };
  });

  const logged = stats.filter((s) => s.u.carbonEntries.length > 0);
  const minKg  = Math.min(...logged.map((s) => s.totalKg));
  const maxKg  = Math.max(...logged.map((s) => s.totalKg));
  const bestImprovement = Math.min(...logged.map((s) => s.changePct));

  const rankings = stats.map((s) => {
    const hasData = s.u.carbonEntries.length > 0;
    const footprint   = hasData ? Math.round(200 * (maxKg === minKg ? 1 : (maxKg - s.totalKg) / (maxKg - minKg))) : 0;
    const improvement = Math.round(clamp(-s.changePct * 5, 0, 150));
    const consistency = Math.min(100, s.activeDays * 2);
    const challengePts = s.completed.reduce((sum, c) => {
      const ch = CHALLENGES.find((x) => x.id === c.challengeId);
      return sum + 50 + Math.round(ch?.targetKg ?? 0);
    }, 0) + s.active.length * 10;
    const manual = s.u.awards.reduce((sum, a) => sum + a.points, 0);

    const badges = [];
    if (hasData && s.totalKg === minKg) badges.push({ icon: '🌱', title: 'Lowest Footprint', reason: `Lowest CO₂e in the team over ${days} days` });
    if (hasData && s.changePct === bestImprovement && s.changePct < -5) badges.push({ icon: '📉', title: 'Most Improved', reason: `Cut emissions ${Math.abs(round1(s.changePct))}% in the last 30 days` });
    if (s.completed.length >= 3)      badges.push({ icon: '🎯', title: 'Challenge Master', reason: `${s.completed.length} challenges completed` });
    else if (s.completed.length >= 1) badges.push({ icon: '✅', title: 'Challenge Finisher', reason: `${s.completed.length} challenge${s.completed.length > 1 ? 's' : ''} completed` });
    if (hasData && !s.usesCar)        badges.push({ icon: '🚌', title: 'Green Commuter', reason: 'No car or taxi trips logged' });
    if (s.activeDays >= 45)           badges.push({ icon: '📅', title: 'Consistent Logger', reason: `Logged on ${s.activeDays} days` });
    for (const a of s.u.awards) badges.push({ icon: a.icon, title: a.title, reason: a.reason, awardId: a.id, points: a.points, fromAdmin: true });

    const points = footprint + improvement + consistency + challengePts + manual;
    return {
      user:       { id: s.u.id, name: s.u.name, email: s.u.email },
      points,
      tier:       TIERS.find((t) => points >= t.min),
      breakdown:  { footprint, improvement, consistency, challenges: challengePts, adminAwards: manual },
      totalKg:    round1(s.totalKg),
      changePct:  round1(s.changePct),
      activeDays: s.activeDays,
      challengesCompleted: s.completed.length,
      challengesActive:    s.active.length,
      badges,
    };
  });

  rankings.sort((a, b) => b.points - a.points);
  rankings.forEach((r, i) => { r.rank = i + 1; });
  if (rankings[0]?.points > 0) rankings[0].badges.unshift({ icon: '🏆', title: 'Eco Champion', reason: 'Highest points in the organisation' });

  return { periodDays: days, rankings };
}

module.exports = { getOrgAwards };
