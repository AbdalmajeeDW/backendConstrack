// dto/check-company.dto.ts

import { IsString, IsNotEmpty, MinLength } from 'class-validator';

export class CheckCompanyDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  tenantName!: string;
}