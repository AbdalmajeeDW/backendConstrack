// src/app.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TenantModule } from './superAdmin/tenant/tenant.module';
import { UserModule } from './superAdmin/user/user.module';
import { AuthModule } from './superAdmin/auth/auth.module';
import { TenantAuthModule } from './tenant/auth/tenant-auth.module';
import { EmployeeModule } from './tenant/employee/employee.module';
import { AdminModule } from './tenant/admin/admin.module';
import { TasksModule } from './tenant/tasks/tasks.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: '',
      database: 'constrack_master',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true,
      name: 'master',
    }),
    TenantModule,
    TasksModule,
    UserModule,
    AuthModule,
    TenantAuthModule,
    EmployeeModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
