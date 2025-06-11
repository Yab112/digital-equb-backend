import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';
import { Membership } from './membership.entity';
import { Cycle } from './cycle.entity';

export enum TransactionStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed',
}

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({
    type: 'enum',
    enum: TransactionStatus,
    default: TransactionStatus.PENDING,
  })
  status: TransactionStatus;

  @CreateDateColumn({ name: 'transaction_date' })
  transactionDate: Date;

  // --- Relationships ---

  @ManyToOne(() => Membership, (membership) => membership.transactions)
  membership: Membership;

  @ManyToOne(() => Cycle, (cycle) => cycle.transactions)
  cycle: Cycle;
}
