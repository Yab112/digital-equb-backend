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
import { ApiProperty } from '@nestjs/swagger';

@Entity('memberships')
export class Membership {
  @ApiProperty({ example: 'uuid', description: 'Membership ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 1, description: 'Payout order for this member' })
  @Column({ type: 'int' })
  payoutOrder: number; // The order in which this member gets paid out

  @ApiProperty({
    example: '2024-06-12T00:00:00.000Z',
    description: 'Join date',
  })
  @CreateDateColumn({ name: 'join_date' })
  joinDate: Date;

  // --- Relationships ---

  @ApiProperty({ type: () => User })
  @ManyToOne(() => User, (user) => user.memberships, { eager: true })
  user: User;

  @ApiProperty({ type: () => EqubGroup })
  @ManyToOne(() => EqubGroup, (group) => group.memberships)
  group: EqubGroup;

  @ApiProperty({ type: () => [Transaction] })
  @OneToMany(() => Transaction, (transaction) => transaction.membership)
  transactions: Transaction[];
}
