/**
 * Force-reset (or create) an admin account with a known password.
 * Overwrites whatever is currently in the database for that email.
 *
 * Usage:
 *   DATABASE_URL="mysql://..." node scripts/resetAdmin.js <email> <password>
 *
 * Example:
 *   DATABASE_URL="mysql://..." node scripts/resetAdmin.js wardahzia4@gmail.com Admin@123
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const email    = (process.argv[2] || '').trim().toLowerCase();
const password = (process.argv[3] || '').trim();

if (!email || !password) {
  console.error('\n❌  Usage: node scripts/resetAdmin.js <email> <password>\n');
  process.exit(1);
}

async function main() {
  console.log(`\n🌿  CarbonX — Force-reset admin: ${email}\n`);

  const hash = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where:  { email },
    update: { email, password: hash, role: 'ADMIN' },
    create: { name: 'Admin', email, password: hash, role: 'ADMIN' },
    select: { id: true, name: true, email: true, role: true },
  });

  console.log('✅  Done!');
  console.log(`    ID:       ${user.id}`);
  console.log(`    Email:    ${user.email}`);
  console.log(`    Role:     ${user.role}`);
  console.log(`    Password: ${password}`);
  console.log('\n🔐  You can now log in with these credentials.\n');
}

main()
  .catch((err) => { console.error('Error:', err.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
