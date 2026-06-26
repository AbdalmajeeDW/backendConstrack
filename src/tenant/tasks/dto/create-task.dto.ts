import { IsString, IsOptional, IsEnum, IsArray, IsNumber, IsDecimal, IsDateString, IsIn } from 'class-validator';

export class CreateTaskDto {
  @IsString()
  taskName!: string;

  @IsString()
  projectName!: string;

  @IsOptional()
  @IsString()
  taskDescription?: string;

  @IsDateString()
  startWork!: string;

  @IsDateString()
  endWork!: string;

  @IsOptional()
  @IsEnum(['low', 'medium', 'high', 'urgent'])
  priority?: 'low' | 'medium' | 'high' | 'urgent';

  @IsOptional()
  @IsEnum(['todo', 'in_progress', 'review', 'done'])
  status?: 'todo' | 'in_progress' | 'review' | 'done';

  @IsOptional()
  @IsArray()
  employeeIds?: number[];

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  postal_code?: string;

  @IsOptional()
  @IsString()
  house_number?: string;

  @IsOptional()
  @IsString()
  worker_arrival_time?: string;

  @IsOptional()
  @IsString()
  task_type?: string;

  @IsOptional()
  @IsNumber()
  work_area?: number;

  @IsOptional()
  @IsString()
  bus_number?: string;

  @IsOptional()
  @IsString()
  driver_name?: string;
}