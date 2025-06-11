import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
} from 'typeorm';
import { EqubGroup } from './equb-group.entity';
import { User } from '../../users/user.entity';
import { Transaction } from './transaction.entity';

@Entity('cycles')
export class Cycle {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'cycle_number' })
  cycleNumber: number;

  @Column({ name: 'start_date', type: 'timestamp' })
  startDate: Date;

  @Column({ name: 'end_date', type: 'timestamp' })
  endDate: Date;

  @Column({ default: 'active' })
  status: 'active' | 'completed';

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // --- Relationships ---

  @ManyToOne(() => EqubGroup, (group) => group.cycles)
  group: EqubGroup;

  @ManyToOne(() => User)
  payoutRecipient: User;

  @OneToMany(() => Transaction, (transaction) => transaction.cycle)
  transactions: Transaction[];
}
