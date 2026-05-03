import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('tenants')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TenantsController {
  constructor(private tenantsService: TenantsService) {}

  @Get('profile')
  async getTenant(@Request() req) {
    return this.tenantsService.findById(req.user.tenantId);
  }

  @Post()
  @Roles('admin')
  async create(@Body() createTenantDto: CreateTenantDto) {
    return this.tenantsService.create(createTenantDto);
  }

  @Get()
  @Roles('admin')
  async findAll() {
    return this.tenantsService.findAll();
  }
}
