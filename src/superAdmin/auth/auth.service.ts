// src/superAdmin/auth/auth.service.ts
import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from '../user/user.entity';
import { LoginDto } from './dto/login.dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { CreateUserDto } from '../user/dto/create-user.dto/create-user.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User, 'master')
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const user = await this.userRepository.findOne({
      where: { email, is_active: true },
      select: ['id', 'name', 'email', 'password'],
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const tokens = await this.generateTokens(user.id, user.email, user.name);

    user.refresh_token = tokens.refresh_token;
    await this.userRepository.save(user);

    return {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_in: 900,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: 'super_admin',
      },
    };
  }

  async refreshToken(refreshTokenDto: RefreshTokenDto) {
    const { refresh_token } = refreshTokenDto;

    const user = await this.userRepository.findOne({
      where: { refresh_token, is_active: true },
      select: ['id', 'name', 'email', 'refresh_token'],
    });

    if (!user) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const refreshSecret =
      process.env.JWT_REFRESH_SECRET_SUPERADMIN ||
      process.env.JWT_REFRESH_SECRET ||
      'refresh_secret_key';

    try {
      this.jwtService.verify(refresh_token, {
        secret: refreshSecret,
      });
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const tokens = await this.generateTokens(user.id, user.email, user.name);

    user.refresh_token = tokens.refresh_token;
    await this.userRepository.save(user);

    return {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_in: 900,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: 'super_admin',
      },
    };
  }

  async logout(userId: number) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (user) {
      user.refresh_token = null;
      await this.userRepository.save(user);
    }
    return { message: 'Logged out successfully' };
  }

  async register(createUserDto: CreateUserDto) {
    const { name, email, password, address } = createUserDto;

    const existing = await this.userRepository.findOne({ where: { email } });
    if (existing) {
      throw new ConflictException('Email already exists');
    }

    const existingTenantEmail = await this.userRepository.query(
      'SELECT id FROM tenants WHERE admin_email = ?',
      [email],
    );
    if (existingTenantEmail.length > 0) {
      throw new ConflictException(
        'Email is already registered as a tenant account',
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = this.userRepository.create({
      name,
      email,
      password: hashedPassword,
      address,
    });

    await this.userRepository.save(user);

    const { password: _, ...result } = user;
    return result;
  }

  private async generateTokens(userId: number, email: string, name: string) {
    const payload: Record<string, any> = {
      sub: userId,
      email,
      name,
      role: 'super_admin',
    };
    const accessSecret =
      process.env.JWT_ACCESS_SECRET_SUPERADMIN ||
      process.env.JWT_ACCESS_SECRET ||
      'access_secret_key';
    const refreshSecret =
      process.env.JWT_REFRESH_SECRET_SUPERADMIN ||
      process.env.JWT_REFRESH_SECRET ||
      'refresh_secret_key';

    const accessExpiresIn: string | number =
      process.env.JWT_ACCESS_EXPIRES_IN_SUPERADMIN || '1h';
    const refreshExpiresIn: string | number =
      process.env.JWT_REFRESH_EXPIRES_IN_SUPERADMIN || '30d';

    const [access_token, refresh_token] = await Promise.all([
      this.jwtService.signAsync(
        payload as any,
        {
          secret: accessSecret,
          expiresIn: accessExpiresIn as any,
        } as any,
      ),
      this.jwtService.signAsync(
        payload as any,
        {
          secret: refreshSecret,
          expiresIn: refreshExpiresIn as any,
        } as any,
      ),
    ]);

    return { access_token, refresh_token };
  }
}
