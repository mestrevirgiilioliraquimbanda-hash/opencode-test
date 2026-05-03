const express = require('express');
const subscriptionService = require('./subscription.service');
const { authenticate, authorize } = require('../../middleware/auth');
const validate = require('../../middleware/validate');
const { z } = require('zod');
const logger = require('../../config/logger');

const router = express.Router();

const checkoutSchema = z.object({
  body: z.object({
    plan: z.enum(['BASIC', 'PRO', 'ENTERPRISE']),
    successUrl: z.string().url(),
    cancelUrl: z.string().url()
  })
});

const billingPortalSchema = z.object({
  body: z.object({
    returnUrl: z.string().url()
  })
});

router.get('/',
  authenticate,
  async (req, res, next) => {
    try {
      const subscription = await subscriptionService.getSubscription(req.user.tenantId);

      if (!subscription) {
        return res.status(404).json({ error: 'No subscription found' });
      }

      res.json(subscription);
    } catch (error) {
      logger.error('Get subscription error', { error: error.message });
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

router.post('/checkout',
  authenticate,
  authorize('OWNER', 'ADMIN'),
  validate(checkoutSchema),
  async (req, res, next) => {
    try {
      const { plan, successUrl, cancelUrl } = req.body;

      const result = await subscriptionService.createCheckoutSession(
        req.user.tenantId,
        plan,
        successUrl,
        cancelUrl
      );

      res.json(result);
    } catch (error) {
      logger.error('Create checkout session error', { error: error.message });
      res.status(400).json({ error: error.message });
    }
  }
);

router.post('/billing-portal',
  authenticate,
  authorize('OWNER', 'ADMIN'),
  validate(billingPortalSchema),
  async (req, res, next) => {
    try {
      const result = await subscriptionService.createBillingPortalSession(
        req.user.tenantId,
        req.body.returnUrl
      );

      res.json(result);
    } catch (error) {
      logger.error('Create billing portal error', { error: error.message });
      res.status(400).json({ error: error.message });
    }
  }
);

router.post('/cancel',
  authenticate,
  authorize('OWNER', 'ADMIN'),
  async (req, res, next) => {
    try {
      const result = await subscriptionService.cancelSubscription(req.user.tenantId);
      res.json({ message: 'Subscription will be canceled at the end of the billing period', result });
    } catch (error) {
      logger.error('Cancel subscription error', { error: error.message });
      res.status(400).json({ error: error.message });
    }
  }
);

router.post('/webhook',
  express.raw({ type: 'application/json' }),
  async (req, res, next) => {
    try {
      const signature = req.headers['stripe-signature'];

      if (!signature) {
        return res.status(400).json({ error: 'No Stripe signature found' });
      }

      await subscriptionService.handleWebhookEvent(req.body, signature);

      res.json({ received: true });
    } catch (error) {
      logger.error('Stripe webhook error', { error: error.message });
      res.status(400).json({ error: error.message });
    }
  }
);

module.exports = router;
