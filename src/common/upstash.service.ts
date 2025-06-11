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
    value: string | object,
    options?: { ex?: number },
  ): Promise<unknown> {
    this.logger.log(
      `Setting key: ${key} with value: ${JSON.stringify(value)} (expires in: ${options?.ex || 'no expiry'})`,
    );
    if (key.startsWith('otp:') && typeof value !== 'string') {
      this.logger.error(
        `OTP value for key ${key} is not a string! Value: ${JSON.stringify(value)}`,
      );
      throw new Error(`OTP value for key ${key} must be a string.`);
    }
    const storeValue =
      typeof value === 'string' ? value : JSON.stringify(value);
    let result;
    if (options?.ex) {
      type SetOptions = Parameters<Redis['set']>[2];
      result = await this.redis.set(key, storeValue, {
        ex: options.ex,
      } as SetOptions);
    } else {
      result = await this.redis.set(key, storeValue);
    }
    this.logger.log(`Redis SET result: ${JSON.stringify(result)}`);
    return result;
  }

  async get<T = string | number | object>(key: string): Promise<T | null> {
    this.logger.log(`Getting key: ${key}`);
    const value = await this.redis.get(key);
    this.logger.log(
      `Redis GET result for key "${key}": ${JSON.stringify(value)} (type: ${typeof value})`,
    );
    return value as T | null;
  }

  async del(key: string): Promise<unknown> {
    this.logger.log(`Deleting key: ${key}`);
    const result = await this.redis.del(key);
    this.logger.log(`Redis DEL result: ${result}`);
    return result;
  }
}
