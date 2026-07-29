// tasks.controller.ts
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
  ParseIntPipe,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { AssignEmployeesDto } from './dto/assign-employees.dto';
import { TenantJwtAuthGuard } from '../auth/tenant-jwt-auth.guard';
import { FilesInterceptor } from '@nestjs/platform-express';
import { extname } from 'path/win32';
import { diskStorage } from 'multer';

@Controller('tenant/tasks')
@UseGuards(TenantJwtAuthGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @UseInterceptors(
    FilesInterceptor('images', 20, {
      storage: diskStorage({
        destination: './uploads/temp',
        filename: (req, file, callback) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          callback(null, `${uniqueSuffix}${ext}`);
        },
      }),
      limits: {
        fileSize: 5 * 1024 * 1024,
        files: 20,
      },
      fileFilter: (req, file, callback) => {
        if (!file.mimetype.startsWith('image/')) {
          return callback(new Error('Only images are allowed'), false);
        }
        callback(null, true);
      },
    }),
  )
  create(
    @Request() req: any,
    @Body() dto: CreateTaskDto,
    @UploadedFiles() files?: Express.Multer.File[], // ✅ إضافة الملفات
  ) {
    return this.tasksService.createTask(req.user.tenantId, dto, files);
  }

  @Get()
  findAll(@Request() req: any) {
    return this.tasksService.getAllTasks(req.user.tenantId);
  }

  @Get('employee/:employeeId')
  getByEmployee(
    @Request() req: any,
    @Param('employeeId', ParseIntPipe) employeeId: number,
  ) {
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

  // tasks.controller.ts

  @Patch(':id')
  @UseInterceptors(
    FilesInterceptor('images', 20, {
      storage: diskStorage({
        destination: './uploads/temp',
        filename: (req, file, callback) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);

          const ext = extname(file.originalname);

          callback(null, `${uniqueSuffix}${ext}`);
        },
      }),
    }),
  )
  async update(
    @Request() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: any,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
  

    return this.tasksService.updateTask(req.user.tenantId, id, body, files);
  }

  @Delete(':id')
  delete(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.tasksService.deleteTask(req.user.tenantName, id);
  }

  @Post(':id/assign-employees')
  assignEmployees(
    @Request() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AssignEmployeesDto,
  ) {
    return this.tasksService.assignEmployeesToTask(
      req.user.tenantName,
      id,
      dto,
    );
  }

  @Delete(':id/employees/:employeeId')
  removeEmployee(
    @Request() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Param('employeeId', ParseIntPipe) employeeId: number,
  ) {
    return this.tasksService.removeEmployeeFromTask(
      req.user.tenantName,
      id,
      employeeId,
    );
  }
}
