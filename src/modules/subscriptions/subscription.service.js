const Stripe = require('stripe');
const config = require('../../config');
const prisma = require('../../config/database');
const logger = require('../../config/logger');

const stripe = config.stripe.secretKey ? new Stripe(config.stripe.secretKey) : null;

const PLAN_PRICES = {
  FREE: 0,
  BASIC: 999,
  PRO: 2999,
  ENTERPRISE: 9999
};

const PLAN_PRICE_IDS = {
  BASIC: process.env.STRIPE_PRICE_BASIC,
  PRO: process.env.STRIPE_PRICE_PRO,
  ENTERPRISE: process.env.STRIPE_PRICE_ENTERPRISE
};

async function getSubscription(tenantId) {
  const subscription = await prisma.subscription.findFirst({
    where: { tenantId }
  });

  return subscription;
}

async function createCheckoutSession(tenantId, plan, successUrl, cancelUrl) {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }

  const subscription = await prisma.subscription.findFirst({
    where: { tenantId },
    include: { tenant: true }
  });

  if (!subscription) {
    throw new Error('Subscription not found');
  }

  if (!subscription.stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: subscription.tenant.email || 'billing@' + subscription.tenant.slug + '.com',
      metadata: { tenantId: subscription.tenantId }
    });

    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { stripeCustomerId: customer.id }
    });

    subscription.stripeCustomerId = customer.id;
  }

  const priceId = PLAN_PRICE_IDS[plan.toUpperCase()];

  if (!priceId) {
    throw new Error('Invalid plan or price not configured');
  }

  const session = await stripe.checkout.sessions.create({
    customer: subscription.stripeCustomerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: { tenantId: subscription.tenantId, plan: plan.toUpperCase() }
  });

  return { url: session.url, sessionId: session.id };
}

async function createBillingPortalSession(tenantId, returnUrl) {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }

  const subscription = await prisma.subscription.findFirst({
    where: { tenantId }
  });

  if (!subscription || !subscription.stripeCustomerId) {
    throw new Error('No billing customer found');
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: subscription.stripeCustomerId,
    return_url: returnUrl
  });

  return { url: session.url };
}

async function cancelSubscription(tenantId) {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }

  const subscription = await prisma.subscription.findFirst({
    where: { tenantId, stripeSubscriptionId: { not: null } }
  });

  if (!subscription) {
    throw new Error('No active subscription found');
  }

  await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
    cancel_at_period_end: true
  });

  const updated = await prisma.subscription.update({
    where: { id: subscription.id },
    data: { cancelAtPeriodEnd: true }
  });

  return updated;
}

async function handleWebhookEvent(payload, signature) {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }

  const event = stripe.webhooks.constructEvent(
    payload,
    signature,
    config.stripe.webhookSecret
  );

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const { tenantId, plan } = session.metadata;

      const subscription = await stripe.subscriptions.retrieve(session.subscription);

      await prisma.subscription.update({
        where: { tenantId },
        data: {
          stripeSubscriptionId: subscription.id,
          plan: plan,
          status: subscription.status.toUpperCase(),
          currentPeriodStart: new Date(subscription.current_period_start * 1000),
          currentPeriodEnd: new Date(subscription.current_period_end * 1000)
        }
      });
      break;
    }

    case 'customer.subscription.updated': {
      const stripeSub = event.data.object;
      const subscription = await prisma.subscription.findFirst({
        where: { stripeSubscriptionId: stripeSub.id }
      });

      if (subscription) {
        await prisma.subscription.update({
          where: { id: subscription.id },
          data: {
            status: stripeSub.status.toUpperCase(),
            currentPeriodStart: new Date(stripeSub.current_period_start * 1000),
            currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
            cancelAtPeriodEnd: stripeSub.cancel_at_period_end
          }
        });
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const stripeSub = event.data.object;
      const subscription = await prisma.subscription.findFirst({
        where: { stripeSubscriptionId: stripeSub.id }
      });

      if (subscription) {
        await prisma.subscription.update({
          where: { id: subscription.id },
          data: {
            status: 'CANCELED',
            stripeSubscriptionId: null
          }
        });
      }
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object;
      const subscription = await prisma.subscription.findFirst({
        where: { stripeCustomerId: invoice.customer }
      });

      if (subscription) {
        await prisma.subscription.update({
          where: { id: subscription.id },
          data: { status: 'PAST_DUE' }
        });
      }
      break;
    }

    default:
      logger.info('Unhandled Stripe event', { type: event.type });
  }

  return { received: true };
}

module.exports = {
  getSubscription,
  createCheckoutSession,
  createBillingPortalSession,
  cancelSubscription,
  handleWebhookEvent
};
