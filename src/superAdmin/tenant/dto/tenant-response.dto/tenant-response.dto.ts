export class TenantResponseDto {
  id!: string;
  name!: string;
  address?: string;
  phone?: string;
  adminName!: string;
  adminEmail!: string;
  databaseName!: string;
  subscriptionStartDate!: Date;
  subscriptionEndDate!: Date;
  discount!: number;
  industry?: string;
  maxEmployees!: number;
  kvkNumber?: string;
  btwNumber?: string;
  status!: string;
  createdAt!: Date;
  updatedAt!: Date;
}
