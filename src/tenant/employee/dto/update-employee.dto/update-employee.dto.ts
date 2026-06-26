import { Type } from 'class-transformer';
import { IsBoolean, IsDateString, IsEmail, IsEnum, IsNumber, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class UpdateEmployeeDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEnum(['admin', 'employee'])
  role?: 'admin' | 'employee';

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  salary?: number;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsDateString()
  birth_date?: string;

  @IsOptional()
  @IsBoolean()
  driving_license?: boolean;

  @IsOptional()
  @IsString()
  specialization?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}