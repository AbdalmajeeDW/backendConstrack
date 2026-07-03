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
async createTask(tenantId: string, createTaskDto: CreateTaskDto) {
  const databaseName = await this.getTenantDatabaseNameById(tenantId);
  const tenantConnection = await this.createTenantConnection(databaseName);

  try {
    const result = await tenantConnection.query(
      `INSERT INTO tasks 
       (taskName, projectName, taskDescription, startWork, endWork, priority, status, 
        city, postal_code, house_number, worker_arrival_time, task_type, work_area, bus_number, driver_name)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
      ],
    );

    let taskId: number;
    if (result && result.insertId) {
      taskId = result.insertId;
    } else if (result && result[0] && result[0].insertId) {
      taskId = result[0].insertId;
    } else {
      const [lastIdResult] = await tenantConnection.query(`SELECT LAST_INSERT_ID() as id`);
      taskId = lastIdResult.id;
    }

    if (createTaskDto.employeeIds && createTaskDto.employeeIds.length > 0) {
      for (const employeeId of createTaskDto.employeeIds) {
        await tenantConnection.query(
          `INSERT INTO task_employees (task_id, employee_id) VALUES (?, ?)`,
          [taskId, employeeId],
        );
      }
    }

    return { id: taskId, message: 'Task created successfully' };
    
  } finally {
    await tenantConnection.destroy();
  }
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
    tenantName: string,
    taskId: number,
    updateTaskDto: UpdateTaskDto,
  ) {
    const databaseName = await this.getTenantDatabaseName(tenantName);
    const tenantConnection = await this.createTenantConnection(databaseName);

    try {
      const [existing] = await tenantConnection.query(
        `SELECT * FROM tasks WHERE id = ? AND is_active = true`,
        [taskId],
      );

      if (!existing) {
        throw new NotFoundException('Task not found');
      }

      const updates: string[] = [];
      const values: any[] = [];

      if (updateTaskDto.taskName) {
        updates.push('taskName = ?');
        values.push(updateTaskDto.taskName);
      }
      if (updateTaskDto.projectName) {
        updates.push('projectName = ?');
        values.push(updateTaskDto.projectName);
      }
      if (updateTaskDto.taskDescription !== undefined) {
        updates.push('taskDescription = ?');
        values.push(updateTaskDto.taskDescription);
      }
      if (updateTaskDto.startWork) {
        updates.push('startWork = ?');
        values.push(updateTaskDto.startWork);
      }
      if (updateTaskDto.endWork) {
        updates.push('endWork = ?');
        values.push(updateTaskDto.endWork);
      }
      if (updateTaskDto.priority) {
        updates.push('priority = ?');
        values.push(updateTaskDto.priority);
      }
      if (updateTaskDto.status) {
        updates.push('status = ?');
        values.push(updateTaskDto.status);
      }

      if (updates.length > 0) {
        values.push(taskId);
        await tenantConnection.query(
          `UPDATE tasks SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ?`,
          values,
        );
      }

      if (updateTaskDto.employeeIds) {
        await tenantConnection.query(
          `DELETE FROM task_employees WHERE task_id = ?`,
          [taskId],
        );
        for (const employeeId of updateTaskDto.employeeIds) {
          await tenantConnection.query(
            `INSERT INTO task_employees (task_id, employee_id) VALUES (?, ?)`,
            [taskId, employeeId],
          );
        }
      }

      const [updatedTask] = await tenantConnection.query(
        `SELECT * FROM tasks WHERE id = ?`,
        [taskId],
      );

      const employees = await tenantConnection.query(
        `SELECT e.id, e.name, e.email FROM employees e
         INNER JOIN task_employees te ON e.id = te.employee_id
         WHERE te.task_id = ?`,
        [taskId],
      );
      updatedTask.employees = employees;

      return updatedTask;
    } finally {
      await tenantConnection.destroy();
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
