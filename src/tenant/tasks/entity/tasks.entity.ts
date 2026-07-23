import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('tasks')
export class Tasks {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column({ length: 255 })
  taskName!: string;

  @Column({ length: 255 })
  projectName!: string;

  @Column({ type: 'text', nullable: true })
  taskDescription!: string;

 @Column({ type: 'date' })
startWork!: string;

@Column({ type: 'date' })
endWork!: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  assigned_at!: Date;

  @Column({ length: 255, nullable: true })
  city!: string;

  @Column({ length: 50, nullable: true })
  postal_code!: string;

  @Column({ length: 50, nullable: true })
  house_number!: string;

  @Column({ type: 'time', nullable: true })
  worker_arrival_time!: string;

  @Column({ length: 255, nullable: true })
  task_type!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  work_area!: number;

  @Column({ length: 100, nullable: true })
  bus_number!: string;

  @Column({ length: 255, nullable: true })
  driver_name!: string;

  @Column({
    type: 'enum',
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
  })
  priority!: string;

  @Column({
    type: 'enum',
    enum: ['todo', 'in_progress', 'review', 'done'],
    default: 'todo',
  })
  status!: string;
  @Column({ type: 'json', nullable: true })
  images!: string[];
  @Column({ type: 'boolean', default: true })
  is_active!: boolean;

  @CreateDateColumn({ type: 'timestamp' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at!: Date;
}
