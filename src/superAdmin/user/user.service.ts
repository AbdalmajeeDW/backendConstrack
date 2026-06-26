// src/superAdmin/user/user.service.ts
import { Injectable, NotFoundException, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto/update-user.dto';
import * as bcrypt from 'bcryptjs';


@Injectable()
export class UserService {
  constructor(
    @InjectDataSource('master')
    private dataSource: DataSource,
    @InjectRepository(User, 'master')
    private userRepository: Repository<User>,
  ) {}

  async findAll() {
    try {
      const users = await this.userRepository.find({
        select: ['id', 'name', 'email', 'address', 'is_active', 'created_at', 'updated_at'],
        order: { created_at: 'DESC' },
      });
      return users;
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch users');
    }
  }

  async findOne(id: string) {
    try {
      const user = await this.userRepository.findOne({
        where: { id: parseInt(id) },
        select: ['id', 'name', 'email', 'address', 'is_active', 'created_at', 'updated_at'],
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      return user;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to fetch user');
    }
  }

  async findByEmail(email: string) {
    try {
      const user = await this.userRepository.findOne({
        where: { email },
        select: ['id', 'name', 'email', 'address', 'is_active', 'created_at', 'updated_at'],
      });

      return user;
    } catch (error) {
      throw new InternalServerErrorException('Failed to find user by email');
    }
  }

  async create(createUserDto: CreateUserDto) {
    try {
      const { name, email, password, address } = createUserDto;

      const existing = await this.findByEmail(email);
      if (existing) {
        throw new ConflictException('Email already exists');
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = this.userRepository.create({
        name,
        email,
        password: hashedPassword,
        address,
      });

      const savedUser = await this.userRepository.save(user);
      const { password: _, ...result } = savedUser;
      return result;
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to create user');
    }
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.findOne(id);

    if (updateUserDto.name) user.name = updateUserDto.name;
    if (updateUserDto.email) user.email = updateUserDto.email;
    if (updateUserDto.address) user.address = updateUserDto.address;
    if (updateUserDto.password) {
      user.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    await this.userRepository.save(user);
    
    const { password: _, ...result } = user;
    return result;
  }

  async deactivate(id: string) {
    const user = await this.findOne(id);
    user.is_active = false;
    await this.userRepository.save(user);
    return { message: 'User deactivated successfully' };
  }

  async activate(id: string) {
    const user = await this.findOne(id);
    user.is_active = true;
    await this.userRepository.save(user);
    return { message: 'User activated successfully' };
  }

  async delete(id: string) {
    const user = await this.findOne(id);
    await this.userRepository.remove(user);
    return { message: 'User deleted permanently' };
  }
}