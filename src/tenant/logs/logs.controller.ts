// src/modules/tenant-logs/tenant-logs.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  Req,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import type { Request } from 'express';
import { TenantLogsService } from './logs.service';
import { TenantJwtAuthGuard } from '../auth/tenant-jwt-auth.guard'; // ✅ استخدم هذا

@Controller('tenant/logs')
@UseGuards(TenantJwtAuthGuard) // ✅ استخدم Guard التينانت فقط
export class TenantLogsController {
  constructor(private readonly logsService: TenantLogsService) {}

  @Post('log')
  async logActivity(
    @Body()
    body: {
      employeeId: number;
      action: 'login' | 'logout' | 'update_task' | 'upload_invoice';
      details?: string;
    },
    @Req() req: any,
  ) {
    const tenantId =
      req.user?.tenantId?.toString() || req['tenantId']?.toString();

    if (!tenantId) {
      throw new BadRequestException('Tenant ID is required');
    }

    return this.logsService.logActivity(tenantId, {
      employeeId: body.employeeId,
      action: body.action,
      details: body.details,
      ipAddress: req.ip || req.socket.remoteAddress,
      userAgent: req.headers['user-agent'],
    });
  }

  @Get('activities')
  async getActivities(
    @Req() req: any,
    @Query('employeeId') employeeId?: number,
    @Query('action') action?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const tenantId =
      req.user?.tenantId?.toString() || req['tenantId']?.toString();

    if (!tenantId) {
      throw new BadRequestException('Tenant ID is required');
    }

  

    return this.logsService.getActivities(tenantId, {
      employeeId,
      action,
      startDate,
      endDate,
      page: page || 1,
      limit: limit || 20,
    });
  }

  @Get('stats')
  async getStats(@Req() req: any) {
    const tenantId =
      req.user?.tenantId?.toString() || req['tenantId']?.toString();

    if (!tenantId) {
      throw new BadRequestException('Tenant ID is required');
    }

    return this.logsService.getStats(tenantId);
  }

  @Get('employee/:employeeId')
  async getEmployeeActivities(
    @Param('employeeId') employeeId: number,
    @Req() req: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const tenantId =
      req.user?.tenantId?.toString() || req['tenantId']?.toString();

    if (!tenantId) {
      throw new BadRequestException('Tenant ID is required');
    }

    if (!employeeId) {
      throw new BadRequestException('Employee ID is required');
    }


    return this.logsService.getEmployeeActivities(
      tenantId,
      employeeId,
      page || 1,
      limit || 20,
    );
  }
}
