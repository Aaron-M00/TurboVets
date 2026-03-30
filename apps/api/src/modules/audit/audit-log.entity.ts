import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ name: 'user_email' })
  userEmail!: string;

  @Column()
  action!: string;

  @Column()
  resource!: string;

  @Column({ name: 'resource_id', type: 'uuid', nullable: true })
  resourceId!: string | null;

  @Index()
  @Column({ name: 'organization_id', type: 'uuid', nullable: true })
  organizationId!: string | null;

  @Column({ type: 'varchar', length: 16 })
  outcome!: 'allowed' | 'denied';

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
