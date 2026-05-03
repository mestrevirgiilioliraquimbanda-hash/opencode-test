import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { Tenant } from '../entities/tenant.entity';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private usersRepository: Repository<User>,
    @InjectRepository(Tenant) private tenantsRepository: Repository<Tenant>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const tenant = await this.tenantsRepository.findOne({ where: { id: createUserDto.tenantId } });
    if (!tenant) throw new NotFoundException('Tenant not found');
    const user = this.usersRepository.create({ ...createUserDto, tenant });
    return this.usersRepository.save(user);
  }

  async findByEmail(email: string): Promise<User> {
    return this.usersRepository.findOne({ where: { email }, relations: ['tenant'] });
  }

  async findById(id: string): Promise<User> {
    return this.usersRepository.findOne({ where: { id }, relations: ['tenant'] });
  }

  async findByTenant(tenantId: string): Promise<User[]> {
    return this.usersRepository.find({ where: { tenantId } });
  }
}
