// tasks.controller.ts
import { 
  Controller, Get, Post, Patch, Delete, Param, Body, 
  UseGuards, Request, ParseIntPipe 
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { AssignEmployeesDto } from './dto/assign-employees.dto';
import { TenantJwtAuthGuard } from '../auth/tenant-jwt-auth.guard';

@Controller('tenant/tasks')
@UseGuards(TenantJwtAuthGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  create(@Request() req: any, @Body() dto: CreateTaskDto) {
    return this.tasksService.createTask(req.user.tenantId, dto);
  }

  @Get()
  findAll(@Request() req: any) {

    return this.tasksService.getAllTasks(req.user.tenantId);
  }

  @Get('employee/:employeeId')
  getByEmployee(@Request() req: any, @Param('employeeId', ParseIntPipe) employeeId: number) {
    return this.tasksService.getTasksByEmployee(req.user.tenantId, employeeId);
  }

  @Get(':id')
  findOne(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    
    return this.tasksService.getTaskById(req.user.tenantName, id);
  }

  @Get(':id/employees')
  getEmployees(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.tasksService.getTaskEmployees(req.user.tenantName, id);
  }

  @Patch(':id')
  update(@Request() req: any, @Param('id', ParseIntPipe) id: number, @Body() dto: UpdateTaskDto) {
console.log(req.user);

    return this.tasksService.updateTask(req.user.tenantName, id, dto);
  }

  @Delete(':id')
  delete(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.tasksService.deleteTask(req.user.tenantName, id);
  }

  @Post(':id/assign-employees')
  assignEmployees(@Request() req: any, @Param('id', ParseIntPipe) id: number, @Body() dto: AssignEmployeesDto) {
    return this.tasksService.assignEmployeesToTask(req.user.tenantName, id, dto);
  }

  @Delete(':id/employees/:employeeId')
  removeEmployee(
    @Request() req: any, 
    @Param('id', ParseIntPipe) id: number, 
    @Param('employeeId', ParseIntPipe) employeeId: number
  ) {
    return this.tasksService.removeEmployeeFromTask(req.user.tenantName, id, employeeId);
  }
}