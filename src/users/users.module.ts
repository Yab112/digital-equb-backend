import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { User } from './user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]), // Register the User entity here
  ],
  providers: [UsersService], // We will add UsersService later
  exports: [UsersService], // We will export UsersService later
})
export class UsersModule {}
