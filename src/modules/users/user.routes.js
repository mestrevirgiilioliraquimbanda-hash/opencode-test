const express = require('express');
const userService = require('./user.service');
const { authenticate, authorize } = require('../../middleware/auth');
const validate = require('../../middleware/validate');
const { z } = require('zod');
const logger = require('../../config/logger');

const router = express.Router();

const createUserSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8),
    firstName: z.string().max(50).optional(),
    lastName: z.string().max(50).optional(),
    role: z.enum(['OWNER', 'ADMIN', 'MEMBER']).optional()
  })
});

const updateUserSchema = z.object({
  body: z.object({
    firstName: z.string().max(50).optional(),
    lastName: z.string().max(50).optional(),
    avatar: z.string().url().optional(),
    role: z.enum(['OWNER', 'ADMIN', 'MEMBER']).optional()
  })
});

const updatePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string(),
    newPassword: z.string().min(8)
  })
});

router.get('/',
  authenticate,
  async (req, res, next) => {
    try {
      const { page, limit } = req.query;
      const result = await userService.getUsersByTenant(req.user.tenantId, {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20
      });
      res.json(result);
    } catch (error) {
      logger.error('List users error', { error: error.message });
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

router.get('/me',
  authenticate,
  async (req, res, next) => {
    try {
      const user = await userService.getUserById(req.user.id);
      res.json(user);
    } catch (error) {
      if (error.message === 'User not found') {
        return res.status(404).json({ error: error.message });
      }
      logger.error('Get current user error', { error: error.message });
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

router.put('/me',
  authenticate,
  validate(updateUserSchema),
  async (req, res, next) => {
    try {
      const user = await userService.updateUser(req.user.id, req.body);
      res.json(user);
    } catch (error) {
      logger.error('Update user error', { error: error.message });
      res.status(400).json({ error: error.message });
    }
  }
);

router.put('/me/password',
  authenticate,
  validate(updatePasswordSchema),
  async (req, res, next) => {
    try {
      await userService.updatePassword(req.user.id, req.body.currentPassword, req.body.newPassword);
      res.json({ message: 'Password updated successfully' });
    } catch (error) {
      if (error.message === 'Current password is incorrect') {
        return res.status(400).json({ error: error.message });
      }
      logger.error('Update password error', { error: error.message });
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

router.get('/:id',
  authenticate,
  async (req, res, next) => {
    try {
      const user = await userService.getUserById(req.params.id);

      if (user.tenantId !== req.user.tenantId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      res.json(user);
    } catch (error) {
      if (error.message === 'User not found') {
        return res.status(404).json({ error: error.message });
      }
      logger.error('Get user error', { error: error.message });
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

router.post('/',
  authenticate,
  authorize('OWNER', 'ADMIN'),
  validate(createUserSchema),
  async (req, res, next) => {
    try {
      const user = await userService.createUser({
        ...req.body,
        tenantId: req.user.tenantId
      });
      res.status(201).json(user);
    } catch (error) {
      logger.error('Create user error', { error: error.message });
      res.status(400).json({ error: error.message });
    }
  }
);

router.put('/:id',
  authenticate,
  authorize('OWNER', 'ADMIN'),
  validate(updateUserSchema),
  async (req, res, next) => {
    try {
      const user = await userService.getUserById(req.params.id);

      if (user.tenantId !== req.user.tenantId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const updatedUser = await userService.updateUser(req.params.id, req.body);
      res.json(updatedUser);
    } catch (error) {
      if (error.message === 'User not found') {
        return res.status(404).json({ error: error.message });
      }
      logger.error('Update user error', { error: error.message });
      res.status(400).json({ error: error.message });
    }
  }
);

router.delete('/:id',
  authenticate,
  authorize('OWNER', 'ADMIN'),
  async (req, res, next) => {
    try {
      const user = await userService.getUserById(req.params.id);

      if (user.tenantId !== req.user.tenantId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      if (user.role === 'OWNER') {
        return res.status(400).json({ error: 'Cannot deactivate the tenant owner' });
      }

      await userService.deactivateUser(req.params.id);
      res.json({ message: 'User deactivated successfully' });
    } catch (error) {
      logger.error('Deactivate user error', { error: error.message });
      res.status(400).json({ error: error.message });
    }
  }
);

module.exports = router;
