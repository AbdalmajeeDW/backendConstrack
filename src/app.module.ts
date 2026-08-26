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
import { ConfigModule } from '@nestjs/config';
import { ProjectsModule } from './tenant/projects/projects.module';
import { InvoicesModule } from './tenant/invoices/invoice.module';
@Module({
  imports: [
    ConfigModule.forRoot({
  isGlobal: true,
}),
    TypeOrmModule.forRoot({
 type: 'mysql',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
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
    ProjectsModule,
    InvoicesModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
