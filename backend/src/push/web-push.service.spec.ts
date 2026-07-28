import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma';
import { WebPushService } from './web-push.service';

describe('WebPushService', () => {
  it('upserts by endpoint so a repeated subscription does not create duplicates', async () => {
    let upsertInput: unknown;
    const upsert = (input: unknown) => {
      upsertInput = input;
      return Promise.resolve({ id: 'subscription-1' });
    };
    const prisma = {
      webPushSubscription: { upsert },
    };
    const config = { get: jest.fn().mockReturnValue(undefined) };
    const service = new WebPushService(
      config as unknown as ConfigService,
      prisma as unknown as PrismaService,
    );
    const subscription = {
      endpoint: 'https://push.example/subscription',
      keys: { p256dh: 'public-key', auth: 'auth-key' },
    };

    await service.subscribe('user-1', subscription);
    await service.subscribe('user-1', subscription);

    expect(upsertInput).toMatchObject({
      where: { endpoint: subscription.endpoint },
      update: { userId: 'user-1' },
    });
  });
});
