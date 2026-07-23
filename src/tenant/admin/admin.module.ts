import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { TenantModule } from '../../superAdmin/tenant/tenant.module';

@Module({
  imports: [TenantModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
