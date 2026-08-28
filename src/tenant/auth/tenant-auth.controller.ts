import { Controller, Post, Body, UseGuards, Request, Get, Query } from '@nestjs/common';
import { TenantAuthService } from './tenant-auth.service';
import { TenantLoginDto } from './dto/tenant-login.dto';
import { TenantRegisterDto } from './dto/tenant-register.dto';
import { TenantRefreshTokenDto } from './dto/tenant-refresh-token.dto';
import { TenantJwtAuthGuard } from './tenant-jwt-auth.guard';
import { CheckCompanyDto } from './dto/check-company.dto';

@Controller('tenant/auth')
export class TenantAuthController {
  constructor(private readonly tenantAuthService: TenantAuthService) {}

  @Post('register')
  async register(@Body() tenantRegisterDto: TenantRegisterDto) {
    return this.tenantAuthService.register(
      tenantRegisterDto,
      tenantRegisterDto.tenantName,
    );
  }

  @Post('login')
  async login(@Body() tenantLoginDto: TenantLoginDto, @Request() req: any) {
    return this.tenantAuthService.login(tenantLoginDto, req);
  }

  @Post('refresh')
  async refresh(@Body() tenantRefreshTokenDto: TenantRefreshTokenDto) {
    return this.tenantAuthService.refreshToken(tenantRefreshTokenDto);
  }

  @Post('logout')
  @UseGuards(TenantJwtAuthGuard)
  async logout(@Request() req: any) {
    return this.tenantAuthService.logout(req.user.tenantId, req.user.id);
  }
    @Get('check-company')
  async checkCompany(@Query() checkCompanyDto: CheckCompanyDto) {
    return this.tenantAuthService.checkCompanyExists(checkCompanyDto.tenantName);
  }
  @Post('check-company')
  async checkCompanyPost(@Body() checkCompanyDto: CheckCompanyDto) {
    return this.tenantAuthService.checkCompanyExists(checkCompanyDto.tenantName);
  }
}
