import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('employees')
export class Employee {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email!: string;

  @Column({ type: 'varchar', length: 255 })
  password!: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  phone!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  salary!: number;

  @Column({ type: 'text', nullable: true })
  address!: string;

  @Column({ type: 'date', nullable: true })
  birth_date!: Date;

  @Column({ type: 'boolean', default: false })
  driving_license!: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  specialization!: string;

  @Column({ type: 'boolean', default: true })
  is_active!: boolean;

  @Column({ type: 'text', nullable: true })
  refresh_token!: string;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
