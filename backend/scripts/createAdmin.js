/**
 * One-time script to create (or promote) an admin user.
 *
 * Usage:
 *   node scripts/createAdmin.js
 *   node scripts/createAdmin.js --name "Fawad" --email "admin@company.com" --password "MySecurePass1"
 *
 * If the email already exists, the script upgrades that account to ADMIN.
 */

require('dotenv').config();
const bcrypt       = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/* ── Parse CLI args ──────────────────────────── */
function arg(flag, fallback) {
  const idx = process.argv.indexOf(flag);
  return idx !== -1 ? process.argv[idx + 1] : fallback;
}

const name     = arg('--name',     'Admin User');
const email    = arg('--email',    'admin@carbonx.com').trim().toLowerCase();
const password = arg('--password', 'Admin@CarbonX1');

/* ── Validate password strength ─────────────── */
function validatePassword(pw) {
  if (pw.length < 8)              return 'Password must be at least 8 characters.';
  if (!/[A-Z]/.test(pw))         return 'Password must contain at least one uppercase letter.';
  if (!/[0-9]/.test(pw))         return 'Password must contain at least one number.';
  return null;
}

async function main() {
  console.log('\n🌿  CarbonX — Admin Account Setup\n');

  const pwError = validatePassword(password);
  if (pwError) {
    console.error('❌  ' + pwError);
    console.error('    Use: node scripts/createAdmin.js --password "YourPass1"\n');
    process.exit(1);
  }

  await prisma.$connect();

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    if (existing.role === 'ADMIN') {
      console.log(`ℹ️   ${email} is already an ADMIN. Nothing to do.\n`);
    } else {
      await prisma.user.update({ where: { email }, data: { role: 'ADMIN' } });
      console.log(`✅  Promoted existing account to ADMIN`);
      console.log(`    Name:  ${existing.name}`);
      console.log(`    Email: ${email}\n`);
    }
  } else {
    const hash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { name, email, password: hash, role: 'ADMIN' },
      select: { id: true, name: true, email: true, role: true },
    });
    console.log(`✅  Admin account created`);
    console.log(`    Name:     ${user.name}`);
    console.log(`    Email:    ${user.email}`);
    console.log(`    Password: ${password}`);
    console.log(`    Role:     ${user.role}\n`);
    console.log(`🔐  Save these credentials — the password is not stored in plain text.\n`);
  }
}

main()
  .catch((err) => { console.error('Error:', err.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
