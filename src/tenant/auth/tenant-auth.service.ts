import { Injectable, UnauthorizedException, ConflictException, NotFoundException, InternalServerErrorException, } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { TenantService } from '../../superAdmin/tenant/tenant.service';
import { TenantLoginDto } from './dto/tenant-login.dto';
import { TenantRefreshTokenDto } from './dto/tenant-refresh-token.dto';
import { TenantRegisterDto } from './dto/tenant-register.dto';

@Injectable()
export class TenantAuthService {
  constructor(
    @InjectDataSource('master')
    private readonly masterDataSource: DataSource,
    private readonly jwtService: JwtService,
    private readonly tenantService: TenantService,
  ) {}

  private buildTenantDataSourceOptions(databaseName: string): any {
    const masterOptions = this.masterDataSource.options as any;

    return {
      type: masterOptions.type,
      host: masterOptions.host,
      port: masterOptions.port,
      username: masterOptions.username,
      password: masterOptions.password,
      database: databaseName,
      entities: [],
      synchronize: false,
      logging: false,
      charset: 'utf8mb4',
    };
  }

  private async createTenantConnection(databaseName: string) {
    const tenantDataSource = new DataSource(this.buildTenantDataSourceOptions(databaseName));
    await tenantDataSource.initialize();
    return tenantDataSource;
  }

  private async getTenantDatabaseName(tenantName: string) {
    const tenant = await this.tenantService.findByName(tenantName);
    if (tenant.status !== 'active') {
      throw new UnauthorizedException('Tenant is inactive');
    }
    return tenant.databaseName;
  }

  private async generateTokens(
    id: string,
    email: string,
    name: string,
    tenantId: string,
    role: string,
  ) {

    const payload: Record<string, any> = {
      sub: id,
      email,
      name,
      tenantId,
      role,
    };
    const accessSecret =
      process.env.JWT_ACCESS_SECRET_TENANT ||
      process.env.JWT_ACCESS_SECRET ||
      'access_secret_key_tenant';
    const refreshSecret =
      process.env.JWT_REFRESH_SECRET_TENANT ||
      process.env.JWT_REFRESH_SECRET ||
      'refresh_secret_key_tenant';

    const accessExpiresIn: string | number =
      process.env.JWT_ACCESS_EXPIRES_IN_TENANT || '15m';
    const refreshExpiresIn: string | number =
      process.env.JWT_REFRESH_EXPIRES_IN_TENANT || '30d';

    const [access_token, refresh_token] = await Promise.all([
      this.jwtService.signAsync(payload as any, {
        secret: accessSecret,
        expiresIn: accessExpiresIn as any,
      } as any),
      this.jwtService.signAsync(payload as any, {
        secret: refreshSecret,
        expiresIn: refreshExpiresIn as any,
      } as any),
    ]);

    return { access_token, refresh_token };
  }

  async register(tenantRegisterDto: TenantRegisterDto, tenantName: string) {
    const tenant = await this.tenantService.findByName(tenantName);
    const databaseName = tenant.databaseName;
    const tenantConnection = await this.createTenantConnection(databaseName);
    const role = tenantRegisterDto.role === 'admin' ? 'admin' : 'employee';

    const existingSuperAdminEmail = await this.masterDataSource.query(
      'SELECT id FROM super_admins WHERE email = ?',
      [tenantRegisterDto.email],
    );
    if (existingSuperAdminEmail.length > 0) {
      throw new ConflictException(
        'Email is already registered as a super admin account',
      );
    }

    const existingTenantOwnerEmail = await this.masterDataSource.query(
      'SELECT id FROM tenants WHERE admin_email = ?',
      [tenantRegisterDto.email],
    );
    if (existingTenantOwnerEmail.length > 0) {
      throw new ConflictException(
        'Email is already registered as a tenant owner account',
      );
    }

    try {
      const existingEmployees = await tenantConnection.query(
        'SELECT id FROM employees WHERE email = ?',
        [tenantRegisterDto.email],
      );
      const existingAdmins = await tenantConnection.query(
        'SELECT id FROM tenant_admins WHERE email = ?',
        [tenantRegisterDto.email],
      );

      if (existingEmployees.length > 0 || existingAdmins.length > 0) {
        throw new ConflictException('Email already exists for this tenant');
      }

      const hashedPassword = await bcrypt.hash(tenantRegisterDto.password, 10);
      let result: any;
      let responseRole = 'tenant_employee';

      if (role === 'admin') {
        result = await tenantConnection.query(
          'INSERT INTO tenant_admins (name, email, password, phone, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())',
          [
            tenantRegisterDto.name,
            tenantRegisterDto.email,
            hashedPassword,
            tenantRegisterDto.phone || null,
            'admin',
          ],
        );
        responseRole = 'tenant_admin';
      } else {
        result = await tenantConnection.query(
          'INSERT INTO employees (name, email, password, phone, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())',
          [
            tenantRegisterDto.name,
            tenantRegisterDto.email,
            hashedPassword,
            tenantRegisterDto.phone || null,
          ],
        );
      }

      return {
        id: result.insertId,
        name: tenantRegisterDto.name,
        email: tenantRegisterDto.email,
        phone: tenantRegisterDto.phone || null,
        tenantId: tenant.tenantId,
        role: responseRole,
      };
    } finally {
      await tenantConnection.destroy();
    }
  }

  async login(tenantLoginDto: TenantLoginDto) {
    const databaseName = await this.getTenantDatabaseName(tenantLoginDto.name);
    const tenant = await this.tenantService.findByName(tenantLoginDto.name);

    const tenantConnection = await this.createTenantConnection(databaseName);
    try {
      const admins: any[] = await tenantConnection.query(
        'SELECT id, name, email, password, role, is_active FROM tenant_admins WHERE email = ?',
        [tenantLoginDto.email],
      );

      if (admins && admins.length > 0) {
        const admin = admins[0];
        const isPasswordValid = await bcrypt.compare(tenantLoginDto.password, admin.password);

        if (!isPasswordValid || !admin.is_active) {
          throw new UnauthorizedException('Invalid email or password');
        }

        const tokens = await this.generateTokens(
          admin.id.toString(),
          admin.email,
          admin.name,
          tenant.id.toString(),
          'tenant_admin',
        );

        await tenantConnection.query(
          'UPDATE tenant_admins SET refresh_token = ? WHERE id = ?',
          [tokens.refresh_token, admin.id],
        );

        return {
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expires_in: 900,
          user: {
            id: admin.id,
            name: admin.name,
            email: admin.email,
            role: 'tenant_admin',
            tenantId: tenant.id,
          },
        };
      }

      const employees: any[] = await tenantConnection.query(
        'SELECT id, name, email, password, is_active FROM employees WHERE email = ?',
        [tenantLoginDto.email],
      );

      if (!employees || employees.length === 0) {
        throw new UnauthorizedException('Invalid email or password');
      }

      const employee = employees[0];
      const isPasswordValid = await bcrypt.compare(tenantLoginDto.password, employee.password);

      if (!isPasswordValid || !employee.is_active) {
        throw new UnauthorizedException('Invalid email or password');
      }

      const tokens = await this.generateTokens(
        employee.id.toString(),
        employee.email,
        employee.name,
        tenant.id.toString(),
        'tenant_employee',
      );

      await tenantConnection.query(
        'UPDATE employees SET refresh_token = ? WHERE id = ?',
        [tokens.refresh_token, employee.id],
      );

      return {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_in: 900,
        user: {
          id: employee.id,
          name: employee.name,
          email: employee.email,
          role: 'tenant_employee',
          tenantId: tenant.id.toString(),
        },
      };
    } finally {
      await tenantConnection.destroy();
    }
  }

  async refreshToken(tenantRefreshTokenDto: TenantRefreshTokenDto) {
    const refreshSecret =
      process.env.JWT_REFRESH_SECRET_TENANT ||
      process.env.JWT_REFRESH_SECRET ||
      'refresh_secret_key_tenant';

    let payload: any;
    try {
      payload = this.jwtService.verify(tenantRefreshTokenDto.refresh_token, {
        secret: refreshSecret,
      });
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const tenantId = payload.tenantId;
    const databaseName = await this.getTenantDatabaseName(tenantId);
    const tenantConnection = await this.createTenantConnection(databaseName);

    try {
      const admins: any[] = await tenantConnection.query(
        'SELECT id, name, email, refresh_token, is_active FROM tenant_admins WHERE refresh_token = ?',
        [tenantRefreshTokenDto.refresh_token],
      );

      if (admins && admins.length > 0) {
        const admin = admins[0];
        if (!admin.is_active) {
          throw new UnauthorizedException('User is inactive');
        }

        const tokens = await this.generateTokens(
          admin.id.toString(),
          admin.email,
          admin.name,
          tenantId,
          'tenant_admin',
        );

        await tenantConnection.query(
          'UPDATE tenant_admins SET refresh_token = ? WHERE id = ?',
          [tokens.refresh_token, admin.id],
        );

        return {
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expires_in: 900,
          user: {
            id: admin.id,
            name: admin.name,
            email: admin.email,
            role: 'tenant_admin',
          },
        };
      }

      const employees: any[] = await tenantConnection.query(
        'SELECT id, name, email, refresh_token, is_active FROM employees WHERE refresh_token = ?',
        [tenantRefreshTokenDto.refresh_token],
      );

      if (!employees || employees.length === 0) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const employee = employees[0];
      if (!employee.is_active) {
        throw new UnauthorizedException('User is inactive');
      }

      const tokens = await this.generateTokens(
        employee.id.toString(),
        employee.email,
        employee.name,
        tenantId,
        'tenant_employee',
      );

      await tenantConnection.query(
        'UPDATE employees SET refresh_token = ? WHERE id = ?',
        [tokens.refresh_token, employee.id],
      );

      return {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_in: 900,
        user: {
          id: employee.id,
          name: employee.name,
          email: employee.email,
          role: 'tenant_employee',
        },
      };
    } finally {
      await tenantConnection.destroy();
    }
  }

  async logout(tenantId: string, employeeId: string) {
    const databaseName = await this.getTenantDatabaseName(tenantId);
    const tenantConnection = await this.createTenantConnection(databaseName);

    try {
      await tenantConnection.query(
        'UPDATE tenant_admins SET refresh_token = NULL WHERE id = ?',
        [employeeId],
      );
      await tenantConnection.query(
        'UPDATE employees SET refresh_token = NULL WHERE id = ?',
        [employeeId],
      );
      return { message: 'Logged out successfully' };
    } finally {
      await tenantConnection.destroy();
    }
  }
}
