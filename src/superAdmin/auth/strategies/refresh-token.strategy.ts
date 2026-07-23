// src/super-admin/auth/strategies/refresh-token.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(
    @InjectDataSource('master')
    private dataSource: DataSource,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromBodyField('refresh_token'),
      ignoreExpiration: false,
      secretOrKey:
        process.env.JWT_REFRESH_SECRET_SUPERADMIN ||
        process.env.JWT_REFRESH_SECRET ||
        'refresh_secret_key',
    });
  }

  async validate(payload: any) {
    const users = await this.dataSource.query(
      `SELECT id, name, email, refresh_token FROM super_admins WHERE id = ? AND is_active = true`,
      [payload.sub],
    );

    if (!users || users.length === 0) {
      throw new UnauthorizedException('User not found');
    }

    return {
      id: users[0].id,
      name: users[0].name,
      email: users[0].email,
      refresh_token: users[0].refresh_token,
    };
  }
}
