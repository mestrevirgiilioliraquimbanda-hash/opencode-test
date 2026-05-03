import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StripeService } from './stripe.service';
import { StripeController } from './stripe.controller';
import { Subscription } from '../entities/subscription.entity';
import { Tenant } from '../entities/tenant.entity';

@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([Subscription, Tenant])],
  providers: [StripeService],
  controllers: [StripeController],
  exports: [StripeService],
})
export class StripeModule {}
