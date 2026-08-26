// src/modules/tenant-logs/tenant-logs.module.ts
import { Module } from '@nestjs/common';
import { TenantLogsController } from './logs.controller';
import { TenantLogsService } from './logs.service';
import { TenantModule } from 'src/superAdmin/tenant/tenant.module';

@Module({
   imports: [TenantModule],
  controllers: [TenantLogsController],
  providers: [TenantLogsService],
  exports: [TenantLogsService],
})
export class TenantLogsModule {}