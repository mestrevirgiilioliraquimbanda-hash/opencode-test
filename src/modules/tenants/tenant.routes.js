const express = require('express');
const tenantService = require('./tenant.service');
const { authenticate, authorize } = require('../../middleware/auth');
const validate = require('../../middleware/validate');
const { z } = require('zod');
const logger = require('../../config/logger');

const router = express.Router();

const createTenantSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100),
    slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
    domain: z.string().max(100).optional()
  })
});

const updateTenantSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100).optional(),
    domain: z.string().max(100).optional(),
    settings: z.record(z.unknown()).optional()
  })
});

router.post('/',
  authenticate,
  authorize('OWNER', 'ADMIN'),
  validate(createTenantSchema),
  async (req, res, next) => {
    try {
      const tenant = await tenantService.createTenant(req.body);
      res.status(201).json(tenant);
    } catch (error) {
      logger.error('Create tenant error', { error: error.message });
      res.status(400).json({ error: error.message });
    }
  }
);

router.get('/',
  authenticate,
  authorize('OWNER', 'ADMIN'),
  async (req, res, next) => {
    try {
      const { page, limit, status } = req.query;
      const result = await tenantService.listTenants({
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20,
        status
      });
      res.json(result);
    } catch (error) {
      logger.error('List tenants error', { error: error.message });
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

router.get('/:id',
  authenticate,
  async (req, res, next) => {
    try {
      const tenant = await tenantService.getTenantById(req.params.id);
      res.json(tenant);
    } catch (error) {
      if (error.message === 'Tenant not found') {
        return res.status(404).json({ error: error.message });
      }
      logger.error('Get tenant error', { error: error.message });
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

router.get('/slug/:slug',
  async (req, res, next) => {
    try {
      const tenant = await tenantService.getTenantBySlug(req.params.slug);
      res.json(tenant);
    } catch (error) {
      if (error.message === 'Tenant not found') {
        return res.status(404).json({ error: error.message });
      }
      logger.error('Get tenant by slug error', { error: error.message });
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

router.put('/:id',
  authenticate,
  authorize('OWNER', 'ADMIN'),
  validate(updateTenantSchema),
  async (req, res, next) => {
    try {
      const tenant = await tenantService.updateTenant(req.params.id, req.body);
      res.json(tenant);
    } catch (error) {
      logger.error('Update tenant error', { error: error.message });
      res.status(400).json({ error: error.message });
    }
  }
);

router.post('/:id/suspend',
  authenticate,
  authorize('OWNER', 'ADMIN'),
  async (req, res, next) => {
    try {
      const tenant = await tenantService.suspendTenant(req.params.id);
      res.json(tenant);
    } catch (error) {
      logger.error('Suspend tenant error', { error: error.message });
      res.status(400).json({ error: error.message });
    }
  }
);

router.post('/:id/activate',
  authenticate,
  authorize('OWNER', 'ADMIN'),
  async (req, res, next) => {
    try {
      const tenant = await tenantService.activateTenant(req.params.id);
      res.json(tenant);
    } catch (error) {
      logger.error('Activate tenant error', { error: error.message });
      res.status(400).json({ error: error.message });
    }
  }
);

router.delete('/:id',
  authenticate,
  authorize('OWNER'),
  async (req, res, next) => {
    try {
      const tenant = await tenantService.deleteTenant(req.params.id);
      res.json({ message: 'Tenant marked for deletion', tenant });
    } catch (error) {
      logger.error('Delete tenant error', { error: error.message });
      res.status(400).json({ error: error.message });
    }
  }
);

module.exports = router;
