import { ConfigService } from '@nestjs/config';
import { RedisService } from './redis.service';

describe('owned Redis locks', () => {
  it('does not delete a lock replaced by a different owner after expiry', async () => {
    const redis = new RedisService({
      get: () => undefined,
    } as unknown as ConfigService);
    let value = 'new-owner';
    const client = {
      eval: jest.fn(
        (_script: string, _keys: number, _key: string, owner: string) => {
          if (value === owner) {
            value = '';
            return Promise.resolve(1);
          }
          return Promise.resolve(0);
        },
      ),
    };
    Object.assign(redis, { client });
    await redis.releaseOwnedLock('pool', 'old-owner');
    expect(value).toBe('new-owner');
    expect(client.eval).toHaveBeenCalledWith(
      expect.stringContaining("redis.call('get'"),
      1,
      'pool',
      'old-owner',
    );
  });

  it('explicitly reports unavailable Redis without pretending to hold a distributed lock', async () => {
    const redis = new RedisService({
      get: () => undefined,
    } as unknown as ConfigService);
    expect(await redis.acquireOwnedLock('pool', 'owner', 50)).toBe(
      'unavailable',
    );
  });
});
