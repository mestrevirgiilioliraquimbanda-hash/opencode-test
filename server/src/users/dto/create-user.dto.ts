import { IsEmail, IsEnum, IsString, MinLength } from 'class-validator';
import { Tenant } from '../../entities/tenant.entity';

export class CreateUserDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsEnum(['admin', 'user'])
  role: 'admin' | 'user';

  tenant: Tenant;
  tenantId: string;
}
