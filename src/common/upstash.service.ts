import { Injectable, Logger } from '@nestjs/common';
import { Redis } from '@upstash/redis';

@Injectable()
export class UpstashService {
  private readonly logger = new Logger('UpstashService');
  public readonly redis: Redis;

  constructor() {
    this.redis = Redis.fromEnv();
    if (!this.redis) {
      this.logger.error('Failed to initialize Redis client!');
    } else {
      this.logger.log('Redis client initialized');
    }
  }

  async set(
    key: string,
    value: string,
    options?: { ex?: number },
  ): Promise<unknown> {
    this.logger.log(
      `Setting key: ${key} with value: ${value} (expires in: ${options?.ex || 'no expiry'})`,
    );
    let result;
    if (options?.ex) {
      result = await this.redis.set(key, value, { ex: options.ex });
    } else {
      result = await this.redis.set(key, value);
    }
    this.logger.log(`Redis SET result: ${JSON.stringify(result)}`);
    return result;
  }

  async get(key: string): Promise<unknown> {
    this.logger.log(`Getting key: ${key}`);
    const value = await this.redis.get(key);
    this.logger.log(`Redis GET result for key "${key}": ${value}`);
    return value;
  }

  async del(key: string): Promise<unknown> {
    this.logger.log(`Deleting key: ${key}`);
    const result = await this.redis.del(key);
    this.logger.log(`Redis DEL result: ${result}`);
    return result;
  }
}
