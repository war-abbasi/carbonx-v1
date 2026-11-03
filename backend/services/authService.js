const bcrypt = require('bcryptjs');
const { prisma } = require('../config/db');
const { generateToken } = require('../utils/jwt');

async function registerUser({ name, email, password }) {
  const normalizedEmail = email.trim().toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    const err = new Error('An account with this email already exists.');
    err.statusCode = 409;
    throw err;
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  /* New sign-ups join the default organisation (if configured) so its admin can manage them */
  const defaultOrg = process.env.DEFAULT_ORGANIZATION
    ? await prisma.organization.findUnique({ where: { name: process.env.DEFAULT_ORGANIZATION } })
    : null;

  const user = await prisma.user.create({
    data: { name: name.trim(), email: normalizedEmail, password: hashedPassword, organizationId: defaultOrg?.id ?? null },
    select: {
      id: true, name: true, email: true, role: true, createdAt: true,
      organizationId: true, organization: { select: { id: true, name: true } },
    },
  });

  const token = generateToken({ id: user.id, email: user.email, role: user.role });
  return { user, token };
}

async function loginUser({ email, password }) {
  const normalizedEmail = email.trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where:   { email: normalizedEmail },
    include: { organization: { select: { id: true, name: true } } },
  });
  if (!user) {
    const err = new Error('Invalid email or password.');
    err.statusCode = 401;
    throw err;
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    const err = new Error('Invalid email or password.');
    err.statusCode = 401;
    throw err;
  }

  if (!user.active) {
    const err = new Error('Your account has been suspended. Contact your organisation admin.');
    err.statusCode = 403;
    throw err;
  }

  const { password: _pw, ...safeUser } = user;
  const token = generateToken({ id: safeUser.id, email: safeUser.email, role: safeUser.role });
  return { user: safeUser, token };
}

async function updateProfile({ userId, name, email }) {
  const data = {};
  if (name != null) {
    if (String(name).trim().length < 2) {
      const err = new Error('Name must be at least 2 characters.'); err.statusCode = 400; throw err;
    }
    data.name = String(name).trim();
  }
  if (email != null) {
    const normalizedEmail = String(email).trim().toLowerCase();
    const clash = await prisma.user.findFirst({
      where: { email: normalizedEmail, NOT: { id: userId } },
      select: { id: true },
    });
    if (clash) { const err = new Error('That email is already in use.'); err.statusCode = 409; throw err; }
    data.email = normalizedEmail;
  }
  if (Object.keys(data).length === 0) {
    const err = new Error('Nothing to update.'); err.statusCode = 400; throw err;
  }
  return prisma.user.update({
    where: { id: userId },
    data,
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });
}

async function changePassword({ userId, currentPassword, newPassword }) {
  if (!currentPassword || !newPassword) {
    const err = new Error('Current and new password are required.'); err.statusCode = 400; throw err;
  }
  if (String(newPassword).length < 8) {
    const err = new Error('New password must be at least 8 characters.'); err.statusCode = 400; throw err;
  }
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) { const err = new Error('User not found.'); err.statusCode = 404; throw err; }

  const ok = await bcrypt.compare(currentPassword, user.password);
  if (!ok) { const err = new Error('Current password is incorrect.'); err.statusCode = 401; throw err; }

  const hashed = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({ where: { id: userId }, data: { password: hashed } });
  return { updated: true };
}

module.exports = { registerUser, loginUser, updateProfile, changePassword };
