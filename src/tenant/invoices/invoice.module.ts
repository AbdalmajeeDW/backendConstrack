// tenant/invoices/invoices.module.ts
import { Module } from '@nestjs/common';
import { InvoicesController } from './invoice.controller';
import { InvoicesService } from './invoice.service';
import { TenantModule } from '../../superAdmin/tenant/tenant.module';
import { TenantLogsModule } from '../logs/logs.module';

@Module({
  imports: [TenantModule,TenantLogsModule], 
  controllers: [InvoicesController],
  providers: [InvoicesService],
  exports: [InvoicesService],
})
export class InvoicesModule {}