const { prisma } = require('../config/db');

/* ─────────────────────────────────────────────────
   Emission factors  (kg CO₂e per unit)
   Sources: IPCC, DEFRA 2023, IEA, Pakistan NCCC
───────────────────────────────────────────────── */
const FACTORS = {
  commute: {
    car_petrol:   { factor: 0.192, unit: 'km',    label: 'Car (petrol)',       scope: 'scope1',   ghgCat: null },
    car_diesel:   { factor: 0.171, unit: 'km',    label: 'Car (diesel)',       scope: 'scope1',   ghgCat: null },
    car_electric: { factor: 0.047, unit: 'km',    label: 'Car (electric)',     scope: 'scope2',   ghgCat: null },
    motorbike:    { factor: 0.114, unit: 'km',    label: 'Motorbike',          scope: 'scope1',   ghgCat: null },
    bus:          { factor: 0.089, unit: 'km',    label: 'Bus',                scope: 'scope3',   ghgCat: 'Cat 7 — Employee Commuting' },
    train:        { factor: 0.041, unit: 'km',    label: 'Train',              scope: 'scope3',   ghgCat: 'Cat 7 — Employee Commuting' },
    walking:      { factor: 0,     unit: 'km',    label: 'Walking / Cycling',  scope: 'personal', ghgCat: null },
  },
  energy: {
    electricity:  { factor: 0.45,  unit: 'kWh',  label: 'Electricity (grid)', scope: 'scope2',   ghgCat: null },
    natural_gas:  { factor: 2.1,   unit: 'm3',   label: 'Natural gas',        scope: 'scope1',   ghgCat: null },
    lpg:          { factor: 1.51,  unit: 'kg',   label: 'LPG / cylinder',     scope: 'scope1',   ghgCat: null },
    diesel_gen:   { factor: 2.68,  unit: 'litre', label: 'Diesel generator',  scope: 'scope1',   ghgCat: null },
  },
  travel: {
    flight_short: { factor: 0.255, unit: 'km',   label: 'Flight (short-haul)', scope: 'scope3',  ghgCat: 'Cat 6 — Business Travel' },
    flight_long:  { factor: 0.195, unit: 'km',   label: 'Flight (long-haul)',  scope: 'scope3',  ghgCat: 'Cat 6 — Business Travel' },
    car_rental:   { factor: 0.192, unit: 'km',   label: 'Rental car',          scope: 'scope3',  ghgCat: 'Cat 6 — Business Travel' },
    taxi:         { factor: 0.211, unit: 'km',   label: 'Taxi / ride-share',   scope: 'scope3',  ghgCat: 'Cat 6 — Business Travel' },
  },
  food: {
    beef:         { factor: 6.1,   unit: 'meal', label: 'Beef meal',           scope: 'personal', ghgCat: null },
    chicken:      { factor: 0.86,  unit: 'meal', label: 'Chicken meal',        scope: 'personal', ghgCat: null },
    fish:         { factor: 1.34,  unit: 'meal', label: 'Fish meal',           scope: 'personal', ghgCat: null },
    vegetarian:   { factor: 0.50,  unit: 'meal', label: 'Vegetarian',          scope: 'personal', ghgCat: null },
    vegan:        { factor: 0.30,  unit: 'meal', label: 'Vegan',               scope: 'personal', ghgCat: null },
  },
  /* Pakistan industrial process & combustion (Scope 1 direct) */
  industry: {
    coal:               { factor: 2.42,  unit: 'kg',    label: 'Coal (industrial)',           scope: 'scope1', ghgCat: null },
    furnace_oil:        { factor: 3.13,  unit: 'litre', label: 'Furnace oil / RFO',           scope: 'scope1', ghgCat: null },
    natural_gas_boiler: { factor: 2.02,  unit: 'm3',    label: 'Natural gas (boiler/process)',scope: 'scope1', ghgCat: null },
    cement_process:     { factor: 0.53,  unit: 'kg',    label: 'Cement (clinker process)',    scope: 'scope1', ghgCat: null },
    steel:              { factor: 1.85,  unit: 'kg',    label: 'Steel (crude)',               scope: 'scope1', ghgCat: null },
    fabric_processing:  { factor: 1.80,  unit: 'kg',    label: 'Textile (dyeing/finishing)',  scope: 'scope1', ghgCat: null },
    brick_kiln:         { factor: 0.18,  unit: 'brick', label: 'Brick kiln (per brick)',      scope: 'scope1', ghgCat: null },
  },
  /* Pakistan agriculture (Scope 1 — direct emissions on farm) */
  agriculture: {
    rice_paddy:       { factor: 1370,  unit: 'hectare', label: 'Rice paddy (per hectare/season)', scope: 'scope1', ghgCat: null },
    crop_residue:     { factor: 1.5,   unit: 'kg',      label: 'Crop residue burning',            scope: 'scope1', ghgCat: null },
    fertiliser_n:     { factor: 4.42,  unit: 'kg',      label: 'Nitrogen fertiliser (N₂O)',       scope: 'scope1', ghgCat: null },
    diesel_tractor:   { factor: 2.68,  unit: 'litre',   label: 'Tractor / pump diesel',           scope: 'scope1', ghgCat: null },
    livestock_cattle: { factor: 225,   unit: 'head',    label: 'Cattle (enteric, per head/month)',scope: 'scope1', ghgCat: null },
  },
  /* GHG Protocol Scope 3 — Cat 1: Purchased Goods & Services (DEFRA 2023) */
  purchased_goods: {
    paper:           { factor: 1.37,  unit: 'kg',   label: 'Office paper',          scope: 'scope3', ghgCat: 'Cat 1 — Purchased Goods & Services' },
    plastic_pkg:     { factor: 2.53,  unit: 'kg',   label: 'Plastic packaging',     scope: 'scope3', ghgCat: 'Cat 1 — Purchased Goods & Services' },
    it_equipment:    { factor: 300,   unit: 'unit', label: 'IT equipment (laptop)',  scope: 'scope3', ghgCat: 'Cat 1 — Purchased Goods & Services' },
    office_supplies: { factor: 0.85,  unit: 'kg',   label: 'General office supplies',scope: 'scope3', ghgCat: 'Cat 1 — Purchased Goods & Services' },
  },
  /* GHG Protocol Scope 3 — Cat 4: Upstream Transport & Distribution (DEFRA 2023) */
  upstream_transport: {
    road_freight: { factor: 0.11,  unit: 'tonne-km', label: 'Road freight (HGV)',   scope: 'scope3', ghgCat: 'Cat 4 — Upstream Transport & Distribution' },
    sea_freight:  { factor: 0.008, unit: 'tonne-km', label: 'Sea freight (container)',scope: 'scope3', ghgCat: 'Cat 4 — Upstream Transport & Distribution' },
    air_freight:  { factor: 0.602, unit: 'tonne-km', label: 'Air freight (cargo)',   scope: 'scope3', ghgCat: 'Cat 4 — Upstream Transport & Distribution' },
    rail_freight: { factor: 0.028, unit: 'tonne-km', label: 'Rail freight',          scope: 'scope3', ghgCat: 'Cat 4 — Upstream Transport & Distribution' },
  },
  /* GHG Protocol Scope 3 — Cat 5: Waste Generated in Operations (DEFRA 2023) */
  waste: {
    landfill:    { factor: 0.46,  unit: 'kg', label: 'Landfill (mixed waste)',  scope: 'scope3', ghgCat: 'Cat 5 — Waste in Operations' },
    recycled:    { factor: 0.021, unit: 'kg', label: 'Mixed recycling',         scope: 'scope3', ghgCat: 'Cat 5 — Waste in Operations' },
    composted:   { factor: 0.01,  unit: 'kg', label: 'Composting',             scope: 'scope3', ghgCat: 'Cat 5 — Waste in Operations' },
    wastewater:  { factor: 0.35,  unit: 'm3', label: 'Wastewater treatment',   scope: 'scope3', ghgCat: 'Cat 5 — Waste in Operations' },
  },
  /* GHG Protocol Scope 3 — Cat 9: Downstream Transport & Distribution */
  downstream_transport: {
    road_delivery:  { factor: 0.11,  unit: 'tonne-km', label: 'Road delivery (HGV)',     scope: 'scope3', ghgCat: 'Cat 9 — Downstream Transport & Distribution' },
    last_mile:      { factor: 0.184, unit: 'tonne-km', label: 'Last-mile van delivery',  scope: 'scope3', ghgCat: 'Cat 9 — Downstream Transport & Distribution' },
    cold_chain:     { factor: 0.22,  unit: 'tonne-km', label: 'Cold chain distribution', scope: 'scope3', ghgCat: 'Cat 9 — Downstream Transport & Distribution' },
  },
  /* GHG Protocol Scope 3 — Cat 12: End-of-Life Treatment of Sold Products */
  end_of_life: {
    e_waste:             { factor: 0.020, unit: 'kg', label: 'Electronics recycling',     scope: 'scope3', ghgCat: 'Cat 12 — End-of-Life Treatment' },
    construction_waste:  { factor: 0.025, unit: 'kg', label: 'Construction waste',        scope: 'scope3', ghgCat: 'Cat 12 — End-of-Life Treatment' },
    mixed_waste_eol:     { factor: 0.46,  unit: 'kg', label: 'Mixed product waste (EOL)', scope: 'scope3', ghgCat: 'Cat 12 — End-of-Life Treatment' },
  },
};

function getFactorInfo(category, subCategory) {
  return FACTORS[category]?.[subCategory] ?? null;
}

/* ─── Bulk CSV import (admin) ─────────────────── */
async function bulkCreateEntries(adminId, rows) {
  const inserted = [];
  const errors   = [];

  // Pre-fetch all users so we can resolve user_email → userId
  const allUsers = await prisma.user.findMany({ select: { id: true, email: true } });
  const emailMap = Object.fromEntries(allUsers.map((u) => [u.email.toLowerCase(), u.id]));

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2; // 1-indexed, +1 for header row

    try {
      const { date, category, sub_category, quantity, description = '', user_email = '' } = row;

      // Required fields
      if (!date || !category || !sub_category || !quantity) {
        errors.push({ row: rowNum, message: 'Missing required fields: date, category, sub_category, quantity' });
        continue;
      }

      // Resolve userId
      let userId = adminId;
      if (user_email.trim()) {
        const resolved = emailMap[user_email.trim().toLowerCase()];
        if (!resolved) {
          errors.push({ row: rowNum, message: `User not found: ${user_email}` });
          continue;
        }
        userId = resolved;
      }

      // Validate date
      const entryDate = new Date(date.trim());
      if (isNaN(entryDate.getTime())) {
        errors.push({ row: rowNum, message: `Invalid date "${date}" — use YYYY-MM-DD` });
        continue;
      }
      if (entryDate > new Date()) {
        errors.push({ row: rowNum, message: `Date ${date} is in the future — only past/present dates allowed` });
        continue;
      }

      // Validate quantity
      const qty = parseFloat(quantity);
      if (isNaN(qty) || qty < 0) {
        errors.push({ row: rowNum, message: `Invalid quantity "${quantity}" — must be a positive number` });
        continue;
      }

      // Look up emission factor
      const factorInfo = getFactorInfo(category.trim().toLowerCase(), sub_category.trim().toLowerCase());
      if (!factorInfo) {
        errors.push({ row: rowNum, message: `Unknown category/sub_category: "${category}"/"${sub_category}"` });
        continue;
      }

      const valueKg = parseFloat((qty * factorInfo.factor).toFixed(4));

      await prisma.carbonEntry.create({
        data: {
          userId,
          category:    category.trim().toLowerCase(),
          subCategory: sub_category.trim().toLowerCase(),
          scope:       factorInfo.scope,
          valueKg,
          quantity:    qty,
          unit:        factorInfo.unit,
          description: description.trim() || null,
          entryDate,
        },
      });

      inserted.push(rowNum);
    } catch (err) {
      errors.push({ row: rowNum, message: err.message });
    }
  }

  return { inserted: inserted.length, errors };
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

/* ─── Update an entry (owner only) ────────────── */
async function updateEntry({ userId, entryId, category, subCategory, quantity, description, entryDate }) {
  const existing = await prisma.carbonEntry.findUnique({ where: { id: entryId } });
  if (!existing || existing.userId !== userId) {
    const err = new Error('Entry not found.'); err.statusCode = 404; throw err;
  }

  // Resolve final category/sub to recompute the factor
  const cat = category ?? existing.category;
  const sub = subCategory ?? existing.subCategory;
  const factorInfo = getFactorInfo(cat, sub);
  if (!factorInfo) {
    const err = new Error('Unknown category / sub-category combination.'); err.statusCode = 400; throw err;
  }

  const qty = quantity != null ? parseFloat(quantity) : existing.quantity;
  if (isNaN(qty) || qty < 0) {
    const err = new Error('quantity must be a positive number.'); err.statusCode = 400; throw err;
  }

  const valueKg = parseFloat((qty * factorInfo.factor).toFixed(4));

  return prisma.carbonEntry.update({
    where: { id: entryId },
    data: {
      category:    cat,
      subCategory: sub,
      scope:       factorInfo.scope,
      unit:        factorInfo.unit,
      quantity:    qty,
      valueKg,
      description: description !== undefined ? (description || null) : existing.description,
      entryDate:   entryDate ? new Date(entryDate) : existing.entryDate,
    },
  });
}

/* ─── Delete an entry (owner only) ────────────── */
async function deleteEntry({ userId, entryId }) {
  const existing = await prisma.carbonEntry.findUnique({ where: { id: entryId } });
  if (!existing || existing.userId !== userId) {
    const err = new Error('Entry not found.'); err.statusCode = 404; throw err;
  }
  await prisma.carbonEntry.delete({ where: { id: entryId } });
  return { id: entryId };
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

  /* ── GHG Protocol Scope 3 category breakdown ── */
  const ghg3Map = {};
  entries.filter((e) => e.scope === 'scope3').forEach((e) => {
    const fi     = getFactorInfo(e.category, e.subCategory);
    const ghgCat = fi?.ghgCat ?? 'Other Scope 3';
    ghg3Map[ghgCat] = (ghg3Map[ghgCat] ?? 0) + e.valueKg;
  });
  const scope3Breakdown = Object.entries(ghg3Map)
    .map(([cat, kg]) => ({ cat, kg: fmt(kg), pct: scope3 > 0 ? parseFloat((kg / scope3 * 100).toFixed(1)) : 0 }))
    .sort((a, b) => b.kg - a.kg);

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
    scope3Breakdown,
    employeeComparison,
    sustainabilityScore: calcSustainabilityScore(entries, timeSeries),
    period,
    isOrgWide: isAdmin,
  };
}

/* ─── Holt-Winters Exponential Smoothing ──────── */
function holtWinters(data) {
  // data: array of numbers (kg CO₂e per month)
  // Returns: { fitted, forecast, trend, level, confidence }
  const n = data.length;
  if (n < 2) return null;

  // Default hyperparameters
  const alpha = 0.3; // level smoothing
  const beta  = 0.1; // trend smoothing
  const freq  = Math.min(12, n); // seasonal period (up to 12 months)
  const hasSeasonality = n >= 12;
  const gamma = hasSeasonality ? 0.1 : 0; // seasonal smoothing

  let level = data[0];
  let trend = (data[1] - data[0]) * 0.5; // initial trend
  const seasonal = [];

  // Initialize seasonal components if enough data
  if (hasSeasonality) {
    const avgPerSeason = Array(freq).fill(0);
    const countsPerSeason = Array(freq).fill(0);
    for (let i = 0; i < n; i++) {
      avgPerSeason[i % freq] += data[i];
      countsPerSeason[i % freq]++;
    }
    for (let i = 0; i < freq; i++) {
      const avgLevel = data.slice(0, Math.min(freq, n)).reduce((s, x) => s + x, 0) / Math.min(freq, n);
      seasonal[i] = (avgPerSeason[i] / countsPerSeason[i]) - avgLevel;
    }
  }

  // Fit the model
  const fitted = [];
  for (let t = 0; t < n; t++) {
    let prediction = level + trend;
    if (hasSeasonality && t >= freq) prediction += seasonal[t % freq];

    fitted.push(prediction);

    // Update level
    let obs = data[t];
    if (hasSeasonality && t >= freq) obs = obs - seasonal[t % freq];
    const oldLevel = level;
    level = alpha * obs + (1 - alpha) * (oldLevel + trend);

    // Update trend
    trend = beta * (level - oldLevel) + (1 - beta) * trend;

    // Update seasonal
    if (hasSeasonality && t >= freq) {
      seasonal[t % freq] = gamma * (data[t] - level) + (1 - gamma) * seasonal[t % freq];
    }
  }

  // Residuals & RMSE
  const residuals = fitted.map((f, i) => data[i] - f);
  const rmse = Math.sqrt(residuals.reduce((s, r) => s + r ** 2, 0) / n);

  // Calculate a pseudo-R² based on MAE reduction
  const meanData = data.reduce((s, x) => s + x, 0) / n;
  const maeNaive = data.slice(1).reduce((s, x, i) => s + Math.abs(x - data[i]), 0) / (n - 1);
  const maeModel = residuals.reduce((s, r) => s + Math.abs(r), 0) / n;
  const r2 = Math.max(0, 1 - maeModel / (maeNaive || 1));

  // Forecast next 12 months
  const forecast = [];
  for (let i = 1; i <= 12; i++) {
    let pred = level + trend * i;
    if (hasSeasonality) pred += seasonal[(n + i - 1) % freq];
    pred = Math.max(0, pred);
    const confInt = 1.96 * rmse; // 95% CI
    forecast.push({ pred, lower: Math.max(0, pred - confInt), upper: pred + confInt });
  }

  return {
    fitted,
    forecast,
    level: fmt(level),
    trend: fmt(trend),
    rmse: fmt(rmse),
    r2: parseFloat(r2.toFixed(4)),
    hasSeasonality,
    freq: hasSeasonality ? freq : 0,
  };
}

function linearRegression(points) {
  // Fallback linear regression (kept for compatibility)
  const n    = points.length;
  const sumX  = points.reduce((s, p) => s + p.x, 0);
  const sumY  = points.reduce((s, p) => s + p.y, 0);
  const sumXY = points.reduce((s, p) => s + p.x * p.y, 0);
  const sumX2 = points.reduce((s, p) => s + p.x * p.x, 0);

  const denom    = n * sumX2 - sumX * sumX;
  const slope    = denom !== 0 ? (n * sumXY - sumX * sumY) / denom : 0;
  const intercept = (sumY - slope * sumX) / n;

  const yMean = sumY / n;
  const ssTot = points.reduce((s, p) => s + (p.y - yMean) ** 2, 0);
  const ssRes = points.reduce((s, p) => s + (p.y - (slope * p.x + intercept)) ** 2, 0);
  const r2    = ssTot > 0 ? Math.max(0, 1 - ssRes / ssTot) : 1;

  const se    = n > 2 ? Math.sqrt(ssRes / (n - 2)) : Math.abs(slope * 0.2);
  const xBar  = sumX / n;
  const sxx   = points.reduce((s, p) => s + (p.x - xBar) ** 2, 0);

  return { slope, intercept, r2, se, xBar, sxx, n };
}

function predictionInterval(model, xNew, zScore = 1.645) {
  const { se, n, xBar, sxx } = model;
  const factor = Math.sqrt(1 + 1 / n + (xNew - xBar) ** 2 / Math.max(sxx, 0.001));
  return zScore * se * factor;
}

/* ─── Forecast endpoint ────────────────────────── */
async function getForecast(userId, isAdmin = false, forecastMonths = 6) {
  const userWhere = isAdmin ? {} : { userId };

  // Pull ALL historical entries (not period-limited) for the best regression
  const entries = await prisma.carbonEntry.findMany({
    where:   userWhere,
    select:  { valueKg: true, entryDate: true },
    orderBy: { entryDate: 'asc' },
  });

  if (!entries.length) {
    return { historical: [], forecast: [], model: null, error: 'No data yet. Log carbon entries to enable predictions.' };
  }

  // Aggregate by month
  const monthMap = {};
  entries.forEach((e) => {
    const d   = new Date(e.entryDate);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthMap[key] = (monthMap[key] ?? 0) + e.valueKg;
  });

  // Build sorted historical array
  const historical = Object.entries(monthMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, kg], i) => {
      const [year, month] = key.split('-').map(Number);
      const d = new Date(year, month - 1);
      return {
        index:  i + 1,
        year,
        month,
        label:  d.toLocaleString('en', { month: 'short', year: '2-digit' }),
        actual: fmt(kg),
      };
    });

  if (historical.length < 2) {
    return {
      historical,
      forecast: [],
      model:    null,
      error:    `Need at least 2 months of data — you have ${historical.length}. Keep logging!`,
    };
  }

  // Run Holt-Winters exponential smoothing
  const actualValues = historical.map(h => h.actual);
  const hwModel = holtWinters(actualValues);

  if (!hwModel) {
    return {
      historical,
      forecast: [],
      model:    null,
      error:    'Could not generate forecast. Try logging more consistent data.',
    };
  }

  // Build forecast objects with dates
  const last     = historical[historical.length - 1];
  const lastDate = new Date(last.year, last.month - 1);
  const forecast = [];

  for (let i = 0; i < Math.min(forecastMonths, hwModel.forecast.length); i++) {
    const { pred, lower, upper } = hwModel.forecast[i];
    const futureD = new Date(lastDate);
    futureD.setMonth(futureD.getMonth() + i + 1);

    forecast.push({
      index:     last.index + i + 1,
      year:      futureD.getFullYear(),
      month:     futureD.getMonth() + 1,
      label:     futureD.toLocaleString('en', { month: 'short', year: '2-digit' }),
      predicted: fmt(pred),
      lower:     fmt(lower),
      upper:     fmt(upper),
    });
  }

  // Model quality assessment
  const r2 = hwModel.r2;
  const confidence = r2 >= 0.80 ? 'Very High' : r2 >= 0.60 ? 'High' : r2 >= 0.40 ? 'Moderate' : 'Low';
  const trend      = hwModel.trend > 1  ? 'Increasing' : hwModel.trend < -1 ? 'Decreasing' : 'Stable';
  const trendColor = hwModel.trend > 1  ? '#DC2626'    : hwModel.trend < -1 ? '#2D6A4F'    : '#C4952A';
  const slope      = fmt(hwModel.trend);

  return {
    historical,
    forecast,
    model: {
      type:           hwModel.hasSeasonality ? 'Holt-Winters (seasonal)' : 'Holt\'s Double Exponential Smoothing',
      slope:          slope,
      intercept:      fmt(hwModel.level),
      r2:             r2,
      r2Pct:          parseFloat((r2 * 100).toFixed(1)),
      confidence,
      trend,
      trendColor,
      monthlyChange:  slope,
      dataPoints:     historical.length,
      forecastMonths: forecastMonths,
      rmse:           hwModel.rmse,
      seasonal:       hwModel.hasSeasonality ? `Yes (${hwModel.freq}-month period)` : 'No',
    },
  };
}

module.exports = { createEntry, updateEntry, deleteEntry, bulkCreateEntries, getUserEntries, getLeaderboard, getUserSummary, getAnalytics, getForecast, FACTORS };
