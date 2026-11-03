/**
 * Seeds the local SQLite database with demo accounts and ~18 months of
 * realistic carbon entries, so dashboards, analytics and CarboncastX
 * forecasts have data to show straight away.
 *
 * Usage:
 *   node scripts/seedDemo.js           # only seeds if the demo user is missing
 *   node scripts/seedDemo.js --reset   # wipes demo users' entries and re-seeds
 *
 * Accounts created:
 *   Admin  admin@carbonx.com / Admin@CarbonX1
 *   User   demo@carbonx.com  / Demo@CarbonX1
 *   + 4 employee accounts (employee1..4@carbonx.com / Employee@CarbonX1)
 */

require('dotenv').config();
const bcrypt           = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { FACTORS }      = require('../services/carbonService');

const prisma = new PrismaClient();
const RESET  = process.argv.includes('--reset');
const MONTHS = 18;

const ACCOUNTS = [
  { name: 'CarbonX Admin',  email: 'admin@carbonx.com',     password: 'Admin@CarbonX1',    role: 'ADMIN', scale: 1.3 },
  { name: 'Ayesha Khan',    email: 'demo@carbonx.com',      password: 'Demo@CarbonX1',     role: 'USER',  scale: 1.0 },
  { name: 'Bilal Ahmed',    email: 'employee1@carbonx.com', password: 'Employee@CarbonX1', role: 'USER',  scale: 1.4 },
  { name: 'Sana Malik',     email: 'employee2@carbonx.com', password: 'Employee@CarbonX1', role: 'USER',  scale: 0.7 },
  { name: 'Usman Tariq',    email: 'employee3@carbonx.com', password: 'Employee@CarbonX1', role: 'USER',  scale: 1.1 },
  { name: 'Hira Siddiqui',  email: 'employee4@carbonx.com', password: 'Employee@CarbonX1', role: 'USER',  scale: 0.9 },
];

/* Deterministic PRNG so every reseed gives the same demo numbers */
let seed = 42;
const rand = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
const jitter = (v, pct = 0.15) => v * (1 + (rand() * 2 - 1) * pct);

/* Monthly activity template: [category, subCategory, base quantity, entries per month] */
const TEMPLATE = [
  ['commute', 'car_petrol',  380, 4],
  ['commute', 'bus',         120, 2],
  ['commute', 'motorbike',    90, 2],
  ['energy',  'electricity', 320, 1],
  ['energy',  'natural_gas',  45, 1],
  ['energy',  'lpg',          11, 1],
  ['food',    'beef',          6, 2],
  ['food',    'chicken',      14, 2],
  ['food',    'vegetarian',   20, 1],
  ['waste',   'landfill',     35, 1],
];

/* Pakistan seasonality: summer AC load spikes electricity, winter spikes gas */
function seasonal(sub, month) {
  if (sub === 'electricity') return [0.7, 0.7, 0.85, 1.1, 1.4, 1.6, 1.6, 1.5, 1.3, 1.0, 0.8, 0.7][month];
  if (sub === 'natural_gas' || sub === 'lpg') return [1.7, 1.5, 1.1, 0.8, 0.6, 0.5, 0.5, 0.5, 0.6, 0.8, 1.2, 1.6][month];
  return 1;
}

function buildEntries(userId, scale) {
  const entries = [];
  const now = new Date();
  for (let i = MONTHS - 1; i >= 0; i--) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const m = monthStart.getMonth();
    /* Gentle downward trend: users improve ~1% a month after joining CarbonX */
    const trend = 1 - (MONTHS - 1 - i) * 0.01;
    const daysInMonth = i === 0 ? now.getDate() : new Date(monthStart.getFullYear(), m + 1, 0).getDate();

    for (const [category, sub, base, perMonth] of TEMPLATE) {
      const fi = FACTORS[category][sub];
      for (let k = 0; k < perMonth; k++) {
        const quantity = parseFloat(jitter(base * scale * seasonal(sub, m) * trend / perMonth).toFixed(1));
        const day = 1 + Math.floor(rand() * Math.max(daysInMonth - 1, 1));
        entries.push({
          userId, category, subCategory: sub, scope: fi.scope, unit: fi.unit, quantity,
          valueKg:   parseFloat((quantity * fi.factor).toFixed(4)),
          entryDate: new Date(monthStart.getFullYear(), m, day, 10),
          description: `${fi.label} (demo data)`,
        });
      }
    }
    /* A business flight every quarter */
    if (m % 3 === 1) {
      const fi = FACTORS.travel.flight_short;
      const quantity = 1050; // Karachi → Lahore
      entries.push({
        userId, category: 'travel', subCategory: 'flight_short', scope: fi.scope, unit: fi.unit, quantity,
        valueKg: parseFloat((quantity * fi.factor).toFixed(4)),
        entryDate: new Date(monthStart.getFullYear(), m, 12, 10),
        description: 'Karachi → Lahore (demo data)',
      });
    }
  }
  return entries;
}

async function main() {
  const existing = await prisma.user.findUnique({ where: { email: 'demo@carbonx.com' } });
  if (existing && !RESET) {
    console.log('Demo data already present — skipping (use --reset to re-seed).');
    return;
  }

  for (const acc of ACCOUNTS) {
    const hash = await bcrypt.hash(acc.password, 12);
    const user = await prisma.user.upsert({
      where:  { email: acc.email },
      update: { name: acc.name, password: hash, role: acc.role },
      create: { name: acc.name, email: acc.email, password: hash, role: acc.role },
    });
    await prisma.carbonEntry.deleteMany({ where: { userId: user.id } });
    await prisma.forecast.deleteMany({ where: { userId: user.id } });
    const entries = buildEntries(user.id, acc.scale);
    await prisma.carbonEntry.createMany({ data: entries });

    if (acc.email === 'demo@carbonx.com') {
      await prisma.goal.deleteMany({ where: { userId: user.id } });
      await prisma.goal.create({ data: { userId: user.id, title: 'Cut monthly footprint below 250 kg', targetKg: 250 } });
    }
    console.log(`  ✓ ${acc.role.padEnd(5)} ${acc.email.padEnd(24)} ${entries.length} entries`);
  }
  console.log('\nDemo data seeded.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
