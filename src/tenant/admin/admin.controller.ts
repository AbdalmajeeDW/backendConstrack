import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { CreateAdminDto } from './dto/create-admin.dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto/update-admin.dto';
import { TenantJwtAuthGuard } from '../auth/tenant-jwt-auth.guard';
import { TenantAdminGuard } from '../auth/tenant-admin.guard';

@Controller('tenant/admins')
@UseGuards(TenantJwtAuthGuard, TenantAdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get()
  async findAll(@Request() req: any) {
    return this.adminService.findAll(req.user.tenantId);
  }

  @Get(':id')
  async findOne(@Request() req: any, @Param('id') id: string) {
    return this.adminService.findOne(req.user.tenantId, parseInt(id));
  }

  @Post()
  async create(@Request() req: any, @Body() createAdminDto: CreateAdminDto) {
    return this.adminService.create(req.user.tenantId, createAdminDto);
  }

  @Patch(':id')
  async update(
    @Request() req: any,
    @Param('id') id: string,
    @Body() updateAdminDto: UpdateAdminDto,
  ) {
    return this.adminService.update(
      req.user.tenantId,
      parseInt(id),
      updateAdminDto,
    );
  }

  @Patch(':id/deactivate')
  async deactivate(@Request() req: any, @Param('id') id: string) {
    return this.adminService.deactivate(req.user.tenantId, parseInt(id));
  }

  @Patch(':id/activate')
  async activate(@Request() req: any, @Param('id') id: string) {
    return this.adminService.activate(req.user.tenantId, parseInt(id));
  }

  @Delete(':id')
  async delete(@Request() req: any, @Param('id') id: string) {
    return this.adminService.delete(req.user.tenantId, parseInt(id));
  }
}
