// tasks.module.ts
import { Module } from '@nestjs/common';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { TenantModule } from 'src/superAdmin/tenant/tenant.module';
import { TenantLogsModule } from '../logs/logs.module';

@Module({
  imports: [TenantModule,TenantLogsModule],
  controllers: [TasksController],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksModule {}
