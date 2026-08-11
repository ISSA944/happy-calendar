import { PushController } from './push.controller';
import { PushService } from './push.service';

describe('PushController', () => {
  it('returns the configured browser VAPID public key', () => {
    const controller = new PushController({
      getPublicKey: () => ({ publicKey: 'public-vapid-key' }),
    } as PushService);

    expect(controller.publicKey()).toEqual({ publicKey: 'public-vapid-key' });
  });
});
