import { PushController } from './push.controller';
import { PushService } from './push.service';
import { METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';

describe('PushController', () => {
  it('returns the configured browser VAPID public key', () => {
    const controller = new PushController({
      getPublicKey: () => ({ publicKey: 'public-vapid-key' }),
    } as PushService);

    expect(controller.publicKey()).toEqual({ publicKey: 'public-vapid-key' });
  });

  it('does not expose the removed test-push endpoint', () => {
    const routes = Object.getOwnPropertyNames(PushController.prototype)
      .filter((name) => name !== 'constructor')
      .map((name) => {
        const handler = PushController.prototype[name as keyof PushController];
        const method = Reflect.getMetadata(METHOD_METADATA, handler) as
          | number
          | undefined;
        const path = Reflect.getMetadata(PATH_METADATA, handler) as
          | string
          | undefined;
        return {
          method,
          path,
        };
      });

    expect(routes).not.toContainEqual({ method: 1, path: 'test' });
  });
});
