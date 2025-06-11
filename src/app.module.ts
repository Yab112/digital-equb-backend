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

        entities: [User],
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

    AuthModule,
    UsersModule,
    EqubGroupsModule,
    CommonModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
