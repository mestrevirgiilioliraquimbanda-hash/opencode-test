import { Controller, Get, Post, Body, UseGuards, Request, Param } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('profile')
  async getProfile(@Request() req) {
    return this.usersService.findById(req.user.userId);
  }

  @Post()
  @Roles('admin')
  async create(@Body() createUserDto: CreateUserDto, @Request() req) {
    createUserDto.tenantId = req.user.tenantId;
    return this.usersService.create(createUserDto);
  }

  @Get()
  @Roles('admin')
  async findAll(@Request() req) {
    return this.usersService.findByTenant(req.user.tenantId);
  }
}
