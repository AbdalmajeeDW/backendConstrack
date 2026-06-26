import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { TenantService } from '../../superAdmin/tenant/tenant.service';
import { CreateEmployeeDto } from './dto/create-employee.dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto/update-employee.dto';
import { Employee } from './employee.entity';

@Injectable()
export class EmployeeService {
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
      entities: [Employee],
      synchronize: false,
      logging: false,
      charset: 'utf8mb4',
    });
    await tenantConnection.initialize();
    return tenantConnection;
  }

  private async getTenantDatabaseName(tenantId: string) {
    const tenant = await this.tenantService.findById(tenantId);
    if (tenant.status !== 'active') {
      throw new InternalServerErrorException('Tenant is inactive');
    }
    return tenant.databaseName;
  }

  async findAll(tenantId: string) {
    const databaseName = await this.getTenantDatabaseName(tenantId);
    const tenantConnection = await this.createTenantConnection(databaseName);

    try {
      const employeeRepository = tenantConnection.getRepository(Employee);
      const employees = await employeeRepository.find({
        select: [
          'id',
          'name',
          'email',
          'phone',
          'salary',
          'address',
          'birth_date',
          'driving_license',
          'specialization',
          'is_active',
          'created_at',
          'updated_at',
        ],
        order: { created_at: 'DESC' },
      });
      return employees;
    } finally {
      await tenantConnection.destroy();
    }
  }

  async findOne(tenantId: string, id: number) {
    const databaseName = await this.getTenantDatabaseName(tenantId);
    const tenantConnection = await this.createTenantConnection(databaseName);

    try {
      const employeeRepository = tenantConnection.getRepository(Employee);
      const employee = await employeeRepository.findOne({
        where: { id },
        select: [
          'id',
          'name',
          'email',
          'phone',
          'salary',
          'address',
          'birth_date',
          'driving_license',
          'specialization',
          'is_active',
          'created_at',
          'updated_at',
        ],
      });

      if (!employee) {
        throw new NotFoundException('Employee not found');
      }

      return employee;
    } finally {
      await tenantConnection.destroy();
    }
  }

  async findByEmail(tenantId: string, email: string) {
    const databaseName = await this.getTenantDatabaseName(tenantId);
    const tenantConnection = await this.createTenantConnection(databaseName);

    try {
      const employeeRepository = tenantConnection.getRepository(Employee);
      const employee = await employeeRepository.findOne({
        where: { email },
        select: [
          'id',
          'name',
          'email',
          'phone',
          'salary',
          'address',
          'birth_date',
          'driving_license',
          'specialization',
          'is_active',
          'created_at',
          'updated_at',
        ],
      });

      return employee;
    } finally {
      await tenantConnection.destroy();
    }
  }

  async create(tenantId: string, createEmployeeDto: CreateEmployeeDto) {
    const databaseName = await this.getTenantDatabaseName(tenantId);
    const tenantConnection = await this.createTenantConnection(databaseName);

    try {
      const employeeRepository = tenantConnection.getRepository(Employee);

      // Check if email already exists
      const existingEmployee = await employeeRepository.findOne({
        where: { email: createEmployeeDto.email },
      });

      if (existingEmployee) {
        throw new ConflictException('Employee with this email already exists');
      }

      const hashedPassword = await bcrypt.hash(createEmployeeDto.password, 10);
      const employee = employeeRepository.create({
        name: createEmployeeDto.name,
        address: createEmployeeDto.address,
        birth_date: createEmployeeDto.birth_date,
        driving_license: createEmployeeDto.driving_license,
        specialization: createEmployeeDto.specialization,
        salary: createEmployeeDto.salary,
        email: createEmployeeDto.email,
        password: hashedPassword,
        phone: createEmployeeDto.phone,
      });

      const savedEmployee = await employeeRepository.save(employee);
      const { password, refresh_token, ...result } = savedEmployee;
      return result;
    } finally {
      await tenantConnection.destroy();
    }
  }

  async update(
    tenantId: string,
    id: number,
    updateEmployeeDto: UpdateEmployeeDto,
  ) {
    const databaseName = await this.getTenantDatabaseName(tenantId);
    const tenantConnection = await this.createTenantConnection(databaseName);

    try {
      const employeeRepository = tenantConnection.getRepository(Employee);
      const employee = await employeeRepository.findOne({ where: { id } });

      if (!employee) {
        throw new NotFoundException('Employee not found');
      }

      // Check if email is being updated and if it conflicts
      if (
        updateEmployeeDto.email &&
        updateEmployeeDto.email !== employee.email
      ) {
        const existingEmployee = await employeeRepository.findOne({
          where: { email: updateEmployeeDto.email },
        });
        if (existingEmployee) {
          throw new ConflictException(
            'Employee with this email already exists',
          );
        }
      }

      // Hash password if being updated
      if (updateEmployeeDto.password) {
        updateEmployeeDto.password = await bcrypt.hash(
          updateEmployeeDto.password,
          10,
        );
      }

      await employeeRepository.update(id, updateEmployeeDto);
      const updatedEmployee = await employeeRepository.findOne({
        where: { id },
        select: [
          'id',
          'name',
          'email',
          'phone',
          'salary',
          'address',
          'birth_date',
          'driving_license',
          'specialization',
          'is_active',
          'created_at',
          'updated_at',
        ],
      });

      return updatedEmployee;
    } finally {
      await tenantConnection.destroy();
    }
  }

  async deactivate(tenantId: string, id: number) {
    const databaseName = await this.getTenantDatabaseName(tenantId);
    const tenantConnection = await this.createTenantConnection(databaseName);

    try {
      const employeeRepository = tenantConnection.getRepository(Employee);
      const employee = await employeeRepository.findOne({ where: { id } });

      if (!employee) {
        throw new NotFoundException('Employee not found');
      }

      await employeeRepository.update(id, { is_active: false });
      return { message: 'Employee deactivated successfully' };
    } finally {
      await tenantConnection.destroy();
    }
  }

  async activate(tenantId: string, id: number) {
    const databaseName = await this.getTenantDatabaseName(tenantId);
    const tenantConnection = await this.createTenantConnection(databaseName);

    try {
      const employeeRepository = tenantConnection.getRepository(Employee);
      const employee = await employeeRepository.findOne({ where: { id } });

      if (!employee) {
        throw new NotFoundException('Employee not found');
      }

      await employeeRepository.update(id, { is_active: true });
      return { message: 'Employee activated successfully' };
    } finally {
      await tenantConnection.destroy();
    }
  }

  async delete(tenantId: string, id: number) {
    const databaseName = await this.getTenantDatabaseName(tenantId);
    const tenantConnection = await this.createTenantConnection(databaseName);

    try {
      const employeeRepository = tenantConnection.getRepository(Employee);
      const employee = await employeeRepository.findOne({ where: { id } });

      if (!employee) {
        throw new NotFoundException('Employee not found');
      }

      await employeeRepository.delete(id);
      return { message: 'Employee deleted successfully' };
    } finally {
      await tenantConnection.destroy();
    }
  }
}
