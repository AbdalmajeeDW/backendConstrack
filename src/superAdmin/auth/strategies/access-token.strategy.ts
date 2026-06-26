// src/super-admin/auth/strategies/access-token.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class AccessTokenStrategy extends PassportStrategy(Strategy, 'jwt-access') {
  constructor(
    @InjectDataSource('master')
    private dataSource: DataSource,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        process.env.JWT_ACCESS_SECRET_SUPERADMIN ||
        process.env.JWT_ACCESS_SECRET ||
        'access_secret_key',
    });
  }

  async validate(payload: any) {
    const users = await this.dataSource.query(
      `SELECT id, name, email FROM super_admins WHERE id = ? AND is_active = true`,
      [payload.sub],
    );

    if (!users || users.length === 0) {
      throw new UnauthorizedException('User not found or inactive');
    }

    return {
      id: users[0].id,
      name: users[0].name,
      email: users[0].email,
      role: 'super_admin',
    };
  }
}