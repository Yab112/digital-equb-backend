import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  Column,
} from 'typeorm';
import { User } from '../../users/user.entity';
import { EqubGroup } from './equb-group.entity';
import { Transaction } from './transaction.entity';

@Entity('memberships')
export class Membership {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'int' })
  payoutOrder: number; // The order in which this member gets paid out

  @CreateDateColumn({ name: 'join_date' })
  joinDate: Date;

  // --- Relationships ---

  @ManyToOne(() => User, (user) => user.memberships, { eager: true })
  user: User;

  @ManyToOne(() => EqubGroup, (group) => group.memberships)
  group: EqubGroup;

  @OneToMany(() => Transaction, (transaction) => transaction.membership)
  transactions: Transaction[];
}
