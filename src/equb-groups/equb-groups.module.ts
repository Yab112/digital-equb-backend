import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EqubGroup } from './entities/equb-group.entity';
import { Membership } from './entities/membership.entity';
import { Cycle } from './entities/cycle.entity';
import { Transaction } from './entities/transaction.entity';
import { EqubGroupsService } from './equb-groups.service';
import { EqubGroupsController } from './equb-groups.controller';
import { UsersModule } from '../users/users.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [
    // This makes the repositories for our 4 new entities available to the EqubGroupsService
    TypeOrmModule.forFeature([EqubGroup, Membership, Cycle, Transaction]),

    // Import UsersModule to get access to the UsersService
    UsersModule,

    // Import CommonModule to get access to shared services like the Logger
    CommonModule,
  ],
  controllers: [EqubGroupsController],
  providers: [EqubGroupsService],
})
export class EqubGroupsModule {}
