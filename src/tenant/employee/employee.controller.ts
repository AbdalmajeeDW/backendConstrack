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
import { EmployeeService } from './employee.service';
import { CreateEmployeeDto } from './dto/create-employee.dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto/update-employee.dto';
import { TenantJwtAuthGuard } from '../auth/tenant-jwt-auth.guard';

@Controller('tenant/employees')
@UseGuards(TenantJwtAuthGuard)
export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService) {}
  @UseGuards(TenantJwtAuthGuard)
  @Get()
  async findAll(@Request() req: any) {
    return this.employeeService.findAll(req.user.tenantId);
  }

  @Get(':id')
  async findOne(@Request() req: any, @Param('id') id: string) {
    return this.employeeService.findOne(req.user.tenantId, parseInt(id));
  }

  @Post()
  async create(
    @Request() req: any,
    @Body() createEmployeeDto: CreateEmployeeDto,
  ) {
    return this.employeeService.create(req.user.tenantId, createEmployeeDto);
  }

  @Patch(':id')
  async update(
    @Request() req: any,
    @Param('id') id: string,
    @Body() updateEmployeeDto: UpdateEmployeeDto,
  ) {
    return this.employeeService.update(
      req.user.tenantId,
      parseInt(id),
      updateEmployeeDto,
    );
  }

  @Patch(':id/deactivate')
  async deactivate(@Request() req: any, @Param('id') id: string) {
    return this.employeeService.deactivate(req.user.tenantId, parseInt(id));
  }

  @Patch(':id/activate')
  async activate(@Request() req: any, @Param('id') id: string) {
    return this.employeeService.activate(req.user.tenantId, parseInt(id));
  }

  @Delete(':id')
  async delete(@Request() req: any, @Param('id') id: string) {
    return this.employeeService.delete(req.user.tenantId, parseInt(id));
  }
}
