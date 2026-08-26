import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantAuthController } from './tenant-auth.controller';
import { TenantAuthService } from './tenant-auth.service';
import { TenantAccessTokenStrategy } from './strategies/tenant-access-token.strategy';
import { TenantRefreshTokenStrategy } from './strategies/tenant-refresh-token.strategy';
import { TenantJwtAuthGuard } from './tenant-jwt-auth.guard';
import { TenantModule } from '../../superAdmin/tenant/tenant.module';
import { TenantLogsModule } from '../logs/logs.module';

@Module({
  imports: [PassportModule, JwtModule.register({}), TenantModule,TenantLogsModule],
  controllers: [TenantAuthController],
  providers: [
    TenantAuthService,
    TenantAccessTokenStrategy,
    TenantRefreshTokenStrategy,
    TenantJwtAuthGuard,
  ],
})
export class TenantAuthModule {}
