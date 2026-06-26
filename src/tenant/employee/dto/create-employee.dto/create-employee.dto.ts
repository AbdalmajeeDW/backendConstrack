import { Type } from 'class-transformer';
import { IsEmail, IsOptional, IsString, MinLength, IsEnum, IsBoolean, IsDateString, Min, IsNumber } from 'class-validator';

export class CreateEmployeeDto {
  @IsString()
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;

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
}