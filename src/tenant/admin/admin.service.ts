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
import { CreateAdminDto } from './dto/create-admin.dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto/update-admin.dto';
import { TenantAdmin } from './tenant-admin.entity';

@Injectable()
export class AdminService {
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
      entities: [TenantAdmin],
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
      const adminRepository = tenantConnection.getRepository(TenantAdmin);
      const admins = await adminRepository.find({
        select: [
          'id',
          'name',
          'email',
          'phone',
          'is_active',
          'role',
          'created_at',
          'updated_at',
        ],
        order: { created_at: 'DESC' },
      });
      return admins;
    } finally {
      await tenantConnection.destroy();
    }
  }

  async findOne(tenantId: string, id: number) {
    const databaseName = await this.getTenantDatabaseName(tenantId);
    const tenantConnection = await this.createTenantConnection(databaseName);

    try {
      const adminRepository = tenantConnection.getRepository(TenantAdmin);
      const admin = await adminRepository.findOne({
        where: { id },
        select: [
          'id',
          'name',
          'email',
          'phone',
          'is_active',
          'role',
          'created_at',
          'updated_at',
        ],
      });

      if (!admin) {
        throw new NotFoundException('Admin not found');
      }

      return admin;
    } finally {
      await tenantConnection.destroy();
    }
  }

  async findByEmail(tenantId: string, email: string) {
    const databaseName = await this.getTenantDatabaseName(tenantId);
    const tenantConnection = await this.createTenantConnection(databaseName);

    try {
      const adminRepository = tenantConnection.getRepository(TenantAdmin);
      const admin = await adminRepository.findOne({
        where: { email },
        select: [
          'id',
          'name',
          'email',
          'phone',
          'is_active',
          'role',
          'created_at',
          'updated_at',
        ],
      });

      return admin;
    } finally {
      await tenantConnection.destroy();
    }
  }

  async create(tenantId: string, createAdminDto: CreateAdminDto) {
    const databaseName = await this.getTenantDatabaseName(tenantId);
    const tenantConnection = await this.createTenantConnection(databaseName);

    try {
      const adminRepository = tenantConnection.getRepository(TenantAdmin);

      // Check if email already exists
      const existingAdmin = await adminRepository.findOne({
        where: { email: createAdminDto.email },
      });

      if (existingAdmin) {
        throw new ConflictException('Admin with this email already exists');
      }

      const hashedPassword = await bcrypt.hash(createAdminDto.password, 10);
      const admin = adminRepository.create({
        name: createAdminDto.name,
        email: createAdminDto.email,
        password: hashedPassword,
        phone: createAdminDto.phone,
        role: createAdminDto.role || 'admin',
      });

      const savedAdmin = await adminRepository.save(admin);
      const { password, refresh_token, ...result } = savedAdmin;
      return result;
    } finally {
      await tenantConnection.destroy();
    }
  }

  async update(tenantId: string, id: number, updateAdminDto: UpdateAdminDto) {
    const databaseName = await this.getTenantDatabaseName(tenantId);
    const tenantConnection = await this.createTenantConnection(databaseName);

    try {
      const adminRepository = tenantConnection.getRepository(TenantAdmin);
      const admin = await adminRepository.findOne({ where: { id } });

      if (!admin) {
        throw new NotFoundException('Admin not found');
      }

      // Check if email is being updated and if it conflicts
      if (updateAdminDto.email && updateAdminDto.email !== admin.email) {
        const existingAdmin = await adminRepository.findOne({
          where: { email: updateAdminDto.email },
        });
        if (existingAdmin) {
          throw new ConflictException('Admin with this email already exists');
        }
      }

      // Hash password if being updated
      if (updateAdminDto.password) {
        updateAdminDto.password = await bcrypt.hash(
          updateAdminDto.password,
          10,
        );
      }

      await adminRepository.update(id, updateAdminDto);
      const updatedAdmin = await adminRepository.findOne({
        where: { id },
        select: [
          'id',
          'name',
          'email',
          'phone',
          'is_active',
          'role',
          'created_at',
          'updated_at',
        ],
      });

      return updatedAdmin;
    } finally {
      await tenantConnection.destroy();
    }
  }

  async deactivate(tenantId: string, id: number) {
    const databaseName = await this.getTenantDatabaseName(tenantId);
    const tenantConnection = await this.createTenantConnection(databaseName);

    try {
      const adminRepository = tenantConnection.getRepository(TenantAdmin);
      const admin = await adminRepository.findOne({ where: { id } });

      if (!admin) {
        throw new NotFoundException('Admin not found');
      }

      await adminRepository.update(id, { is_active: false });
      return { message: 'Admin deactivated successfully' };
    } finally {
      await tenantConnection.destroy();
    }
  }

  async activate(tenantId: string, id: number) {
    const databaseName = await this.getTenantDatabaseName(tenantId);
    const tenantConnection = await this.createTenantConnection(databaseName);

    try {
      const adminRepository = tenantConnection.getRepository(TenantAdmin);
      const admin = await adminRepository.findOne({ where: { id } });

      if (!admin) {
        throw new NotFoundException('Admin not found');
      }

      await adminRepository.update(id, { is_active: true });
      return { message: 'Admin activated successfully' };
    } finally {
      await tenantConnection.destroy();
    }
  }

  async delete(tenantId: string, id: number) {
    const databaseName = await this.getTenantDatabaseName(tenantId);
    const tenantConnection = await this.createTenantConnection(databaseName);

    try {
      const adminRepository = tenantConnection.getRepository(TenantAdmin);
      const admin = await adminRepository.findOne({ where: { id } });

      if (!admin) {
        throw new NotFoundException('Admin not found');
      }

      await adminRepository.delete(id);
      return { message: 'Admin deleted successfully' };
    } finally {
      await tenantConnection.destroy();
    }
  }
}
