import { Module } from '@nestjs/common';
import { EmployeeController } from './employee.controller';
import { EmployeeService } from './employee.service';
import { TenantModule } from '../../superAdmin/tenant/tenant.module';

@Module({
  imports: [TenantModule],
  controllers: [EmployeeController],
  providers: [EmployeeService],
})
export class EmployeeModule {}