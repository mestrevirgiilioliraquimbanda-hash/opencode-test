import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn } from 'typeorm';
import { User } from './user.entity';
import { Lead } from './lead.entity';
import { Subscription } from './subscription.entity';

@Entity('tenants')
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column()
  companyName: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => User, user => user.tenant)
  users: User[];

  @OneToMany(() => Lead, lead => lead.tenant)
  leads: Lead[];

  @OneToMany(() => Subscription, subscription => subscription.tenant)
  subscriptions: Subscription[];
}
