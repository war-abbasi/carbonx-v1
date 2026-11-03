/**
 * Keeps the demo data current: shifts every dated record of the demo
 * organisation forward so its most recent log is today.
 * Everything moves together (entries, challenges, awards), so trends,
 * rankings and badges stay exactly as they were; only the calendar moves.
 * Shifts are whole days, so the 30/60-day windows line up exactly as when seeded.
 *
 * Usage: node scripts/rollForward.js     (start-local.ps1 runs this on every start)
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const ORG  = process.env.DEFAULT_ORGANIZATION || 'carbonx-team';
const DAY  = 86_400_000;
const startOfDay = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x.getTime(); };

const shift = (date, ms) => (date ? new Date(date.getTime() + ms) : date);

async function main() {
  const org = await prisma.organization.findUnique({ where: { name: ORG } });
  if (!org) return console.log(`No "${ORG}" organisation — nothing to roll forward.`);

  const userIds = (await prisma.user.findMany({ where: { organizationId: org.id }, select: { id: true } })).map((u) => u.id);
  const latest  = await prisma.carbonEntry.findFirst({
    where: { userId: { in: userIds } }, orderBy: { entryDate: 'desc' }, select: { entryDate: true },
  });
  if (!latest) return console.log('No entries yet — nothing to roll forward.');

  const days = Math.round((startOfDay(Date.now()) - startOfDay(latest.entryDate)) / DAY);
  if (days < 1) return console.log(`Demo data is current (latest log ${latest.entryDate.toDateString()}).`);
  const ms = days * DAY;

  const [entries, challenges, awards] = await Promise.all([
    prisma.carbonEntry.findMany({ where: { userId: { in: userIds } }, select: { id: true, entryDate: true, createdAt: true } }),
    prisma.userChallenge.findMany({ where: { userId: { in: userIds } }, select: { id: true, startedAt: true, completedAt: true } }),
    prisma.award.findMany({ where: { userId: { in: userIds } }, select: { id: true, createdAt: true } }),
  ]);

  await prisma.$transaction([
    ...entries.map((e) => prisma.carbonEntry.update({
      where: { id: e.id }, data: { entryDate: shift(e.entryDate, ms), createdAt: shift(e.createdAt, ms) },
    })),
    ...challenges.map((c) => prisma.userChallenge.update({
      where: { id: c.id }, data: { startedAt: shift(c.startedAt, ms), completedAt: shift(c.completedAt, ms) },
    })),
    ...awards.map((a) => prisma.award.update({ where: { id: a.id }, data: { createdAt: shift(a.createdAt, ms) } })),
    /* Cached forecasts were trained on the old months */
    prisma.forecast.deleteMany({ where: { userId: { in: userIds } } }),
  ]);

  console.log(`Rolled "${ORG}" forward ${days} day(s): ${entries.length} entries, ${challenges.length} challenges, ${awards.length} awards.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
