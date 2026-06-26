import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('super_admins')
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 255 })
  name!: string;

  @Column({ length: 255, unique: true })
  email!: string;

  @Column({ length: 255 })
  password!: string;

  @Column({ length: 255, nullable: true })
  address?: string;

  @Column({ default: true })
  is_active!: boolean;
   @Column({ type: 'text', nullable: true })
  refresh_token!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  created_at!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updated_at!: Date;
}