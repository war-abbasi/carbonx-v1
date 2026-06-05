const { prisma } = require('../config/db');

/* ─────────────────────────────────────────────────
   Emission factors  (kg CO₂e per unit)
   Sources: IPCC, DEFRA 2023, IEA, Pakistan NCCC
───────────────────────────────────────────────── */
const FACTORS = {
  commute: {
    car_petrol:   { factor: 0.192, unit: 'km',   label: 'Car (petrol)',    scope: 'scope1' },
    car_diesel:   { factor: 0.171, unit: 'km',   label: 'Car (diesel)',    scope: 'scope1' },
    car_electric: { factor: 0.047, unit: 'km',   label: 'Car (electric)',  scope: 'scope2' },
    motorbike:    { factor: 0.114, unit: 'km',   label: 'Motorbike',       scope: 'scope1' },
    bus:          { factor: 0.089, unit: 'km',   label: 'Bus',             scope: 'scope3' },
    train:        { factor: 0.041, unit: 'km',   label: 'Train',           scope: 'scope3' },
    walking:      { factor: 0,     unit: 'km',   label: 'Walking / Cycling', scope: 'personal' },
  },
  energy: {
    electricity:  { factor: 0.45,  unit: 'kWh',  label: 'Electricity (grid)', scope: 'scope2' },
    natural_gas:  { factor: 2.1,   unit: 'm3',   label: 'Natural gas',     scope: 'scope1' },
    lpg:          { factor: 1.51,  unit: 'kg',   label: 'LPG / cylinder',  scope: 'scope1' },
    diesel_gen:   { factor: 2.68,  unit: 'litre', label: 'Diesel generator', scope: 'scope1' },
  },
  travel: {
    flight_short: { factor: 0.255, unit: 'km',   label: 'Flight (short-haul)', scope: 'scope3' },
    flight_long:  { factor: 0.195, unit: 'km',   label: 'Flight (long-haul)',  scope: 'scope3' },
    car_rental:   { factor: 0.192, unit: 'km',   label: 'Rental car',      scope: 'scope3' },
    taxi:         { factor: 0.211, unit: 'km',   label: 'Taxi / ride-share', scope: 'scope3' },
  },
  food: {
    beef:         { factor: 6.1,   unit: 'meal', label: 'Beef meal',       scope: 'personal' },
    chicken:      { factor: 0.86,  unit: 'meal', label: 'Chicken meal',    scope: 'personal' },
    fish:         { factor: 1.34,  unit: 'meal', label: 'Fish meal',       scope: 'personal' },
    vegetarian:   { factor: 0.50,  unit: 'meal', label: 'Vegetarian',      scope: 'personal' },
    vegan:        { factor: 0.30,  unit: 'meal', label: 'Vegan',           scope: 'personal' },
  },
};

function getFactorInfo(category, subCategory) {
  return FACTORS[category]?.[subCategory] ?? null;
}

/* ─── Create entry ────────────────────────────── */
async function createEntry({ userId, category, subCategory, quantity, description, entryDate }) {
  const factorInfo = getFactorInfo(category, subCategory);
  if (!factorInfo) {
    const err = new Error('Unknown category / sub-category combination.');
    err.statusCode = 400;
    throw err;
  }

  const valueKg = parseFloat((quantity * factorInfo.factor).toFixed(4));

  return prisma.carbonEntry.create({
    data: {
      userId,
      category,
      subCategory,
      scope:    factorInfo.scope,
      valueKg,
      quantity: parseFloat(quantity),
      unit:     factorInfo.unit,
      description: description || null,
      entryDate: entryDate ? new Date(entryDate) : new Date(),
    },
    include: { user: { select: { id: true, name: true } } },
  });
}

/* ─── User's own entries ──────────────────────── */
async function getUserEntries(userId, limit = 20) {
  const entries = await prisma.carbonEntry.findMany({
    where:   { userId },
    orderBy: { entryDate: 'desc' },
    take:    limit,
  });

  const total = await prisma.carbonEntry.aggregate({
    where:  { userId },
    _sum:   { valueKg: true },
    _count: { id: true },
  });

  return { entries, totalKg: total._sum.valueKg ?? 0, count: total._count.id };
}

/* ─── Leaderboard ─────────────────────────────── */
async function getLeaderboard(period = 'all') {
  const dateFilter = {};
  if (period === 'week') {
    dateFilter.gte = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  } else if (period === 'month') {
    dateFilter.gte = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  }

  const where = period !== 'all' ? { entryDate: dateFilter } : {};

  /* Aggregate per user */
  const grouped = await prisma.carbonEntry.groupBy({
    by:      ['userId'],
    where,
    _sum:    { valueKg: true },
    _count:  { id: true },
    orderBy: { _sum: { valueKg: 'asc' } },   // lowest = best
  });

  if (grouped.length === 0) return [];

  /* Fetch user details */
  const userIds = grouped.map((g) => g.userId);
  const users   = await prisma.user.findMany({
    where:  { id: { in: userIds } },
    select: { id: true, name: true, role: true },
  });
  const userMap = Object.fromEntries(users.map((u) => [u.id, u]));

  /* Scope breakdown per user */
  const scopeBreakdowns = await prisma.carbonEntry.groupBy({
    by:      ['userId', 'scope'],
    where:   period !== 'all' ? { entryDate: dateFilter, userId: { in: userIds } } : { userId: { in: userIds } },
    _sum:    { valueKg: true },
  });

  const scopeMap = {};
  for (const s of scopeBreakdowns) {
    if (!scopeMap[s.userId]) scopeMap[s.userId] = {};
    scopeMap[s.userId][s.scope] = s._sum.valueKg ?? 0;
  }

  return grouped.map((g, idx) => ({
    rank:       idx + 1,
    user:       userMap[g.userId] ?? { id: g.userId, name: 'Unknown', role: 'USER' },
    totalKg:    parseFloat((g._sum.valueKg ?? 0).toFixed(2)),
    entryCount: g._count.id,
    scopeBreakdown: scopeMap[g.userId] ?? {},
  }));
}

/* ─── Summary for current user ────────────────── */
async function getUserSummary(userId) {
  const byCategory = await prisma.carbonEntry.groupBy({
    by:      ['category'],
    where:   { userId },
    _sum:    { valueKg: true },
    _count:  { id: true },
  });

  const byScope = await prisma.carbonEntry.groupBy({
    by:      ['scope'],
    where:   { userId },
    _sum:    { valueKg: true },
  });

  const total = byCategory.reduce((sum, c) => sum + (c._sum.valueKg ?? 0), 0);

  return { total: parseFloat(total.toFixed(2)), byCategory, byScope };
}

module.exports = { createEntry, getUserEntries, getLeaderboard, getUserSummary, FACTORS };
