/**
 * Delete throwaway test accounts created during debugging.
 *
 * Targets emails ending in "@test.com" (diag_*, ver_*, acc_*, dash_*, etc.).
 * Cascades to their carbon entries, goals, forecasts and conversations.
 *
 * Usage:
 *   node scripts/cleanupTestUsers.js            # dry run (lists matches)
 *   node scripts/cleanupTestUsers.js --apply    # actually delete
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const APPLY = process.argv.includes('--apply');

async function main() {
  await prisma.$connect();

  const users = await prisma.user.findMany({
    where: { email: { endsWith: '@test.com' }, role: { not: 'ADMIN' } },
    select: { id: true, name: true, email: true },
  });

  if (!users.length) { console.log('No @test.com accounts found. Nothing to do.'); return; }

  console.log(`Found ${users.length} test account(s):`);
  users.forEach((u) => console.log(`  #${u.id}  ${u.email}  (${u.name})`));

  if (!APPLY) {
    console.log('\nDry run. Re-run with --apply to delete these accounts.');
    return;
  }

  const ids = users.map((u) => u.id);
  const res = await prisma.user.deleteMany({ where: { id: { in: ids } } });
  console.log(`\n✅ Deleted ${res.count} test account(s) (and their cascaded data).`);
}

main()
  .catch((err) => { console.error('Error:', err.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
