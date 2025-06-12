import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { EqubGroupsModule } from './equb-groups/equb-groups.module';
import * as redisStore from 'cache-manager-redis-store';
import { CommonModule } from './common/common.module';
import { User } from './users/user.entity';
import { CacheModule } from '@nestjs/cache-manager';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { EqubGroup } from './equb-groups/entities/equb-group.entity';
import { Membership } from './equb-groups/entities/membership.entity';
import { Cycle } from './equb-groups/entities/cycle.entity';
import { Transaction } from './equb-groups/entities/transaction.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get<string>('DATABASE_URL'),

        ssl: {
          rejectUnauthorized: false,
        },

        entities: [User, EqubGroup, Membership, Cycle, Transaction],
        synchronize: true,
      }),
    }),

    CacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        store: redisStore,
        url: configService.get<string>('REDIS_URL'),
        ttl: 300, // Default TTL for cache keys (in seconds) -> 5 minutes
      }),
      isGlobal: true, // Make CacheModule available globally
    }),

    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 20,
      },
    ]),

    AuthModule,
    UsersModule,
    EqubGroupsModule,
    CommonModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
