import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('tenants')
export class Tenant {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'name', type: 'varchar', length: 255, unique: true })
  name!: string;

  @Column({ name: 'address', type: 'text', nullable: true })
  address!: string;

  @Column({ name: 'phone', type: 'varchar', length: 50, nullable: true })
  phone!: string;

  @Column({ name: 'admin_name', type: 'varchar', length: 255 })
  adminName!: string;

  @Column({ name: 'admin_password', type: 'varchar', length: 255 })
  adminPassword!: string;

  @Column({ name: 'admin_email', type: 'varchar', length: 255, unique: true })
  adminEmail!: string;

  @Column({ name: 'plan', type: 'varchar', length: 255 })
  plan!: string;

  @Column({ name: 'database_name', type: 'varchar', length: 255, unique: true })
  databaseName!: string;

  @Column({ name: 'subscription_start_date', type: 'date' })
  subscriptionStartDate!: Date;

  @Column({ name: 'subscription_end_date', type: 'date' })
  subscriptionEndDate!: Date;
 @Column({
  type: 'decimal',
  precision: 10,
  scale: 2,
  nullable: true,
})
discount?: number;

  @Column({ name: 'industry', type: 'varchar', length: 100, nullable: true })
  industry!: string;
  @Column({ name: 'max_employees', type: 'int', default: 100 })
  maxEmployees!: number;

  @Column({ name: 'kvk_number', type: 'varchar', length: 50, nullable: true })
  kvkNumber!: string;

  @Column({ name: 'btw_number', type: 'varchar', length: 50, nullable: true })
  btwNumber!: string;

  @Column({ name: 'status', type: 'varchar', length: 50, default: 'active' })
  status!: string;

  @CreateDateColumn({ name: 'created_at' })
  created_at!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at!: Date;
}
