import {
  IsString,
  IsEmail,
  IsOptional,
  IsNumber,
  Min,
  Max,
  IsDateString,
  IsDecimal,
} from 'class-validator';

export class UpdateTenantDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  adminName?: string;
  @IsString()
  status!: string;
  @IsOptional()
  @IsString()
  adminPassword?: string;
  @IsString()
  plan!: string;
  @IsOptional()
  @IsEmail()
  adminEmail?: string;

  @IsOptional()
  @IsDateString()
  subscriptionStartDate?: string;

  @IsOptional()
  @IsDateString()
  subscriptionEndDate?: string;

  @IsOptional()
  @IsNumber()
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
