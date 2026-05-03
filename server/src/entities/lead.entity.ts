import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Tenant } from './tenant.entity';
import { User } from './user.entity';

@Entity('leads')
export class Lead {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column()
  email: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  company: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'enum', enum: ['new', 'contacted', 'qualified', 'lost', 'converted'], default: 'new' })
  status: 'new' | 'contacted' | 'qualified' | 'lost' | 'converted';

  @ManyToOne(() => Tenant, tenant => tenant.leads)
  tenant: Tenant;

  @Column()
  tenantId: string;

  @ManyToOne(() => User, user => user.leads, { nullable: true })
  assignedTo: User;

  @Column({ nullable: true })
  assignedToId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
