import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('employees')
export class Employee {
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

  @Column({ type: 'enum', enum: ['admin', 'employee'], default: 'employee' })
  role!: 'admin' | 'employee';

  @Column({ type: 'text', nullable: true })
  refresh_token!: string | null;

  @CreateDateColumn({ type: 'timestamp' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at!: Date;
}