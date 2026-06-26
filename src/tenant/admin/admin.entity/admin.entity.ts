import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('tenant_admins')
export class TenantAdmin {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column({ length: 255 })
  name!: string;

  @Column({ length: 255, unique: true })
  email!: string;

  @Column({ length: 255 })
  password!: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  phone?: string;

  @Column({ default: true })
  is_active!: boolean;

  @Column({ type: 'text', nullable: true })
  refresh_token!: string | null;

  @Column({ type: 'varchar', length: 50, default: 'admin' })
  role!: string; // admin, super_admin, etc.

  @CreateDateColumn({ type: 'timestamp' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at!: Date;
}