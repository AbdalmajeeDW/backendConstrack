import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { Tenant } from './tenant.entity/tenant.entity';
import { CreateTenantDto } from './dto/create-tenant.dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto/update-tenant.dto';

@Injectable()
export class TenantService {
  constructor(
    @InjectDataSource('master')
    private dataSource: DataSource,
    @InjectRepository(Tenant, 'master')
    private tenantRepository: Repository<Tenant>,
  ) {}

  async findAll() {
    try {
      const tenants = await this.tenantRepository.find({
        select: [
          'id',
          'name',
          'address',
          'phone',
          'plan',
          'adminName',
          'adminEmail',
          'databaseName',
          'subscriptionStartDate',
          'subscriptionEndDate',
          'discount',
          'industry',
          'maxEmployees',
          'kvkNumber',
          'btwNumber',
          'status',
          'created_at',
          'updated_at',
        ],
        order: { created_at: 'DESC' },
      });
      return tenants.map((tenant) => ({ tenantId: tenant.id, ...tenant }));
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch tenants');
    }
  }

  async findOne(id: string) {
    const tenant = await this.tenantRepository.findOne({
      where: { id: parseInt(id) },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const { adminPassword, ...result } = tenant as any;
    return { tenantId: tenant.id, ...result };
  }

  async findById(id: string) {
    try {
      const tenant = await this.tenantRepository.findOne({
        where: { id: parseInt(id) },
        select: [
          'id',
          'name',
          'address',
          'phone',
          'adminName',
          'adminEmail',
          'databaseName',
          'subscriptionStartDate',
          'subscriptionEndDate',
          'discount',
          'industry',
          'maxEmployees',
          'kvkNumber',
          'btwNumber',
          'status',
          'created_at',
          'updated_at',
        ],
      });

      if (!tenant) {
        throw new NotFoundException('Tenant not found');
      }

      return { tenantId: tenant.id, ...tenant };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to fetch tenant');
    }
  }

  async findByDatabaseName(databaseName: string) {
    try {
      const tenant = await this.tenantRepository.findOne({
        where: { databaseName },
        select: [
          'id',
          'name',
          'address',
          'phone',
          'adminName',
          'adminEmail',
          'databaseName',
          'subscriptionStartDate',
          'subscriptionEndDate',
          'discount',
          'industry',
          'maxEmployees',
          'kvkNumber',
          'btwNumber',
          'status',
          'created_at',
          'updated_at',
        ],
      });

      if (!tenant) {
        throw new NotFoundException('Tenant not found');
      }

      return { tenantId: tenant.id, ...tenant };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to fetch tenant by database name',
      );
    }
  }

  async findByName(name: string) {
    try {
      const tenant = await this.tenantRepository.findOne({
        where: { name },
        select: [
          'id',
          'name',
          'address',
          'phone',
          'adminName',
          'adminEmail',
          'databaseName',
          'subscriptionStartDate',
          'subscriptionEndDate',
          'discount',
          'industry',
          'maxEmployees',
          'kvkNumber',
          'btwNumber',
          'status',
          'created_at',
          'updated_at',
        ],
      });

      if (!tenant) {
        throw new NotFoundException('Tenant not found');
      }

      return { tenantId: tenant.id, ...tenant };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to fetch tenant by name');
    }
  }

  async findByAdminEmail(adminEmail: string) {
    try {
      const tenant = await this.tenantRepository.findOne({
        where: { adminEmail },
        select: [
          'id',
          'name',
          'address',
          'phone',
          'adminName',
          'adminEmail',
          'databaseName',
          'subscriptionStartDate',
          'subscriptionEndDate',
          'discount',
          'industry',
          'maxEmployees',
          'kvkNumber',
          'btwNumber',
          'status',
          'created_at',
          'updated_at',
        ],
      });

      return tenant;
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to find tenant by admin email',
      );
    }
  }

  private normalizeDatabaseName(name: string) {
    return `tenant_${name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')}`;
  }
private async createTenantInvoiceTable(databaseName: string) {
  try {
    await this.dataSource.query(
      `
      CREATE TABLE \`${databaseName}\`.\`invoices\` (
        id INT AUTO_INCREMENT PRIMARY KEY,

        employee_id INT NOT NULL,

        images JSON NOT NULL,

        description TEXT NULL,
        invoice_date DATETIME  NOT NULL,
        status ENUM(
          'pending',
          'approved',
          'rejected'
        ) NOT NULL DEFAULT 'pending',

        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP 
        ON UPDATE CURRENT_TIMESTAMP,

        CONSTRAINT fk_invoice_employee
        FOREIGN KEY (employee_id)
        REFERENCES \`${databaseName}\`.\`employees\`(id)
        ON DELETE CASCADE

      ) ENGINE=InnoDB 
      DEFAULT CHARSET=utf8mb4 
      COLLATE=utf8mb4_unicode_ci
      `,
    );
  } catch (error) {
    throw new InternalServerErrorException(
      'Failed to create tenant invoice table',
    );
  }
}
  private async databaseExists(databaseName: string) {
    const rows = await this.dataSource.query(
      'SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?',
      [databaseName],
    );
    return rows.length > 0;
  }
private async createTenantLogsTable(databaseName: string) {
  try {
    await this.dataSource.query(
      `
      CREATE TABLE IF NOT EXISTS \`${databaseName}\`.\`system_logs\` (
        id INT AUTO_INCREMENT PRIMARY KEY,
        
        level ENUM('info', 'warning', 'error', 'critical', 'security', 'activity') NOT NULL DEFAULT 'info',
        
        action VARCHAR(100) NOT NULL,
        
        message TEXT NOT NULL,
        
        user_id VARCHAR(50) NULL,
        
        user_email VARCHAR(100) NULL,
        
        user_role VARCHAR(50) NULL,
        
        ip_address VARCHAR(50) NULL,
        
        user_agent TEXT NULL,
        
        route VARCHAR(255) NULL,
        
        method VARCHAR(10) NULL,
        
        status_code INT NULL,
        
        duration INT NULL,
        
        details JSON NULL,
        
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        
        employee_id INT NULL,
        
        INDEX idx_logs_action (action),
        INDEX idx_logs_user (user_id),
        INDEX idx_logs_level (level),
        INDEX idx_logs_created (created_at),
        INDEX idx_logs_employee (employee_id),
        
        CONSTRAINT fk_logs_employee
        FOREIGN KEY (employee_id)
        REFERENCES \`${databaseName}\`.\`employees\`(id)
        ON DELETE SET NULL
        
      ) ENGINE=InnoDB 
      DEFAULT CHARSET=utf8mb4 
      COLLATE=utf8mb4_unicode_ci
      `,
    );
  } catch (error) {
    throw new InternalServerErrorException(
      'Failed to create tenant logs table',
    );
  }
}
  private async buildUniqueDatabaseName(baseName: string) {
    let databaseName = baseName;
    let suffix = 1;
    while (await this.databaseExists(databaseName)) {
      databaseName = `${baseName}_${suffix}`;
      suffix += 1;
    }
    return databaseName;
  }

  private async createTenantDatabase(databaseName: string) {
    try {
      await this.dataSource.query(
        `CREATE DATABASE \`${databaseName}\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
      );
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to create tenant database',
      );
    }
  }

  private async createTenantEmployeeTable(databaseName: string) {
    try {
      await this.dataSource.query(
        `CREATE TABLE \`${databaseName}\`.\`employees\` (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        phone VARCHAR(50) NULL,
        salary DECIMAL(10,2) NULL,
        address TEXT NULL,
        birth_date DATE NULL,
        driving_license BOOLEAN NOT NULL DEFAULT false,
        specialization VARCHAR(255) NULL,
        is_active BOOLEAN NOT NULL DEFAULT true,
        refresh_token TEXT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
      );
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to create tenant employee table',
      );
    }
  }
  private async createTaskEmployeesTable(databaseName: string) {
    try {
      await this.dataSource.query(
        `CREATE TABLE \`${databaseName}\`.\`task_employees\` (
        id INT AUTO_INCREMENT PRIMARY KEY,
        task_id INT NOT NULL,
        employee_id INT NOT NULL,
        assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
        FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
        UNIQUE KEY unique_task_employee (task_id, employee_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
      );
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to create task_employees table',
      );
    }
  }
  private async createTenantProjectsTable(databaseName: string) {
    try {
      await this.dataSource.query(
        `CREATE TABLE IF NOT EXISTS \`${databaseName}\`.\`projects\` (
        id INT AUTO_INCREMENT PRIMARY KEY,

        name VARCHAR(255) NOT NULL,

        description TEXT NULL,
        client_name VARCHAR(255) NULL,
        client_phone VARCHAR(50) NULL,
        location VARCHAR(255) NULL,
        city VARCHAR(100) NULL,
        postal_code VARCHAR(50) NULL,
       

        start_date DATE NULL,

        end_date DATE NULL,

        status ENUM(
          'planning',
          'active',
          'completed',
          'cancelled'
        ) DEFAULT 'planning',

        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

        updated_at TIMESTAMP NOT NULL 
        DEFAULT CURRENT_TIMESTAMP 
        ON UPDATE CURRENT_TIMESTAMP

      ) ENGINE=InnoDB 
      DEFAULT CHARSET=utf8mb4 
      COLLATE=utf8mb4_unicode_ci`,
      );
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to create tenant projects table',
      );
    }
  }
  private async createTenantTasksTable(databaseName: string) {
    try {
      await this.dataSource.query(
        `CREATE TABLE IF NOT EXISTS \`${databaseName}\`.\`tasks\` (
        id INT AUTO_INCREMENT PRIMARY KEY,

        taskName VARCHAR(255) NOT NULL,

        project_id INT NULL,

        assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

        city VARCHAR(255) NULL,

        images JSON NULL,

        postal_code VARCHAR(50) NULL,

        house_number VARCHAR(50) NULL,

        worker_arrival_time TIME NULL,

        task_type VARCHAR(255) NULL,

        work_area DECIMAL(10,2) NULL,

        bus_number VARCHAR(100) NULL,

        driver_name VARCHAR(255) NULL,

        taskDescription TEXT NULL,

        startWork DATE NOT NULL,

        endWork DATE NOT NULL,

        priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',

        status ENUM('in_progress', 'done') DEFAULT 'in_progress',

        is_active BOOLEAN NOT NULL DEFAULT true,

        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP 
        ON UPDATE CURRENT_TIMESTAMP,

        FOREIGN KEY (project_id)
        REFERENCES projects(id)
        ON DELETE SET NULL

      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
      );
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to create tenant tasks table',
      );
    }
  }

  private async createTenantAdminTable(databaseName: string) {
    try {
      await this.dataSource.query(
        `CREATE TABLE \`${databaseName}\`.\`tenant_admins\` (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL UNIQUE,
          password VARCHAR(255) NOT NULL,
          phone VARCHAR(50) NULL,
          is_active BOOLEAN NOT NULL DEFAULT true,
          refresh_token TEXT NULL,
          role VARCHAR(50) NOT NULL DEFAULT 'admin',
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
      );
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to create tenant admin table',
      );
    }
  }

  private async dropTenantDatabase(databaseName: string) {
    try {
      await this.dataSource.query(
        `DROP DATABASE IF EXISTS \`${databaseName}\``,
      );
    } catch {
      // ignore cleanup failures
    }
  }
  private async insertTenantAdminIntoDatabase(
    databaseName: string,
    adminName: string,
    adminEmail: string,
    hashedPassword: string,
    phone: string | null,
  ) {
    try {
      await this.dataSource.query(
        `INSERT INTO \`${databaseName}\`.\`tenant_admins\` 
       (name, email, password, phone, role, is_active, created_at, updated_at) 
       VALUES (?, ?, ?, ?, 'admin', true, NOW(), NOW())`,
        [adminName, adminEmail, hashedPassword, phone || null],
      );
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to insert tenant admin into tenant database',
      );
    }
  }
  async getTenantDatabaseNameById(tenantId: string) {
    const tenant = await this.tenantRepository.findOne({
      where: { id: parseInt(tenantId) },
      select: ['databaseName'],
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return tenant.databaseName;
  }
  async create(createTenantDto: CreateTenantDto) {
    const existing = await this.findByAdminEmail(createTenantDto.adminEmail);
    if (existing) {
      throw new ConflictException(
        'A tenant with this admin email already exists',
      );
    }

    const baseDatabaseName = this.normalizeDatabaseName(
      createTenantDto.databaseName,
    );
    const databaseName = await this.buildUniqueDatabaseName(baseDatabaseName);

    await this.createTenantDatabase(databaseName);
    try {
      await this.createTenantEmployeeTable(databaseName);
      await this.createTenantAdminTable(databaseName);
      await this.createTenantProjectsTable(databaseName);
      await this.createTenantTasksTable(databaseName);
      await this.createTenantInvoiceTable(databaseName);
      await this.createTaskEmployeesTable(databaseName);
      await this.createTenantLogsTable(databaseName); 
      const hashedPassword = await bcrypt.hash(
        createTenantDto.adminPassword,
        10,
      );
      await this.insertTenantAdminIntoDatabase(
        databaseName,
        createTenantDto.adminName,
        createTenantDto.adminEmail,
        hashedPassword,
        createTenantDto.phone ?? '',
      );
      const tenant = this.tenantRepository.create({
        name: createTenantDto.name,
        address: createTenantDto.address,
        phone: createTenantDto.phone,
        adminName: createTenantDto.adminName,
        adminPassword: hashedPassword,
        adminEmail: createTenantDto.adminEmail,
        databaseName,
        subscriptionStartDate: createTenantDto.subscriptionStartDate,
        subscriptionEndDate: createTenantDto.subscriptionEndDate,
        discount: createTenantDto.discount
          ? Number(createTenantDto.discount)
          : undefined,
        industry: createTenantDto.industry,
        maxEmployees: createTenantDto.maxEmployees,
        kvkNumber: createTenantDto.kvkNumber,
        btwNumber: createTenantDto.btwNumber,
        plan: createTenantDto.plan,
        status: createTenantDto.status,
      });

      const savedTenant = await this.tenantRepository.save(tenant);
      const { adminPassword, ...result } = savedTenant as any;
      return { tenantId: savedTenant.id, ...result };
    } catch (error) {
      await this.dropTenantDatabase(databaseName);
      throw error;
    }
  }

  async update(id: string, updateTenantDto: UpdateTenantDto) {
    try {
      if (updateTenantDto.adminPassword) {
        updateTenantDto.adminPassword = await bcrypt.hash(
          updateTenantDto.adminPassword,
          10,
        );
      }

      await this.tenantRepository.update({ id: parseInt(id) }, updateTenantDto);

      return this.findOne(id);
    } catch (error) {
      throw new InternalServerErrorException('Failed to update tenant');
    }
  }
  async deactivate(id: string) {
    try {
      const [tenant] = await this.dataSource.query(
        `SELECT id FROM tenants WHERE id = ?`,
        [id],
      );

      if (!tenant) {
        throw new NotFoundException('Tenant not found');
      }

      await this.dataSource.query(
        `UPDATE tenants SET status = 'inactive', updated_at = NOW() WHERE id = ?`,
        [id],
      );

      return { message: 'Tenant deactivated successfully' };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to deactivate tenant');
    }
  }

  async activate(id: string) {
    try {
      const [tenant] = await this.dataSource.query(
        `SELECT id FROM tenants WHERE id = ?`,
        [id],
      );

      if (!tenant) {
        throw new NotFoundException('Tenant not found');
      }

      await this.dataSource.query(
        `UPDATE tenants SET status = 'active', updated_at = NOW() WHERE id = ?`,
        [id],
      );

      return { message: 'Tenant activated successfully' };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to activate tenant');
    }
  }
}
