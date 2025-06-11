import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
} from 'typeorm';
import { User } from '../../users/user.entity';
import { Membership } from './membership.entity';
import { Cycle } from './cycle.entity';

export enum EqubFrequency {
  WEEKLY = 'weekly',
  BI_WEEKLY = 'bi-weekly',
  MONTHLY = 'monthly',
}

export enum EqubStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  COMPLETED = 'completed',
}

@Entity('equb_groups')
export class EqubGroup {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  contributionAmount: number;

  @Column({ type: 'enum', enum: EqubFrequency, default: EqubFrequency.MONTHLY })
  frequency: EqubFrequency;

  @Column({ type: 'enum', enum: EqubStatus, default: EqubStatus.PENDING })
  status: EqubStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // --- Relationships ---

  @ManyToOne(() => User, (user) => user.ownedEqubs)
  owner: User;

  @OneToMany(() => Membership, (membership) => membership.group)
  memberships: Membership[];

  @OneToMany(() => Cycle, (cycle) => cycle.group)
  cycles: Cycle[];
}
