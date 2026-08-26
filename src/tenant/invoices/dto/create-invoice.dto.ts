// tenant/invoices/dto/create-invoice.dto.ts
import {
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  IsEnum,
  IsDateString,
  Min,
} from 'class-validator';
import { InvoiceStatus } from '../entity/invoice.entity';

export class CreateInvoiceDto {
  @IsNumber()
  employee_id!: number;

  // ❌ إزالة التحقق من images لأنها ستأتي من الملفات
  // @IsArray()
  // @IsString({ each: true })
  // images: string[];

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(InvoiceStatus)
  status?: InvoiceStatus;





  @IsOptional()
  @IsDateString()
  invoice_date?: string;
}