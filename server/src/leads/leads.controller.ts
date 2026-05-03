import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { LeadsService } from './leads.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('leads')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LeadsController {
  constructor(private leadsService: LeadsService) {}

  @Get()
  async findAll(@Request() req) {
    return this.leadsService.findAll(req.user.tenantId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req) {
    return this.leadsService.findById(id, req.user.tenantId);
  }

  @Post()
  @Roles('admin', 'user')
  async create(@Body() createLeadDto: CreateLeadDto, @Request() req) {
    return this.leadsService.create(createLeadDto, req.user.tenantId);
  }

  @Patch(':id')
  @Roles('admin', 'user')
  async update(@Param('id') id: string, @Body() updateData: Partial<CreateLeadDto>, @Request() req) {
    return this.leadsService.update(id, updateData, req.user.tenantId);
  }

  @Delete(':id')
  @Roles('admin')
  async remove(@Param('id') id: string, @Request() req) {
    return this.leadsService.remove(id, req.user.tenantId);
  }
}
