// src/super-admin/tenants/dto/create-tenant.dto.ts
import { IsString, IsEmail, IsOptional, IsNumber, Min, Max, IsDateString, IsDecimal } from 'class-validator';

export class CreateTenantDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  phone?: string;


   @IsOptional()
  @IsString()
  databaseName!: string;
   @IsOptional()
  @IsString()
  plan!: string;
  @IsString()
  adminName!: string;

  @IsString()
  adminPassword!: string;
    @IsString()
  status!: string;

  @IsEmail()
  adminEmail!: string;

  @IsDateString()
  subscriptionStartDate!: Date;

  @IsDateString()
  subscriptionEndDate!: Date;

  @IsOptional()
  @IsDecimal()
  discount?: number;

  @IsOptional()
  @IsString()
  industry?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10000)
  maxEmployees?: number;

  @IsOptional()
  @IsString()
  kvkNumber?: string;

  @IsOptional()
  @IsString()
  btwNumber?: string;
}