import { Controller, Get, Post, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { TenantService } from './tenant.service';
import { CreateTenantDto } from './dto/create-tenant.dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto/update-tenant.dto';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard';

@Controller('super/tenants')
@UseGuards(JwtAuthGuard)
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Get()
  async findAll() {
    return this.tenantService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.tenantService.findOne(id);
  }

  @Post()
  async create(@Body() createTenantDto: CreateTenantDto) {
    return this.tenantService.create(createTenantDto);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateTenantDto: UpdateTenantDto) {
    return this.tenantService.update(id, updateTenantDto);
  }

  @Patch(':id/deactivate')
  async deactivate(@Param('id') id: string) {
    return this.tenantService.deactivate(id);
  }

  @Patch(':id/activate')
  async activate(@Param('id') id: string) {
    return this.tenantService.activate(id);
  }
}

