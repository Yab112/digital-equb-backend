import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { EqubGroupsModule } from './equb-groups/equb-groups.module';
import { TransactionsModule } from './transactions/transactions.module';
import * as redisStore from 'cache-manager-redis-store';
import { CommonModule } from './common/common.module';
import { User } from './users/user.entity';
import { CacheModule } from '@nestjs/cache-manager';

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
        // Use the single connection string from Neon
        url: configService.get<string>('DATABASE_URL'),

        // Neon requires an SSL connection
        ssl: {
          rejectUnauthorized: false, // Required for connections to cloud databases
        },

        entities: [User],
        synchronize: true, // Good for development, should be false in production
      }),
    }),

    CacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        store: redisStore,
        host: configService.get<string>('REDIS_HOST'),
        port: configService.get<number>('REDIS_PORT'),
        ttl: 300, // Default TTL for cache keys (in seconds) -> 5 minutes
      }),
      isGlobal: true, // Make CacheModule available globally
    }),

    AuthModule,
    UsersModule,
    EqubGroupsModule,
    TransactionsModule,
    CommonModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
