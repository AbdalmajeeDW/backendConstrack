import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { TenantService } from '../../../superAdmin/tenant/tenant.service';

@Injectable()
export class TenantAccessTokenStrategy extends PassportStrategy(
  Strategy,
  'jwt-tenant-access',
) {
  constructor(
    @InjectDataSource('master')
    private readonly masterDataSource: DataSource,
    private readonly tenantService: TenantService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        process.env.JWT_ACCESS_SECRET_TENANT ||
        process.env.JWT_ACCESS_SECRET ||
        'access_secret_key_tenant',
    });
  }

  private async createTenantConnection(databaseName: string) {
    const options = this.masterDataSource.options as any;
    const tenantConnection = new DataSource({
      type: options.type,
      host: options.host,
      port: options.port,
      username: options.username,
      password: options.password,
      database: databaseName,
      entities: [],
      synchronize: false,
      logging: false,
      charset: 'utf8mb4',
    });
    await tenantConnection.initialize();
    return tenantConnection;
  }

  async validate(payload: any) {
   
    
    const tenant = await this.tenantService.findById(payload.tenantId);
    if (tenant.status !== 'active') {
      throw new UnauthorizedException('Tenant inactive');
    }

    const tenantConnection = await this.createTenantConnection(
      tenant.databaseName,
    );

    try {
      if (payload.role === 'tenant_admin') {
        const admins: any[] = await tenantConnection.query(
          'SELECT id, name, email FROM tenant_admins WHERE id = ? AND is_active = true',
          [payload.sub],
        );

        if (!admins || admins.length === 0) {
          throw new UnauthorizedException('Admin not found or inactive');
        }

        return {
          id: admins[0].id,
          name: admins[0].name,
          email: admins[0].email,
          tenantId: payload.tenantId,
          role: 'tenant_admin',
        };
      } else {
        const employees: any[] = await tenantConnection.query(
          'SELECT id, name, email FROM employees WHERE id = ? AND is_active = true',
          [payload.sub],
        );

        if (!employees || employees.length === 0) {
          throw new UnauthorizedException('Employee not found or inactive');
        }

        return {
          id: employees[0].id,
          name: employees[0].name,
          email: employees[0].email,
          tenantId: payload.tenantId,
          role: 'tenant_employee',
        };
      }
    } finally {
      await tenantConnection.destroy();
    }
  }
}