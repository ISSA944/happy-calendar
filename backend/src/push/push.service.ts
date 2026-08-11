import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma';
import {
  WebPushService,
  type BrowserPushSubscription,
} from './web-push.service';

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly webPush: WebPushService,
  ) {}

  getPublicKey() {
    return { publicKey: this.webPush.getPublicKey() };
  }

  /**
   * Subscribes a user to push notifications using Web Push.
   */
  async subscribe(
    userId: string,
    subscription: BrowserPushSubscription,
    userAgent?: string,
  ) {
    this.logger.log(`subscribe userId=${userId}`);
    return this.webPush.subscribe(userId, subscription, userAgent);
  }

  /**
   * Sends a test push notification to all active web push subscriptions of a user.
   */
  async sendTestPush(userId: string) {
    const webSubscriptions = await this.prisma.webPushSubscription.findMany({
      where: { userId },
    });

    const total = webSubscriptions.length;

    if (!total) {
      return {
        sent: 0,
        total: 0,
        reason: 'No push subscriptions registered',
      };
    }

    let webPushSent = 0;
    for (const subscription of webSubscriptions) {
      const result = await this.webPush.send(
        {
          endpoint: subscription.endpoint,
          keys: { p256dh: subscription.p256dh, auth: subscription.auth },
        },
        {
          title: 'YoYoJoy Day — тест 🌿',
          body: 'Push-уведомления работают корректно!',
          data: { type: 'test', url: 'https://yoyojoy.online/home' },
        },
      );
      if (result) webPushSent++;
    }

    return {
      sent: webPushSent,
      total,
      webPush: { sent: webPushSent, total },
    };
  }

  /**
   * Unsubscribes a user from push notifications.
   */
  async unsubscribe(userId: string, endpoint?: string) {
    this.logger.log(`unsubscribe userId=${userId}`);
    return this.webPush.unsubscribe(userId, endpoint);
  }
}
