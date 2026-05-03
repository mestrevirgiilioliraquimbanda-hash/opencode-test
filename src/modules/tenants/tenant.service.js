const prisma = require('../../config/database');
const logger = require('../../config/logger');

async function createTenant({ name, slug, domain, ownerId }) {
  const existingTenant = await prisma.tenant.findFirst({
    where: {
      OR: [{ slug }, ...(domain ? [{ domain }] : [])]
    }
  });

  if (existingTenant) {
    throw new Error('Tenant with this slug or domain already exists');
  }

  const tenant = await prisma.tenant.create({
    data: {
      name,
      slug,
      domain,
      settings: {}
    }
  });

  await prisma.subscription.create({
    data: {
      tenantId: tenant.id,
      plan: 'FREE',
      status: 'TRIALING',
      trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
    }
  });

  return tenant;
}

async function getTenantById(id) {
  const tenant = await prisma.tenant.findUnique({
    where: { id },
    include: {
      subscriptions: true,
      _count: {
        select: { users: true }
      }
    }
  });

  if (!tenant) {
    throw new Error('Tenant not found');
  }

  return tenant;
}

async function getTenantBySlug(slug) {
  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    include: {
      subscriptions: true,
      _count: {
        select: { users: true }
      }
    }
  });

  if (!tenant) {
    throw new Error('Tenant not found');
  }

  return tenant;
}

async function updateTenant(id, data) {
  const { name, domain, settings } = data;

  const updateData = {};
  if (name !== undefined) updateData.name = name;
  if (domain !== undefined) updateData.domain = domain;
  if (settings !== undefined) updateData.settings = settings;

  const tenant = await prisma.tenant.update({
    where: { id },
    data: updateData
  });

  return tenant;
}

async function suspendTenant(id) {
  const tenant = await prisma.tenant.update({
    where: { id },
    data: { status: 'SUSPENDED' }
  });

  return tenant;
}

async function activateTenant(id) {
  const tenant = await prisma.tenant.update({
    where: { id },
    data: { status: 'ACTIVE' }
  });

  return tenant;
}

async function deleteTenant(id) {
  const tenant = await prisma.tenant.update({
    where: { id },
    data: {
      status: 'DELETED',
      deletedAt: new Date()
    }
  });

  return tenant;
}

async function listTenants({ page = 1, limit = 20, status } = {}) {
  const skip = (page - 1) * limit;

  const where = {};
  if (status) where.status = status;

  const [tenants, total] = await Promise.all([
    prisma.tenant.findMany({
      where,
      skip,
      take: limit,
      include: {
        _count: {
          select: { users: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.tenant.count({ where })
  ]);

  return {
    data: tenants,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}

module.exports = {
  createTenant,
  getTenantById,
  getTenantBySlug,
  updateTenant,
  suspendTenant,
  activateTenant,
  deleteTenant,
  listTenants
};
