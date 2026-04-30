import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const redisUrl = this.config.get<string>('REDIS_URL');
    if (!redisUrl) {
      this.logger.warn('REDIS_URL not set — AI pack caching disabled (no Redis)');
      return;
    }
    this.client = new Redis(redisUrl, { lazyConnect: false, maxRetriesPerRequest: 2 });
    this.client.on('connect', () => this.logger.log('Redis connected'));
    this.client.on('error', (err: Error) => this.logger.error('Redis error', err.message));
  }

  async onModuleDestroy() {
    await this.client?.quit();
  }

  async get(key: string): Promise<string | null> {
    try {
      return await this.client?.get(key) ?? null;
    } catch {
      return null;
    }
  }

  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    try {
      await this.client?.set(key, value, 'EX', ttlSeconds);
    } catch {
      // Cache write failure is non-fatal
    }
  }

  /**
   * Tries to acquire a distributed lock (SET NX EX).
   * Returns true if lock acquired, false if already held by another request.
   * Fails open (returns true) if Redis is unavailable — AI call proceeds.
   */
  async acquireLock(key: string, ttlSeconds: number): Promise<boolean> {
    try {
      const result = await this.client?.set(key, '1', 'EX', ttlSeconds, 'NX');
      return result === 'OK';
    } catch {
      return true; // Redis down — fail open, let the request proceed
    }
  }

  async releaseLock(key: string): Promise<void> {
    try {
      await this.client?.del(key);
    } catch {
      // TTL will clean it up automatically
    }
  }
}
