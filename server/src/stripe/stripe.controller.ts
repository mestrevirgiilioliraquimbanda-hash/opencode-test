import { Controller, Post, Body, Headers, RawBody, UseGuards, Request } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('stripe')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StripeController {
  constructor(private stripeService: StripeService) {}

  @Post('create-checkout')
  @Roles('admin')
  async createCheckout(@Body() body: { priceId: string }, @Request() req) {
    const tenantId = req.user.tenantId;
    return { url: `https://checkout.stripe.com/pay/${body.priceId}?tenant=${tenantId}` };
  }

  @Post('webhook')
  async handleWebhook(@Body() body: any, @Headers('stripe-signature') signature: string) {
    await this.stripeService.handleWebhook({ type: 'customer.subscription.updated', data: { object: body } } as any);
    return { received: true };
  }
}
