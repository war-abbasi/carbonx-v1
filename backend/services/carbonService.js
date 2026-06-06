const { prisma } = require('../config/db');

/* ─────────────────────────────────────────────────
   Emission factors  (kg CO₂e per unit)
   Sources: IPCC, DEFRA 2023, IEA, Pakistan NCCC
───────────────────────────────────────────────── */
const FACTORS = {
  commute: {
    car_petrol:   { factor: 0.192, unit: 'km',    label: 'Car (petrol)',       scope: 'scope1'   },
    car_diesel:   { factor: 0.171, unit: 'km',    label: 'Car (diesel)',       scope: 'scope1'   },
    car_electric: { factor: 0.047, unit: 'km',    label: 'Car (electric)',     scope: 'scope2'   },
    motorbike:    { factor: 0.114, unit: 'km',    label: 'Motorbike',          scope: 'scope1'   },
    bus:          { factor: 0.089, unit: 'km',    label: 'Bus',                scope: 'scope3'   },
    train:        { factor: 0.041, unit: 'km',    label: 'Train',              scope: 'scope3'   },
    walking:      { factor: 0,     unit: 'km',    label: 'Walking / Cycling',  scope: 'personal' },
  },
  energy: {
    electricity:  { factor: 0.45,  unit: 'kWh',  label: 'Electricity (grid)', scope: 'scope2'   },
    natural_gas:  { factor: 2.1,   unit: 'm3',   label: 'Natural gas',        scope: 'scope1'   },
    lpg:          { factor: 1.51,  unit: 'kg',   label: 'LPG / cylinder',     scope: 'scope1'   },
    diesel_gen:   { factor: 2.68,  unit: 'litre', label: 'Diesel generator',  scope: 'scope1'   },
  },
  travel: {
    flight_short: { factor: 0.255, unit: 'km',   label: 'Flight (short-haul)', scope: 'scope3'  },
    flight_long:  { factor: 0.195, unit: 'km',   label: 'Flight (long-haul)',  scope: 'scope3'  },
    car_rental:   { factor: 0.192, unit: 'km',   label: 'Rental car',          scope: 'scope3'  },
    taxi:         { factor: 0.211, unit: 'km',   label: 'Taxi / ride-share',   scope: 'scope3'  },
  },
  food: {
    beef:         { factor: 6.1,   unit: 'meal', label: 'Beef meal',           scope: 'personal' },
    chicken:      { factor: 0.86,  unit: 'meal', label: 'Chicken meal',        scope: 'personal' },
    fish:         { factor: 1.34,  unit: 'meal', label: 'Fish meal',           scope: 'personal' },
    vegetarian:   { factor: 0.50,  unit: 'meal', label: 'Vegetarian',          scope: 'personal' },
    vegan:        { factor: 0.30,  unit: 'meal', label: 'Vegan',               scope: 'personal' },
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
      scope:       factorInfo.scope,
      valueKg,
      quantity:    parseFloat(quantity),
      unit:        factorInfo.unit,
      description: description || null,
      entryDate:   entryDate ? new Date(entryDate) : new Date(),
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
  if (period === 'week')  dateFilter.gte = new Date(Date.now() - 7  * 86_400_000);
  if (period === 'month') dateFilter.gte = new Date(Date.now() - 30 * 86_400_000);

  const where = period !== 'all' ? { entryDate: dateFilter } : {};

  const grouped = await prisma.carbonEntry.groupBy({
    by:      ['userId'],
    where,
    _sum:    { valueKg: true },
    _count:  { id: true },
    orderBy: { _sum: { valueKg: 'asc' } },
  });

  if (!grouped.length) return [];

  const userIds = grouped.map((g) => g.userId);
  const users   = await prisma.user.findMany({
    where:  { id: { in: userIds } },
    select: { id: true, name: true, role: true },
  });
  const userMap = Object.fromEntries(users.map((u) => [u.id, u]));

  const scopeBreakdowns = await prisma.carbonEntry.groupBy({
    by:      ['userId', 'scope'],
    where:   period !== 'all'
      ? { entryDate: dateFilter, userId: { in: userIds } }
      : { userId: { in: userIds } },
    _sum:    { valueKg: true },
  });

  const scopeMap = {};
  for (const s of scopeBreakdowns) {
    if (!scopeMap[s.userId]) scopeMap[s.userId] = {};
    scopeMap[s.userId][s.scope] = s._sum.valueKg ?? 0;
  }

  return grouped.map((g, idx) => ({
    rank:          idx + 1,
    user:          userMap[g.userId] ?? { id: g.userId, name: 'Unknown', role: 'USER' },
    totalKg:       parseFloat((g._sum.valueKg ?? 0).toFixed(2)),
    entryCount:    g._count.id,
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

/* ─── Analytics ────────────────────────────────── */
const PERIOD_CONFIG = {
  '7days':   { days: 7,   grain: 'day',   label: 'Last 7 Days'    },
  '30days':  { days: 30,  grain: 'day',   label: 'Last 30 Days'   },
  '6months': { days: 183, grain: 'month', label: 'Last 6 Months'  },
  'year':    { days: 365, grain: 'month', label: 'Last 12 Months' },
};

function fmt(n) { return parseFloat(n.toFixed(3)); }

function growthPct(curr, prev) {
  if (prev === 0) return curr > 0 ? 100 : 0;
  return parseFloat(((curr - prev) / prev * 100).toFixed(1));
}

function calcSustainabilityScore(entries, timeSeries) {
  if (!entries.length) return null;

  const total   = entries.reduce((s, e) => s + e.valueKg, 0);
  const minDate = new Date(Math.min(...entries.map((e) => new Date(e.entryDate).getTime())));
  const days    = Math.max(1, (Date.now() - minDate.getTime()) / 86_400_000);
  const daily   = total / days;

  let score = daily < 1 ? 95 : daily < 3 ? 82 : daily < 7 ? 67 : daily < 15 ? 52 : daily < 30 ? 38 : 22;

  // Consistency bonus
  const uniqueDays = new Set(entries.map((e) => new Date(e.entryDate).toDateString())).size;
  score += uniqueDays > 20 ? 8 : uniqueDays > 10 ? 5 : uniqueDays > 5 ? 3 : 0;

  // Trend bonus/penalty
  if (timeSeries.length >= 2) {
    const last = timeSeries[timeSeries.length - 1].total;
    const prev = timeSeries[timeSeries.length - 2].total;
    if (prev > 0 && last < prev)         score += 5;
    else if (prev > 0 && last > prev * 1.25) score -= 5;
  }

  score = Math.min(100, Math.max(0, Math.round(score)));
  const grade = score >= 85 ? 'A' : score >= 70 ? 'B' : score >= 55 ? 'C' : score >= 40 ? 'D' : 'F';
  const label = score >= 85 ? 'Excellent' : score >= 70 ? 'Good' : score >= 55 ? 'Moderate' : score >= 40 ? 'Needs Work' : 'Critical';
  const color = score >= 85 ? '#2D6A4F' : score >= 70 ? '#52B788' : score >= 55 ? '#C4952A' : score >= 40 ? '#E07020' : '#DC2626';
  return { score, grade, label, color };
}

async function getAnalytics(userId, isAdmin = false, period = 'year') {
  const cfg       = PERIOD_CONFIG[period] ?? PERIOD_CONFIG.year;
  const now       = new Date();
  const startDate = new Date(now.getTime() - cfg.days * 86_400_000);
  if (cfg.grain === 'month') startDate.setDate(1);
  startDate.setHours(0, 0, 0, 0);

  const prevStart = new Date(startDate.getTime() - cfg.days * 86_400_000);
  const userWhere = isAdmin ? {} : { userId };

  // Current period
  const entries = await prisma.carbonEntry.findMany({
    where:   { ...userWhere, entryDate: { gte: startDate } },
    select:  { valueKg: true, scope: true, entryDate: true, category: true, subCategory: true, userId: true },
    orderBy: { entryDate: 'asc' },
  });

  // Previous period (for growth %)
  const prevEntries = await prisma.carbonEntry.findMany({
    where:  { ...userWhere, entryDate: { gte: prevStart, lt: startDate } },
    select: { valueKg: true, scope: true },
  });

  const total  = entries.reduce((s, e) => s + e.valueKg, 0);
  const scope1 = entries.filter((e) => e.scope === 'scope1').reduce((s, e) => s + e.valueKg, 0);
  const scope2 = entries.filter((e) => e.scope === 'scope2').reduce((s, e) => s + e.valueKg, 0);
  const scope3 = entries.filter((e) => e.scope === 'scope3').reduce((s, e) => s + e.valueKg, 0);

  const prevTotal  = prevEntries.reduce((s, e) => s + e.valueKg, 0);
  const prevScope1 = prevEntries.filter((e) => e.scope === 'scope1').reduce((s, e) => s + e.valueKg, 0);
  const prevScope2 = prevEntries.filter((e) => e.scope === 'scope2').reduce((s, e) => s + e.valueKg, 0);
  const prevScope3 = prevEntries.filter((e) => e.scope === 'scope3').reduce((s, e) => s + e.valueKg, 0);

  /* ── Time-series (daily or monthly) ── */
  const timeSeries = [];
  if (cfg.grain === 'day') {
    const dayMap = {};
    entries.forEach((e) => {
      const d   = new Date(e.entryDate);
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      if (!dayMap[key]) dayMap[key] = { total: 0, scope1: 0, scope2: 0, scope3: 0, personal: 0 };
      dayMap[key].total += e.valueKg;
      if      (e.scope === 'scope1') dayMap[key].scope1   += e.valueKg;
      else if (e.scope === 'scope2') dayMap[key].scope2   += e.valueKg;
      else if (e.scope === 'scope3') dayMap[key].scope3   += e.valueKg;
      else                           dayMap[key].personal += e.valueKg;
    });
    const cur = new Date(startDate);
    while (cur <= now) {
      const key = `${cur.getFullYear()}-${String(cur.getMonth()+1).padStart(2,'0')}-${String(cur.getDate()).padStart(2,'0')}`;
      timeSeries.push({
        label:    `${cur.toLocaleString('en',{month:'short'})} ${cur.getDate()}`,
        total:    fmt(dayMap[key]?.total    ?? 0),
        scope1:   fmt(dayMap[key]?.scope1   ?? 0),
        scope2:   fmt(dayMap[key]?.scope2   ?? 0),
        scope3:   fmt(dayMap[key]?.scope3   ?? 0),
        personal: fmt(dayMap[key]?.personal ?? 0),
      });
      cur.setDate(cur.getDate() + 1);
    }
  } else {
    const monthMap = {};
    entries.forEach((e) => {
      const d   = new Date(e.entryDate);
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
      if (!monthMap[key]) monthMap[key] = { total: 0, scope1: 0, scope2: 0, scope3: 0, personal: 0 };
      monthMap[key].total += e.valueKg;
      if      (e.scope === 'scope1') monthMap[key].scope1   += e.valueKg;
      else if (e.scope === 'scope2') monthMap[key].scope2   += e.valueKg;
      else if (e.scope === 'scope3') monthMap[key].scope3   += e.valueKg;
      else                           monthMap[key].personal += e.valueKg;
    });
    const cur = new Date(startDate);
    while (cur <= now) {
      const key = `${cur.getFullYear()}-${String(cur.getMonth()+1).padStart(2,'0')}`;
      timeSeries.push({
        label:    cur.toLocaleString('en', { month: 'short' }),
        total:    fmt(monthMap[key]?.total    ?? 0),
        scope1:   fmt(monthMap[key]?.scope1   ?? 0),
        scope2:   fmt(monthMap[key]?.scope2   ?? 0),
        scope3:   fmt(monthMap[key]?.scope3   ?? 0),
        personal: fmt(monthMap[key]?.personal ?? 0),
      });
      cur.setMonth(cur.getMonth() + 1);
    }
  }

  /* ── Category breakdown ── */
  const catMap = {};
  entries.forEach((e) => { catMap[e.category] = (catMap[e.category] ?? 0) + e.valueKg; });
  const byCategory = Object.entries(catMap)
    .map(([cat, kg]) => ({ category: cat, totalKg: fmt(kg), percentage: total > 0 ? parseFloat((kg/total*100).toFixed(1)) : 0 }))
    .sort((a, b) => b.totalKg - a.totalKg);

  /* ── Top sources ── */
  const srcMap = {};
  entries.forEach((e) => { const k = e.subCategory||e.category; srcMap[k] = (srcMap[k]??0) + e.valueKg; });
  const topSources = Object.entries(srcMap)
    .map(([src, kg]) => ({ source: src.replace(/_/g,' '), totalKg: fmt(kg), percentage: total>0 ? parseFloat((kg/total*100).toFixed(1)) : 0 }))
    .sort((a,b) => b.totalKg - a.totalKg).slice(0, 6);

  /* ── Scope breakdown ── */
  const personal = total - scope1 - scope2 - scope3;
  const scopeBreakdown = [
    { scope: 'Scope 1 — Direct',      kg: scope1,   color: '#2D6A4F' },
    { scope: 'Scope 2 — Indirect',    kg: scope2,   color: '#C4952A' },
    { scope: 'Scope 3 — Value Chain', kg: scope3,   color: '#8B5E3C' },
    { scope: 'Personal',              kg: personal, color: '#52B788' },
  ].filter((s) => s.kg > 0)
   .map((s) => ({ ...s, kg: fmt(s.kg), percentage: total > 0 ? parseFloat((s.kg/total*100).toFixed(1)) : 0 }));

  /* ── Employee comparison (admin only) ── */
  let employeeComparison = [];
  if (isAdmin && entries.length > 0) {
    const empMap = {};
    entries.forEach((e) => { empMap[e.userId] = (empMap[e.userId] ?? 0) + e.valueKg; });
    const uIds  = Object.keys(empMap).map(Number);
    const users = await prisma.user.findMany({ where: { id: { in: uIds } }, select: { id: true, name: true, role: true } });
    const uMap  = Object.fromEntries(users.map((u) => [u.id, u]));
    const maxKg = Math.max(...Object.values(empMap), 0.001);
    employeeComparison = Object.entries(empMap)
      .map(([uid, kg]) => ({ user: uMap[Number(uid)] ?? { id: Number(uid), name: 'Unknown' }, totalKg: fmt(kg), barPct: parseFloat((kg/maxKg*100).toFixed(1)) }))
      .sort((a, b) => b.totalKg - a.totalKg)
      .slice(0, 10);
  }

  return {
    kpis: {
      total:      fmt(total),
      scope1:     fmt(scope1),
      scope2:     fmt(scope2),
      scope3:     fmt(scope3),
      entryCount: entries.length,
      growth: {
        total:  growthPct(total,  prevTotal),
        scope1: growthPct(scope1, prevScope1),
        scope2: growthPct(scope2, prevScope2),
        scope3: growthPct(scope3, prevScope3),
      },
    },
    timeSeries,
    grain: cfg.grain,
    byCategory,
    topSources,
    scopeBreakdown,
    employeeComparison,
    sustainabilityScore: calcSustainabilityScore(entries, timeSeries),
    period,
    isOrgWide: isAdmin,
  };
}

module.exports = { createEntry, getUserEntries, getLeaderboard, getUserSummary, getAnalytics, FACTORS };
