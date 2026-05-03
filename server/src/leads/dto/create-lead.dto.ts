import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';

export class CreateLeadDto {
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  company?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsEnum(['new', 'contacted', 'qualified', 'lost', 'converted'])
  status?: 'new' | 'contacted' | 'qualified' | 'lost' | 'converted';

  @IsOptional()
  @IsString()
  assignedToId?: string;
}
