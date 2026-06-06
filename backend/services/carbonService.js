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

/* ─── Analytics ───────────────────────────────── */
function getPeriodStart(period) {
  const now = new Date();
  if (period === '3months')  return new Date(now.getFullYear(), now.getMonth() - 3,  1);
  if (period === '6months')  return new Date(now.getFullYear(), now.getMonth() - 6,  1);
  /* default: year */        return new Date(now.getFullYear(), now.getMonth() - 11, 1);
}

async function getAnalytics(userId, isAdmin = false, period = 'year') {
  const startDate = getPeriodStart(period);
  const where     = {
    entryDate: { gte: startDate },
    ...(isAdmin ? {} : { userId }),
  };

  /* Pull all matching entries — small dataset per user so fine in memory */
  const entries = await prisma.carbonEntry.findMany({
    where,
    select: { valueKg: true, scope: true, entryDate: true, category: true, subCategory: true },
    orderBy: { entryDate: 'asc' },
  });

  const total  = entries.reduce((s, e) => s + e.valueKg, 0);
  const scope1 = entries.filter((e) => e.scope === 'scope1').reduce((s, e) => s + e.valueKg, 0);
  const scope2 = entries.filter((e) => e.scope === 'scope2').reduce((s, e) => s + e.valueKg, 0);
  const scope3 = entries.filter((e) => e.scope === 'scope3').reduce((s, e) => s + e.valueKg, 0);

  /* ── Monthly buckets ── */
  const monthMap = {};
  entries.forEach((e) => {
    const d   = new Date(e.entryDate);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (!monthMap[key]) {
      monthMap[key] = { year: d.getFullYear(), month: d.getMonth() + 1, total: 0, scope1: 0, scope2: 0, scope3: 0, personal: 0 };
    }
    monthMap[key].total += e.valueKg;
    if (e.scope === 'scope1')    monthMap[key].scope1    += e.valueKg;
    else if (e.scope === 'scope2') monthMap[key].scope2  += e.valueKg;
    else if (e.scope === 'scope3') monthMap[key].scope3  += e.valueKg;
    else                           monthMap[key].personal += e.valueKg;
  });

  /* Fill in missing months so chart has continuous x-axis */
  const monthly = [];
  const cursor  = new Date(startDate);
  const end     = new Date();
  while (cursor <= end) {
    const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`;
    monthly.push({
      year:     cursor.getFullYear(),
      month:    cursor.getMonth() + 1,
      label:    cursor.toLocaleString('en', { month: 'short' }),
      total:    parseFloat((monthMap[key]?.total    ?? 0).toFixed(3)),
      scope1:   parseFloat((monthMap[key]?.scope1   ?? 0).toFixed(3)),
      scope2:   parseFloat((monthMap[key]?.scope2   ?? 0).toFixed(3)),
      scope3:   parseFloat((monthMap[key]?.scope3   ?? 0).toFixed(3)),
      personal: parseFloat((monthMap[key]?.personal ?? 0).toFixed(3)),
    });
    cursor.setMonth(cursor.getMonth() + 1);
  }

  /* ── Category breakdown ── */
  const catMap = {};
  entries.forEach((e) => {
    if (!catMap[e.category]) catMap[e.category] = 0;
    catMap[e.category] += e.valueKg;
  });
  const byCategory = Object.entries(catMap)
    .map(([category, kg]) => ({
      category,
      totalKg:    parseFloat(kg.toFixed(3)),
      percentage: total > 0 ? parseFloat((kg / total * 100).toFixed(1)) : 0,
    }))
    .sort((a, b) => b.totalKg - a.totalKg);

  /* ── Top sub-sources ── */
  const srcMap = {};
  entries.forEach((e) => {
    const k = e.subCategory || e.category;
    if (!srcMap[k]) srcMap[k] = 0;
    srcMap[k] += e.valueKg;
  });
  const topSources = Object.entries(srcMap)
    .map(([src, kg]) => ({
      source:     src.replace(/_/g, ' '),
      totalKg:    parseFloat(kg.toFixed(3)),
      percentage: total > 0 ? parseFloat((kg / total * 100).toFixed(1)) : 0,
    }))
    .sort((a, b) => b.totalKg - a.totalKg)
    .slice(0, 6);

  /* ── Scope percentages ── */
  const scopeBreakdown = [
    { scope: 'Scope 1 — Direct',      key: 'scope1',   kg: scope1, color: '#2D6A4F' },
    { scope: 'Scope 2 — Indirect',    key: 'scope2',   kg: scope2, color: '#C4952A' },
    { scope: 'Scope 3 — Value Chain', key: 'scope3',   kg: scope3, color: '#8B5E3C' },
    { scope: 'Personal',              key: 'personal', kg: total - scope1 - scope2 - scope3, color: '#52B788' },
  ]
    .filter((s) => s.kg > 0)
    .map((s) => ({
      ...s,
      kg:         parseFloat(s.kg.toFixed(3)),
      percentage: total > 0 ? parseFloat((s.kg / total * 100).toFixed(1)) : 0,
    }));

  return {
    kpis: {
      total:       parseFloat(total.toFixed(3)),
      scope1:      parseFloat(scope1.toFixed(3)),
      scope2:      parseFloat(scope2.toFixed(3)),
      scope3:      parseFloat(scope3.toFixed(3)),
      entryCount:  entries.length,
    },
    monthly,
    byCategory,
    topSources,
    scopeBreakdown,
    period,
    isOrgWide: isAdmin,
  };
}

module.exports = { createEntry, getUserEntries, getLeaderboard, getUserSummary, getAnalytics, FACTORS };
