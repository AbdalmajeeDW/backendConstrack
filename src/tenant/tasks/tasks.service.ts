// tasks.service.ts
import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { TenantService } from '../../superAdmin/tenant/tenant.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { AssignEmployeesDto } from './dto/assign-employees.dto';
import { Tasks } from './entity/tasks.entity';
import { Employee } from '../employee/employee.entity';
import * as path from 'path';
import * as fs from 'fs';
import { extname } from 'path';

@Injectable()
export class TasksService {
  constructor(
    @InjectDataSource('master')
    private readonly masterDataSource: DataSource,
    private readonly tenantService: TenantService,
  ) {}

  private async createTenantConnection(databaseName: string) {
    const options = this.masterDataSource.options as any;
    const tenantConnection = new DataSource({
      type: options.type,
      host: options.host,
      port: options.port,
      username: options.username,
      password: options.password,
      database: databaseName,
      entities: [Tasks, Employee],
      synchronize: false,
      logging: false,
      charset: 'utf8mb4',
       dateStrings: true,
    });
    await tenantConnection.initialize();
    return tenantConnection;
  }

  private async getTenantDatabaseName(tenantName: string) {
    const tenant = await this.tenantService.findByName(tenantName);

    if (tenant.status !== 'active') {
      throw new InternalServerErrorException('Tenant is inactive');
    }
    return tenant.databaseName;
  }

  async createTask(
    tenantId: string,
    createTaskDto: CreateTaskDto,
    files?: Express.Multer.File[],
  ) {
    const databaseName = await this.getTenantDatabaseNameById(tenantId);
    const tenantConnection = await this.createTenantConnection(databaseName);

    try {
      let imagePaths: string[] = [];
      if (files && files.length > 0) {
        imagePaths = await this.saveImages(databaseName, files);
      }

      const imagesJson =
        imagePaths.length > 0 ? JSON.stringify(imagePaths) : null;

      const result = await tenantConnection.query(
        `INSERT INTO tasks 
       (taskName, projectName, taskDescription, startWork, endWork, priority, status, 
        city, postal_code, house_number, worker_arrival_time, task_type, work_area, 
        bus_number, driver_name, images)  -- ✅ إضافة حقل images
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          createTaskDto.taskName,
          createTaskDto.projectName,
          createTaskDto.taskDescription || '',
          createTaskDto.startWork,
          createTaskDto.endWork,
          createTaskDto.priority || 'medium',
          createTaskDto.status || 'todo',
          createTaskDto.city || null,
          createTaskDto.postal_code || null,
          createTaskDto.house_number || null,
          createTaskDto.worker_arrival_time || null,
          createTaskDto.task_type || null,
          createTaskDto.work_area || null,
          createTaskDto.bus_number || null,
          createTaskDto.driver_name || null,
          imagesJson,
        ],
      );

      let taskId: number;
      if (result && result.insertId) {
        taskId = result.insertId;
      } else if (result && result[0] && result[0].insertId) {
        taskId = result[0].insertId;
      } else {
        const [lastIdResult] = await tenantConnection.query(
          `SELECT LAST_INSERT_ID() as id`,
        );
        taskId = lastIdResult.id;
      }

      if (
        createTaskDto.employeeIds &&
        Array.isArray(createTaskDto.employeeIds)
      ) {
        const employeeIds = createTaskDto.employeeIds
          .map((id) => Number(id))
          .filter((id) => Number.isInteger(id) && id > 0);

        for (const employeeId of employeeIds) {
          await tenantConnection.query(
            `
      INSERT INTO task_employees 
      (
        task_id,
        employee_id
      ) 
      VALUES (?, ?)
      `,
            [taskId, employeeId],
          );
        }
      }

      return {
        id: taskId,
        message: 'Task created successfully',
        images: imagePaths,
      };
    } finally {
      await tenantConnection.destroy();
    }
  }

  private async saveImages(
    databaseName: string,
    files: Express.Multer.File[],
  ): Promise<string[]> {
    const uploadDir = `./uploads/tenants/${databaseName}/tasks`;

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const savedPaths: string[] = [];

    for (const file of files) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const ext = extname(file.originalname);
      const fileName = `${uniqueSuffix}${ext}`;
      const filePath = path.join(uploadDir, fileName);

      if (file.path) {
        fs.renameSync(file.path, filePath);
      } else if (file.buffer) {
        fs.writeFileSync(filePath, file.buffer);
      }

      savedPaths.push(`/uploads/tenants/${databaseName}/tasks/${fileName}`);
    }

    return savedPaths;
  }
  private async getTenantDatabaseNameById(tenantId: string) {
    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }

    const tenant = await this.tenantService.findById(tenantId);
    if (!tenant) {
      throw new Error(`Tenant with ID ${tenantId} not found`);
    }
    if (tenant.status !== 'active') {
      throw new Error('Tenant is inactive');
    }
    return tenant.databaseName;
  }
  async getAllTasks(tenantId: string) {
    const databaseName = await this.getTenantDatabaseNameById(tenantId);
    const tenantConnection = await this.createTenantConnection(databaseName);

    try {
      const tasks = await tenantConnection.query(
        `SELECT * FROM tasks WHERE is_active = true ORDER BY created_at DESC`,
      );

      for (const task of tasks) {
      if (task.images) {
  if (typeof task.images === 'string') {
    try {
      task.images = JSON.parse(task.images);
    } catch {
      task.images = [];
    }
  }
} else {
  task.images = [];
}

        const employees = await tenantConnection.query(
          `SELECT e.id, e.name, e.email FROM employees e
         INNER JOIN task_employees te ON e.id = te.employee_id
         WHERE te.task_id = ?`,
          [task.id],
        );
        task.employees = employees;
      }

      return tasks;
    } finally {
      await tenantConnection.destroy();
    }
  }

  async getTasksByEmployee(tenantId: string, employeeId: number) {
    const databaseName = await this.getTenantDatabaseNameById(tenantId);
    const tenantConnection = await this.createTenantConnection(databaseName);

    try {
      const tasks = await tenantConnection.query(
        `SELECT t.*
         FROM tasks t
         INNER JOIN task_employees te ON t.id = te.task_id
         WHERE te.employee_id = ? AND t.is_active = true
         ORDER BY t.created_at DESC`,
        [employeeId],
      );

      return tasks;
    } finally {
      await tenantConnection.destroy();
    }
  }
  async getTaskById(tenantName: string, taskId: number) {
    const databaseName = await this.getTenantDatabaseName(tenantName);
    const tenantConnection = await this.createTenantConnection(databaseName);

    try {
      const [task] = await tenantConnection.query(
        `SELECT * FROM tasks WHERE id = ? AND is_active = true`,
        [taskId],
      );

      if (!task) {
        throw new NotFoundException('Task not found');
      }

      // ✅ تحويل JSON إلى مصفوفة
      if (task.images) {
        try {
          task.images = JSON.parse(task.images);
        } catch {
          task.images = [];
        }
      } else {
        task.images = [];
      }

      const employees = await tenantConnection.query(
        `SELECT e.id, e.name, e.email FROM employees e
       INNER JOIN task_employees te ON e.id = te.employee_id
       WHERE te.task_id = ?`,
        [taskId],
      );
      task.employees = employees;

      return task;
    } finally {
      await tenantConnection.destroy();
    }
  }

  async updateTask(
    tenantId: string,
    taskId: number,
    dto: UpdateTaskDto,
    files?: Express.Multer.File[],
  ) {
    const databaseName = await this.getTenantDatabaseNameById(tenantId);

    const connection = await this.createTenantConnection(databaseName);

    try {
      const queryRunner = connection.createQueryRunner();

      await queryRunner.connect();
      await queryRunner.startTransaction();

      const taskRepository = queryRunner.manager.getRepository(Tasks);

      const task = await taskRepository.findOne({
        where: {
          id: taskId,
          is_active: true,
        },
      });

      if (!task) {
        throw new NotFoundException('Task not found');
      }
console.log("START:", task?.startWork);
console.log("TYPE:", typeof task?.startWork);

console.log("END:", task?.endWork);
console.log("TYPE:", typeof task?.endWork);
      Object.assign(task, {
        taskName: dto.taskName ?? task.taskName,

        projectName: dto.projectName ?? task.projectName,

        taskDescription: dto.taskDescription ?? task.taskDescription,

        startWork: dto.startWork ?? task.startWork,

        endWork: dto.endWork ?? task.endWork,

        priority: dto.priority ?? task.priority,

        status: dto.status ?? task.status,

        city: dto.city ?? task.city,

        postal_code: dto.postal_code ?? task.postal_code,

        house_number: dto.house_number ?? task.house_number,

        worker_arrival_time:
          dto.worker_arrival_time ?? task.worker_arrival_time,

        task_type: dto.task_type ?? task.task_type,

        work_area:
          dto.work_area !== undefined ? Number(dto.work_area) : task.work_area,

        bus_number: dto.bus_number ?? task.bus_number,

        driver_name: dto.driver_name ?? task.driver_name,
      });

      if (files && files.length > 0) {
        const newImages = await this.saveImages(databaseName, files);

        task.images = [...(task.images || []), ...newImages];
      }

      await taskRepository.save(task);

      if (dto.employeeIds !== undefined) {
        await queryRunner.query(
          `
        DELETE FROM task_employees
        WHERE task_id = ?
        `,
          [taskId],
        );

        if (dto.employeeIds !== undefined) {
          await queryRunner.query(
            `
    DELETE FROM task_employees
    WHERE task_id = ?
    `,
            [taskId],
          );

          const employeeIds = (dto.employeeIds || [])
            .map((id) => Number(id))
            .filter((id) => Number.isInteger(id) && id > 0);

          for (const employeeId of employeeIds) {
            await queryRunner.query(
              `
      INSERT INTO task_employees
      (
        task_id,
        employee_id
      )
      VALUES (?,?)
      `,
              [taskId, employeeId],
            );
          }
        }
      }

      await queryRunner.commitTransaction();

      const updatedTask = await connection.getRepository(Tasks).findOne({
        where: {
          id: taskId,
        },
      });

      if (updatedTask && !updatedTask.images) {
        updatedTask.images = [];
      }

      const employees = await connection.query(
        `
      SELECT 
        e.id,
        e.name,
        e.email
      FROM employees e
      INNER JOIN task_employees te
      ON e.id = te.employee_id
      WHERE te.task_id = ?
      `,
        [taskId],
      );

      return {
        ...updatedTask,
        employees,
      };
    } catch (error) {
      throw error;
    } finally {
      await connection.destroy();
    }
  }
  async deleteTask(tenantName: string, taskId: number) {
    const databaseName = await this.getTenantDatabaseName(tenantName);
    const tenantConnection = await this.createTenantConnection(databaseName);

    try {
      const [result] = await tenantConnection.query(
        `UPDATE tasks SET is_active = false, updated_at = NOW() WHERE id = ? AND is_active = true`,
        [taskId],
      );

      if (result.affectedRows === 0) {
        throw new NotFoundException('Task not found');
      }

      return { message: 'Task deleted successfully' };
    } finally {
      await tenantConnection.destroy();
    }
  }

  async assignEmployeesToTask(
    tenantName: string,
    taskId: number,
    dto: AssignEmployeesDto,
  ) {
    const databaseName = await this.getTenantDatabaseName(tenantName);
    const tenantConnection = await this.createTenantConnection(databaseName);

    try {
      const [task] = await tenantConnection.query(
        `SELECT * FROM tasks WHERE id = ? AND is_active = true`,
        [taskId],
      );

      if (!task) {
        throw new NotFoundException('Task not found');
      }

      for (const employeeId of dto.employeeIds) {
        await tenantConnection.query(
          `INSERT IGNORE INTO task_employees (task_id, employee_id) VALUES (?, ?)`,
          [taskId, employeeId],
        );
      }

      const employees = await tenantConnection.query(
        `SELECT e.id, e.name, e.email FROM employees e
         INNER JOIN task_employees te ON e.id = te.employee_id
         WHERE te.task_id = ?`,
        [taskId],
      );

      return employees;
    } finally {
      await tenantConnection.destroy();
    }
  }

  async removeEmployeeFromTask(
    tenantName: string,
    taskId: number,
    employeeId: number,
  ) {
    const databaseName = await this.getTenantDatabaseName(tenantName);
    const tenantConnection = await this.createTenantConnection(databaseName);

    try {
      const [result] = await tenantConnection.query(
        `DELETE FROM task_employees WHERE task_id = ? AND employee_id = ?`,
        [taskId, employeeId],
      );

      if (result.affectedRows === 0) {
        throw new NotFoundException('Assignment not found');
      }

      return { message: 'Employee removed from task successfully' };
    } finally {
      await tenantConnection.destroy();
    }
  }

  async getTaskEmployees(tenantName: string, taskId: number) {
    const databaseName = await this.getTenantDatabaseName(tenantName);
    const tenantConnection = await this.createTenantConnection(databaseName);

    try {
      const employees = await tenantConnection.query(
        `SELECT e.id, e.name, e.email, e.phone, te.assigned_at
         FROM employees e
         INNER JOIN task_employees te ON e.id = te.employee_id
         WHERE te.task_id = ? AND e.is_active = true`,
        [taskId],
      );

      return employees;
    } finally {
      await tenantConnection.destroy();
    }
  }
}
