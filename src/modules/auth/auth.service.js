const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const prisma = require('../../config/database');
const config = require('../../config');
const logger = require('../../config/logger');

const SALT_ROUNDS = 12;

async function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

async function comparePassword(password, hashedPassword) {
  return bcrypt.compare(password, hashedPassword);
}

function generateTokens(user) {
  const payload = {
    id: user.id,
    email: user.email,
    tenantId: user.tenantId,
    role: user.role
  };

  const accessToken = jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn
  });

  const refreshToken = jwt.sign({ ...payload, type: 'refresh' }, config.jwt.secret, {
    expiresIn: config.jwt.refreshExpiresIn
  });

  return { accessToken, refreshToken };
}

async function register({ email, password, firstName, lastName, tenantSlug }) {
  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (existingUser) {
    throw new Error('Email already registered');
  }

  const tenant = await prisma.tenant.findUnique({
    where: { slug: tenantSlug },
    include: { subscriptions: true }
  });

  if (!tenant) {
    throw new Error('Tenant not found');
  }

  const hashedPassword = await hashPassword(password);

  const userCount = await prisma.user.count({ where: { tenantId: tenant.id } });

  const role = userCount === 0 ? 'OWNER' : 'MEMBER';

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role,
      tenantId: tenant.id
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      tenantId: true,
      createdAt: true
    }
  });

  const tokens = generateTokens(user);

  await prisma.refreshToken.create({
    data: {
      token: tokens.refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    }
  });

  return { user, accessToken: tokens.accessToken };
}

async function login({ email, password }) {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { tenant: true }
  });

  if (!user) {
    throw new Error('Invalid credentials');
  }

  if (user.deletedAt) {
    throw new Error('Account has been deactivated');
  }

  const isPasswordValid = await comparePassword(password, user.password);

  if (!isPasswordValid) {
    throw new Error('Invalid credentials');
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() }
  });

  const tokens = generateTokens(user);

  await prisma.refreshToken.create({
    data: {
      token: tokens.refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    }
  });

  const { password: _, ...userWithoutPassword } = user;

  return { user: userWithoutPassword, accessToken: tokens.accessToken };
}

async function refreshToken(token) {
  const storedToken = await prisma.refreshToken.findUnique({
    where: { token },
    include: { user: true }
  });

  if (!storedToken || storedToken.revokedAt) {
    throw new Error('Invalid refresh token');
  }

  if (storedToken.expiresAt < new Date()) {
    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revokedAt: new Date() }
    });
    throw new Error('Refresh token expired');
  }

  await prisma.refreshToken.update({
    where: { id: storedToken.id },
    data: { revokedAt: new Date() }
  });

  const tokens = generateTokens(storedToken.user);

  await prisma.refreshToken.create({
    data: {
      token: tokens.refreshToken,
      userId: storedToken.user.id,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    }
  });

  return { accessToken: tokens.accessToken };
}

async function logout(token) {
  await prisma.refreshToken.updateMany({
    where: { token },
    data: { revokedAt: new Date() }
  });
}

module.exports = { register, login, refreshToken, logout };
