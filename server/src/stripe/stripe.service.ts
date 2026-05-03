import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscription } from '../entities/subscription.entity';
import { Tenant } from '../entities/tenant.entity';

@Injectable()
export class StripeService {
  private stripe: Stripe;

  constructor(
    private configService: ConfigService,
    @InjectRepository(Subscription) private subscriptionsRepository: Repository<Subscription>,
    @InjectRepository(Tenant) private tenantsRepository: Repository<Tenant>,
  ) {
    this.stripe = new Stripe(this.configService.get('STRIPE_SECRET_KEY') || '', { apiVersion: '2023-10-16' });
  }

  async createCustomer(tenant: Tenant): Promise<string> {
    const customer = await this.stripe.customers.create({ name: tenant.companyName, metadata: { tenantId: tenant.id } });
    return customer.id;
  }

  async createSubscription(customerId: string, priceId: string): Promise<Stripe.Subscription> {
    return await this.stripe.subscriptions.create({ customer: customerId, items: [{ price: priceId }], payment_behavior: 'default_incomplete', expand: ['latest_invoice.payment_intent'] });
  }

  async handleWebhook(event: Stripe.Event): Promise<void> {
    switch (event.type) {
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        const subscription = event.data.object as Stripe.Subscription;
        await this.updateSubscriptionStatus(subscription);
        break;
    }
  }

  private async updateSubscriptionStatus(stripeSubscription: Stripe.Subscription): Promise<void> {
    const subscription = await this.subscriptionsRepository.findOne({ where: { stripeSubscriptionId: stripeSubscription.id } });
    if (subscription) {
      subscription.status = stripeSubscription.status as 'active' | 'canceled' | 'past_due';
      subscription.currentPeriodEnd = new Date(stripeSubscription.current_period_end * 1000);
      await this.subscriptionsRepository.save(subscription);
    }
  }
}
