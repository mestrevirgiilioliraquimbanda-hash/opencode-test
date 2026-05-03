import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { Tenant } from './tenant.entity';

@Entity('subscriptions')
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Tenant, tenant => tenant.subscriptions)
  tenant: Tenant;

  @Column()
  tenantId: string;

  @Column()
  stripeCustomerId: string;

  @Column()
  stripeSubscriptionId: string;

  @Column({ type: 'enum', enum: ['free', 'basic', 'premium'], default: 'free' })
  plan: 'free' | 'basic' | 'premium';

  @Column({ type: 'enum', enum: ['active', 'canceled', 'past_due'], default: 'active' })
  status: 'active' | 'canceled' | 'past_due';

  @Column({ type: 'timestamp', nullable: true })
  currentPeriodEnd: Date;

  @CreateDateColumn()
  createdAt: Date;
}
