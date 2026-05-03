const bcrypt = require('bcrypt');
const prisma = require('../../config/database');
const logger = require('../../config/logger');

const SALT_ROUNDS = 12;

async function createUser({ email, password, firstName, lastName, role, tenantId }) {
  const existingUser = await prisma.user.findUnique({
    where: { email },
    include: { tenant: true }
  });

  if (existingUser && !existingUser.deletedAt) {
    throw new Error('Email already in use');
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role,
      tenantId
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

  return user;
}

async function getUserById(id) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      avatar: true,
      role: true,
      emailVerified: true,
      lastLoginAt: true,
      tenantId: true,
      createdAt: true,
      updatedAt: true
    }
  });

  if (!user) {
    throw new Error('User not found');
  }

  return user;
}

async function getUserByEmail(email) {
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      tenantId: true
    }
  });

  return user;
}

async function getUsersByTenant(tenantId, { page = 1, limit = 20 } = {}) {
  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where: { tenantId, deletedAt: null },
      skip,
      take: limit,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        emailVerified: true,
        lastLoginAt: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.user.count({ where: { tenantId, deletedAt: null } })
  ]);

  return {
    data: users,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}

async function updateUser(id, data) {
  const { firstName, lastName, avatar, role } = data;

  const updateData = {};
  if (firstName !== undefined) updateData.firstName = firstName;
  if (lastName !== undefined) updateData.lastName = lastName;
  if (avatar !== undefined) updateData.avatar = avatar;
  if (role !== undefined) updateData.role = role;

  const user = await prisma.user.update({
    where: { id },
    data: updateData,
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      avatar: true,
      role: true,
      updatedAt: true
    }
  });

  return user;
}

async function updatePassword(id, currentPassword, newPassword) {
  const user = await prisma.user.findUnique({ where: { id } });

  if (!user) {
    throw new Error('User not found');
  }

  const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);

  if (!isCurrentPasswordValid) {
    throw new Error('Current password is incorrect');
  }

  const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

  await prisma.user.update({
    where: { id },
    data: { password: hashedPassword }
  });
}

async function deactivateUser(id) {
  const user = await prisma.user.update({
    where: { id },
    data: { deletedAt: new Date() }
  });

  return user;
}

async function verifyEmail(token) {
  const user = await prisma.user.findFirst({
    where: {
      emailVerificationToken: token,
      emailVerificationExpiresAt: { gt: new Date() }
    }
  });

  if (!user) {
    throw new Error('Invalid or expired verification token');
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: true,
      emailVerifiedAt: new Date(),
      emailVerificationToken: null,
      emailVerificationExpiresAt: null
    }
  });
}

module.exports = {
  createUser,
  getUserById,
  getUserByEmail,
  getUsersByTenant,
  updateUser,
  updatePassword,
  deactivateUser,
  verifyEmail
};
