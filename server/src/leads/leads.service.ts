import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lead } from '../entities/lead.entity';
import { CreateLeadDto } from './dto/create-lead.dto';
import { User } from '../entities/user.entity';

@Injectable()
export class LeadsService {
  constructor(
    @InjectRepository(Lead) private leadsRepository: Repository<Lead>,
    @InjectRepository(User) private usersRepository: Repository<User>,
  ) {}

  async create(createLeadDto: CreateLeadDto, tenantId: string): Promise<Lead> {
    const lead = this.leadsRepository.create({ ...createLeadDto, tenantId });
    if (createLeadDto.assignedToId) {
      const user = await this.usersRepository.findOne({ where: { id: createLeadDto.assignedToId, tenantId } });
      if (user) lead.assignedTo = user;
    }
    return this.leadsRepository.save(lead);
  }

  async findAll(tenantId: string): Promise<Lead[]> {
    return this.leadsRepository.find({ where: { tenantId }, relations: ['assignedTo'] });
  }

  async findById(id: string, tenantId: string): Promise<Lead> {
    const lead = await this.leadsRepository.findOne({ where: { id, tenantId }, relations: ['assignedTo'] });
    if (!lead) throw new NotFoundException('Lead not found');
    return lead;
  }

  async update(id: string, updateData: Partial<Lead>, tenantId: string): Promise<Lead> {
    const lead = await this.findById(id, tenantId);
    Object.assign(lead, updateData);
    if (updateData.assignedToId) {
      const user = await this.usersRepository.findOne({ where: { id: updateData.assignedToId, tenantId } });
      if (user) lead.assignedTo = user;
    }
    return this.leadsRepository.save(lead);
  }

  async remove(id: string, tenantId: string): Promise<void> {
    const lead = await this.findById(id, tenantId);
    await this.leadsRepository.remove(lead);
  }
}
