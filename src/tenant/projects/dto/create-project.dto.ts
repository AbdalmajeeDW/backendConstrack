import { IsString, IsOptional, IsNumber, IsEnum } from 'class-validator';

export class CreateProjectDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  client_name?: string;

  @IsOptional()
  @IsString()
  client_phone?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  postal_code?: string;
 @IsOptional()
  @IsEnum(['planning', 'completed','cancelled'])
  status?: 'planning';

  @IsOptional()
  start_date?: string;

  @IsOptional()
  end_date?: string;
}
