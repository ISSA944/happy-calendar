import { Injectable, Logger } from '@nestjs/common';
import {
  WebPushService,
  type BrowserPushSubscription,
} from './web-push.service';

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);

  constructor(private readonly webPush: WebPushService) {}

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
   * Unsubscribes a user from push notifications.
   */
  async unsubscribe(userId: string, endpoint?: string) {
    this.logger.log(`unsubscribe userId=${userId}`);
    return this.webPush.unsubscribe(userId, endpoint);
  }
}
