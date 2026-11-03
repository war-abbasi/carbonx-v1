/**
 * Seeds the local database with the carbonx-team organisation: one admin and
 * eleven university students, each with the last 2 months of carbon logs,
 * challenges and a few admin awards — so dashboards, the admin panel and the
 * Awards leaderboard have realistic data straight away.
 *
 * Usage:
 *   node scripts/seedDemo.js           # only seeds if the organisation is missing
 *   node scripts/seedDemo.js --reset   # wipes the team's data and re-seeds
 *
 * Demo logins (local test accounts only):
 *   Admin     warabbasi4@gmail.com                    / CarbonX@Admin2026
 *   Students  <first>.<last>@carbonx-team.test         / CarbonX@Student1
 *             e.g. wardah.abbasi@carbonx-team.test
 */

require('dotenv').config();
const fs               = require('fs');
const path             = require('path');
const bcrypt           = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { FACTORS }      = require('../services/carbonService');

const prisma = new PrismaClient();
const RESET  = process.argv.includes('--reset');
const ORG    = 'carbonx-team';
const DAYS   = 60;

const ADMIN = { name: 'Administrator', email: 'warabbasi4@gmail.com', password: 'CarbonX@Admin2026' };
const STUDENT_PASSWORD = 'CarbonX@Student1';

/* Accounts from the earlier generic demo seed — removed so only the team remains */
const LEGACY_EMAILS = [
  'admin@carbonx.com', 'demo@carbonx.com',
  'employee1@carbonx.com', 'employee2@carbonx.com', 'employee3@carbonx.com', 'employee4@carbonx.com',
];

/*
 * Commute profiles (per university day, round trip):
 *   car     — drives (only Wardah and Salma own cars)
 *   bus     — university van / public bus
 *   taxi    — ride-share trips per week (Careem / inDrive)
 *   walk    — walks to campus
 *   hostel  — lives in the hostel; travels home by road every other weekend
 * shiftDay — day (0–59) from which a car user carpools/takes the bus 3 days a week
 * logRate  — share of days the student actually logs (consistency)
 * challenges — [id, status, startDay, completeDay?]
 */
const STUDENTS = [
  { name: 'Wardah Zia Abbasi',  email: 'wardah.abbasi',  car: 22, shiftDay: 24, beefPerWeek: 0.5, kwh: [105, 62],  logRate: 0.95,
    challenges: [['carpool_week', 'completed', 26, 33], ['bus_month', 'active', 34]] },
  { name: 'Salma Imtiaz',       email: 'salma.imtiaz',   car: 30, beefPerWeek: 2,   kwh: [120, 105], logRate: 0.85,
    challenges: [['energy_saver', 'active', 40]] },
  { name: 'Zoha Latif',         email: 'zoha.latif',     walk: 2, hostel: 380,      beefPerWeek: 0.5, kwh: [45, 40],  logRate: 0.9,
    challenges: [['meat_free_week', 'completed', 12, 19], ['led_switch', 'active', 45]] },
  { name: 'Areesha Khawar',     email: 'areesha.khawar', bus: 16, beefPerWeek: 0.5, kwh: [70, 55],  logRate: 0.95,
    challenges: [['walk_week', 'completed', 5, 12], ['meat_free_week', 'completed', 20, 27], ['led_switch', 'completed', 30, 38]] },
  { name: 'Tooba Zainab',       email: 'tooba.zainab',   bus: 24, taxi: 2, beefPerWeek: 1, kwh: [85, 70],  logRate: 0.8,
    challenges: [['walk_week', 'active', 50]] },
  { name: 'Ayesha Shafiq Malik', email: 'ayesha.malik',  bus: 12, beefPerWeek: 0,   kwh: [65, 55],  logRate: 0.9, veg: 0.6,
    challenges: [['no_beef_month', 'completed', 2, 32]] },
  { name: 'Mahad Zulfiqar',     email: 'mahad.zulfiqar', bus: 30, taxi: 3, beefPerWeek: 2, kwh: [100, 90], logRate: 0.75,
    challenges: [] },
  { name: 'Tayyaba Zahid',      email: 'tayyaba.zahid',  bus: 20, beefPerWeek: 1,   kwh: [80, 65],  logRate: 0.85,
    challenges: [['local_food_week', 'completed', 15, 22]] },
  { name: 'Alishba Amin',       email: 'alishba.amin',   walk: 3, busPerWeek: 1, bus: 10, beefPerWeek: 0.5, kwh: [55, 55], logRate: 0.9,
    challenges: [['walk_week', 'completed', 8, 15], ['meat_free_week', 'active', 48]] },
  { name: 'Haleema Sadia',      email: 'haleema.sadia',  bus: 18, beefPerWeek: 1,   kwh: [75, 70],  logRate: 0.5,
    challenges: [['energy_saver', 'active', 35]] },
  { name: 'Amber Imtiaz',       email: 'amber.imtiaz',   bus: 26, taxi: 1, beefPerWeek: 1, kwh: [90, 72], logRate: 0.85, improving: true,
    challenges: [['meat_free_week', 'completed', 30, 37]] },
];

/* Admin recognition already given during the two months */
const AWARDS = [
  { email: 'areesha.khawar', title: 'Sustainability Ambassador', icon: '🌍', points: 75, day: 40,
    reason: 'Ran the campus Earth Hour drive and completed three challenges' },
  { email: 'wardah.abbasi',  title: 'Carpool Organiser',         icon: '🚗', points: 50, day: 36,
    reason: 'Started a carpool group that cut four students\' car trips' },
  { email: 'alishba.amin',   title: 'Green Commute Star',        icon: '🚶', points: 40, day: 50,
    reason: 'Walked to campus almost every day this semester' },
];

/* Deterministic PRNG so every reseed gives the same numbers */
let seed = 2026;
const rand   = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
const jitter = (v, pct = 0.12) => v * (1 + (rand() * 2 - 1) * pct);
const chance = (p) => rand() < p;

const today = new Date(); today.setHours(0, 0, 0, 0);
const dayDate = (d, hour = 9) => { const x = new Date(today); x.setDate(x.getDate() - (DAYS - 1 - d)); x.setHours(hour); return x; };

function entry(userId, category, sub, quantity, d, description, hour) {
  const fi = FACTORS[category][sub];
  const q  = parseFloat(quantity.toFixed(1));
  return {
    userId, category, subCategory: sub, scope: fi.scope, unit: fi.unit, quantity: q,
    valueKg: parseFloat((q * fi.factor).toFixed(4)), entryDate: dayDate(d, hour), description,
  };
}

function buildEntries(userId, p) {
  const out = [];
  let fridays = 0;
  for (let d = 0; d < DAYS; d++) {
    const date = dayDate(d);
    const dow  = date.getDay();               // 0 Sun … 6 Sat
    const uniDay = dow >= 1 && dow <= 5;
    const logs = chance(p.logRate);
    const late = d >= 30;                     // second month

    if (uniDay && logs) {
      if (p.car) {
        /* After the shift day, 3 of 5 days are carpool/bus instead of driving alone */
        const shifted = p.shiftDay != null && d >= p.shiftDay && dow >= 2 && dow <= 4;
        if (shifted) out.push(entry(userId, 'commute', 'bus', jitter(p.car), d, 'Carpool / van to university'));
        else         out.push(entry(userId, 'commute', 'car_petrol', jitter(p.car), d, 'Drove to university'));
      }
      if (p.bus && !p.busPerWeek) out.push(entry(userId, 'commute', 'bus', jitter(p.bus), d, 'University van / bus'));
      if (p.busPerWeek && dow === 3) out.push(entry(userId, 'commute', 'bus', jitter(p.bus), d, 'Bus to university'));
      if (p.walk && !(p.busPerWeek && dow === 3)) out.push(entry(userId, 'commute', 'walking', jitter(p.walk), d, p.hostel ? 'Walked hostel → campus' : 'Walked to university'));
      if (p.taxi) {
        const rate = (p.improving && late ? p.taxi * 0.5 : p.taxi) / 5;
        if (chance(rate)) out.push(entry(userId, 'travel', 'taxi', jitter(9), d, 'Ride-share (Careem / inDrive)', 17));
      }
    }

    /* Zoha: home by road every other weekend (Fri out, Sun back) */
    if (p.hostel && dow === 5) {
      if (fridays++ % 2 === 0) {
        out.push(entry(userId, 'commute', 'bus', p.hostel, d, 'Intercity bus: hostel → home', 16));
        if (d + 2 < DAYS) out.push(entry(userId, 'commute', 'bus', p.hostel, d + 2, 'Intercity bus: home → hostel', 15));
      }
    }

    /* Meals: roughly one logged meal a day */
    if (logs) {
      const beefShare = (p.improving && late ? p.beefPerWeek * 0.5 : p.beefPerWeek) / 7;
      const r = rand();
      let sub = 'chicken';
      if (r < beefShare) sub = 'beef';
      else if (r < beefShare + (p.veg ?? 0.3)) sub = 'vegetarian';
      else if (r > 0.95) sub = 'fish';
      out.push(entry(userId, 'food', sub, 1, d, p.hostel ? 'Hostel mess' : 'Lunch', 13));
    }

    /* Printing assignments on Mondays */
    if (dow === 1 && logs) out.push(entry(userId, 'purchased_goods', 'paper', jitter(0.3, 0.4), d, 'Printed assignments', 11));
  }

  /* Monthly home / hostel electricity share (first month hotter → more AC) */
  out.push(entry(userId, 'energy', 'electricity', p.kwh[0], 6,  p.hostel ? 'Hostel room electricity share' : 'Home electricity share', 20));
  out.push(entry(userId, 'energy', 'electricity', p.kwh[1], 36, p.hostel ? 'Hostel room electricity share' : 'Home electricity share', 20));
  if (!p.hostel) {
    out.push(entry(userId, 'energy', 'natural_gas', jitter(8), 6,  'Home gas share', 20));
    out.push(entry(userId, 'energy', 'natural_gas', jitter(11), 36, 'Home gas share', 20));
  }
  return out;
}

/* --reset overwrites live data (awards given, users added), so keep a copy of the SQLite file first */
function backupDatabase() {
  const url = process.env.DATABASE_URL ?? '';
  if (!url.startsWith('file:')) return;
  const dbFile = path.resolve(__dirname, '../prisma', url.slice(5));
  if (!fs.existsSync(dbFile)) return;
  const dir = path.join(path.dirname(dbFile), 'backups');
  fs.mkdirSync(dir, { recursive: true });
  const dest = path.join(dir, `carbonx-${new Date().toISOString().replace(/[:.]/g, '-')}.db`);
  fs.copyFileSync(dbFile, dest);
  console.log(`  Backed up current database to ${path.relative(process.cwd(), dest)}`);
}

async function main() {
  const existing = await prisma.organization.findUnique({ where: { name: ORG } });
  if (existing && !RESET) {
    console.log(`Organisation "${ORG}" already seeded — skipping (use --reset to re-seed).`);
    return;
  }
  if (existing) backupDatabase();

  await prisma.user.deleteMany({ where: { email: { in: LEGACY_EMAILS } } });
  const org = await prisma.organization.upsert({ where: { name: ORG }, update: {}, create: { name: ORG } });

  const admin = await prisma.user.upsert({
    where:  { email: ADMIN.email },
    update: { name: ADMIN.name, role: 'ADMIN', active: true, organizationId: org.id, password: await bcrypt.hash(ADMIN.password, 12) },
    create: { name: ADMIN.name, email: ADMIN.email, role: 'ADMIN', organizationId: org.id, password: await bcrypt.hash(ADMIN.password, 12) },
  });
  console.log(`  ✓ ADMIN ${ADMIN.email}`);

  const studentHash = await bcrypt.hash(STUDENT_PASSWORD, 12);
  const ids = {};
  for (const p of STUDENTS) {
    const email = `${p.email}@carbonx-team.test`;
    const user = await prisma.user.upsert({
      where:  { email },
      update: { name: p.name, role: 'USER', active: true, organizationId: org.id, password: studentHash },
      create: { name: p.name, email, role: 'USER', organizationId: org.id, password: studentHash },
    });
    ids[p.email] = user.id;

    await prisma.carbonEntry.deleteMany({ where: { userId: user.id } });
    await prisma.forecast.deleteMany({ where: { userId: user.id } });
    await prisma.userChallenge.deleteMany({ where: { userId: user.id } });
    await prisma.award.deleteMany({ where: { userId: user.id } });

    const entries = buildEntries(user.id, p);
    await prisma.carbonEntry.createMany({ data: entries });
    for (const [challengeId, status, start, done] of p.challenges) {
      await prisma.userChallenge.create({
        data: { userId: user.id, challengeId, status, startedAt: dayDate(start), completedAt: done != null ? dayDate(done, 18) : null },
      });
    }
    const kg = entries.reduce((s, e) => s + e.valueKg, 0);
    console.log(`  ✓ USER  ${email.padEnd(36)} ${String(entries.length).padStart(3)} entries  ${kg.toFixed(0).padStart(4)} kg`);
  }

  for (const a of AWARDS) {
    await prisma.award.create({
      data: { userId: ids[a.email], awardedById: admin.id, title: a.title, icon: a.icon, points: a.points, reason: a.reason, createdAt: dayDate(a.day, 12) },
    });
  }

  console.log(`\nOrganisation "${ORG}" seeded: 1 admin, ${STUDENTS.length} students, ${AWARDS.length} admin awards.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
