const prisma = require('../config/database');
const logger = require('../config/logger');

async function resolveTenant(req, res, next) {
  try {
    const tenantSlug = req.headers['x-tenant-slug'] || req.params.tenantSlug;
    const tenantDomain = req.headers['x-tenant-domain'];

    if (!tenantSlug && !tenantDomain) {
      return res.status(400).json({
        error: 'Tenant identification required',
        message: 'Provide x-tenant-slug header or x-tenant-domain header'
      });
    }

    let tenant;

    if (tenantDomain) {
      tenant = await prisma.tenant.findUnique({
        where: { domain: tenantDomain }
      });
    } else {
      tenant = await prisma.tenant.findUnique({
        where: { slug: tenantSlug }
      });
    }

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    if (tenant.status === 'SUSPENDED') {
      return res.status(403).json({ error: 'Tenant account is suspended' });
    }

    if (tenant.status === 'DELETED' || tenant.deletedAt) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    req.tenant = tenant;
    next();
  } catch (error) {
    logger.error('Tenant resolution error', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = resolveTenant;
