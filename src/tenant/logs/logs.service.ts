import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { TenantService } from '../../superAdmin/tenant/tenant.service';

@Injectable()
export class TenantLogsService {
  constructor(
    @InjectDataSource('master')
    private readonly dataSource: DataSource,
    private readonly tenantService: TenantService,
  ) {}

  private async createTenantConnection(databaseName: string) {
    const options = this.dataSource.options as any;
    const connection = new DataSource({
      type: options.type,
      host: options.host,
      port: options.port,
      username: options.username,
      password: options.password,
      database: databaseName,
      synchronize: false,
      logging: false,
      charset: 'utf8mb4',
      dateStrings: true,
    });
    await connection.initialize();
    return connection;
  }

  private async getTenantDatabaseName(tenantId: string): Promise<string> {
    const tenant = await this.tenantService.findById(tenantId);
    if (!tenant) {
      throw new Error('Tenant not found');
    }
    if (tenant.status !== 'active') {
      throw new Error('Tenant is inactive');
    }
    return tenant.databaseName;
  }

  async logActivity(
    tenantId: string,
    data: {
      employeeId: number;
      action: 'login' | 'logout' | 'update_task' | 'upload_invoice'|'view_invoices'|'view_tasks'|"upload_images_for_task";
      details?: string;
      ipAddress?: string;
      userAgent?: string;
       route?: string
    },
  ) {
    const databaseName = await this.getTenantDatabaseName(tenantId);
    const connection = await this.createTenantConnection(databaseName);

    try {
      await connection.query(
        `
        INSERT INTO system_logs
        (level, action, message, user_id, user_role, ip_address, user_agent, employee_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          'activity',
          data.action,
          data.details || data.action,
          data.employeeId.toString(),
          'employee',
          data.ipAddress || null,
          data.userAgent || null,
          data.employeeId, 
          data.route || 'unknown',
        ],
      );

      return { success: true, message: 'Activity logged successfully' };
    } catch (error) {
      console.error('❌ Failed to log activity:', error);
      throw new InternalServerErrorException('Failed to log activity');
    } finally {
      await connection.destroy();
    }
  }

  async getActivities(
    tenantId: string,
    filters: {
      employeeId?: number;
      action?: string;
      startDate?: string;
      endDate?: string;
      page?: number;
      limit?: number;
    },
  ) {
    const databaseName = await this.getTenantDatabaseName(tenantId);
    const connection = await this.createTenantConnection(databaseName);

    try {
      const { employeeId, action, startDate, endDate, page = 1, limit = 20 } = filters;

      let query = `
        SELECT 
          l.id,
          l.action,
          l.message,
          l.user_id,
          l.employee_id,
          l.ip_address,
          l.created_at,
          l.details,
          e.id as employee_id,
          e.name as employee_name,
          e.email as employee_email,
          e.phone as employee_phone,
          e.specialization as employee_specialization
        FROM system_logs l
        LEFT JOIN employees e ON l.employee_id = e.id
        WHERE l.level = 'activity'
      `;
      const params: any[] = [];

      if (employeeId) {
        query += ` AND l.employee_id = ?`;
        params.push(employeeId);
      }

      if (action) {
        query += ` AND l.action = ?`;
        params.push(action);
      }

      if (startDate && endDate) {
        query += ` AND l.created_at BETWEEN ? AND ?`;
        params.push(startDate, endDate);
      }

      query += ` ORDER BY l.created_at DESC LIMIT ? OFFSET ?`;
      params.push(limit, (page - 1) * limit);

      const logs = await connection.query(query, params);

      const formattedLogs = logs.map((log: any) => ({
        id: log.id,
        action: log.action,
        message: log.message,
        employeeId: log.employee_id || log.user_id,
        employee: log.employee_id ? {
          id: log.employee_id,
          name: log.employee_name || 'Unknown Employee',
          email: log.employee_email,
          phone: log.employee_phone,
          specialization: log.employee_specialization,
        } : null,
        ipAddress: log.ip_address,
        created_at: log.created_at,
        details: log.details,
      }));

      let countQuery = `
        SELECT COUNT(*) as total FROM system_logs l
        WHERE l.level = 'activity'
      `;
      const countParams: any[] = [];

      if (employeeId) {
        countQuery += ` AND l.employee_id = ?`;
        countParams.push(employeeId);
      }

      if (action) {
        countQuery += ` AND l.action = ?`;
        countParams.push(action);
      }

      if (startDate && endDate) {
        countQuery += ` AND l.created_at BETWEEN ? AND ?`;
        countParams.push(startDate, endDate);
      }

      const totalResult = await connection.query(countQuery, countParams);
      const total = totalResult[0]?.total || 0;

      return {
        activities: formattedLogs,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      console.error('❌ Failed to fetch activities:', error);
      throw new InternalServerErrorException('Failed to fetch activities');
    } finally {
      await connection.destroy();
    }
  }

  async getStats(tenantId: string) {
    const databaseName = await this.getTenantDatabaseName(tenantId);
    const connection = await this.createTenantConnection(databaseName);

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todayActivities = await connection.query(
        `
        SELECT COUNT(*) as count FROM system_logs
        WHERE level = 'activity' AND created_at >= ?
        `,
        [today],
      );

      const actionStats = await connection.query(
        `
        SELECT action, COUNT(*) as count
        FROM system_logs
        WHERE level = 'activity'
        GROUP BY action
        ORDER BY count DESC
        `,
      );

      const topEmployees = await connection.query(
        `
        SELECT 
          l.employee_id as employeeId,
          COUNT(*) as activityCount,
          MAX(l.created_at) as lastActivity,
          e.name as employeeName,
          e.email as employeeEmail,
          e.phone as employeePhone
        FROM system_logs l
        LEFT JOIN employees e ON l.employee_id = e.id
        WHERE l.level = 'activity' AND l.employee_id IS NOT NULL
        GROUP BY l.employee_id
        ORDER BY activityCount DESC
        LIMIT 5
        `,
      );

      const recentActivities = await connection.query(
        `
        SELECT 
          l.id,
          l.action,
          l.message,
          l.employee_id,
          l.created_at,
          e.name as employeeName,
          e.email as employeeEmail
        FROM system_logs l
        LEFT JOIN employees e ON l.employee_id = e.id
        WHERE l.level = 'activity'
        ORDER BY l.created_at DESC
        LIMIT 10
        `,
      );

      return {
        today: todayActivities[0]?.count || 0,
        actionStats,
        topEmployees: topEmployees.map((emp: any) => ({
          employeeId: emp.employeeId,
          employeeName: emp.employeeName || 'Unknown',
          employeeEmail: emp.employeeEmail,
          employeePhone: emp.employeePhone,
          activityCount: parseInt(emp.activityCount),
          lastActivity: emp.lastActivity,
        })),
        recentActivities: recentActivities.map((act: any) => ({
          id: act.id,
          action: act.action,
          message: act.message,
          employeeId: act.employee_id,
          employeeName: act.employeeName || 'Unknown',
          employeeEmail: act.employeeEmail,
          created_at: act.created_at,
        })),
      };
    } catch (error) {
      console.error('❌ Failed to fetch stats:', error);
      throw new InternalServerErrorException('Failed to fetch stats');
    } finally {
      await connection.destroy();
    }
  }

  async getEmployeeActivities(
    tenantId: string,
    employeeId: number,
    page: number = 1,
    limit: number = 20,
  ) {
    const databaseName = await this.getTenantDatabaseName(tenantId);
    const connection = await this.createTenantConnection(databaseName);

    try {
      const query = `
        SELECT 
          l.id,
          l.action,
          l.message,
          l.ip_address,
          l.created_at,
          l.details,
          e.id as employee_id,
          e.name as employeeName,
          e.email as employeeEmail,
          e.phone as employeePhone
        FROM system_logs l
        LEFT JOIN employees e ON l.employee_id = e.id
        WHERE l.level = 'activity' AND l.employee_id = ?
        ORDER BY l.created_at DESC
        LIMIT ? OFFSET ?
      `;

      const logs = await connection.query(query, [
        employeeId,
        limit,
        (page - 1) * limit,
      ]);

      const formattedLogs = logs.map((log: any) => ({
        id: log.id,
        action: log.action,
        message: log.message,
        ipAddress: log.ip_address,
        created_at: log.created_at,
        details: log.details,
        employee: {
          id: log.employee_id,
          name: log.employeeName || 'Unknown',
          email: log.employeeEmail,
          phone: log.employeePhone,
        },
      }));

      const totalResult = await connection.query(
        `
        SELECT COUNT(*) as total FROM system_logs
        WHERE level = 'activity' AND employee_id = ?
        `,
        [employeeId],
      );

      const total = totalResult[0]?.total || 0;

      return {
        activities: formattedLogs,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      console.error('❌ Failed to fetch employee activities:', error);
      throw new InternalServerErrorException(
        'Failed to fetch employee activities',
      );
    } finally {
      await connection.destroy();
    }
  }
}