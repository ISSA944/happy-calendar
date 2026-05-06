import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import webpush from 'web-push';
import { PrismaService } from '../prisma';

export type WebPushPayload = {
  title: string;
  body: string;
  data?: Record<string, string | number | boolean>;
};

type BrowserPushSubscription = {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
};

@Injectable()
export class WebPushService {
  private readonly logger = new Logger(WebPushService.name);
  private readonly isConfigured: boolean;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const publicKey = this.configService.get<string>('WEB_PUSH_PUBLIC_KEY');
    const privateKey = this.configService.get<string>('WEB_PUSH_PRIVATE_KEY');
    const subject = this.configService.get<string>('WEB_PUSH_SUBJECT');

    this.isConfigured = Boolean(publicKey && privateKey);

    if (this.isConfigured) {
      webpush.setVapidDetails(subject ?? 'mailto:support@yoyojoy.online', publicKey!, privateKey!);
    } else {
      this.logger.warn('WEB_PUSH_PUBLIC_KEY/WEB_PUSH_PRIVATE_KEY missing; Web Push fallback disabled.');
    }
  }

  async subscribe(userId: string, subscription: BrowserPushSubscription, userAgent?: string) {
    if (!subscription.endpoint || !subscription.keys?.p256dh || !subscription.keys?.auth) {
      return { subscribed: false, reason: 'invalid-subscription' };
    }

    const saved = await this.prisma.webPushSubscription.upsert({
      where: { endpoint: subscription.endpoint },
      update: {
        userId,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        userAgent,
      },
      create: {
        userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        userAgent,
      },
    });

    return { subscribed: true, id: saved.id };
  }

  async unsubscribe(userId: string, endpoint?: string) {
    if (endpoint) {
      await this.prisma.webPushSubscription.deleteMany({
        where: { userId, endpoint },
      });
      return { unsubscribed: true };
    }

    await this.prisma.webPushSubscription.deleteMany({ where: { userId } });
    return { unsubscribed: true };
  }

  async send(subscription: BrowserPushSubscription, payload: WebPushPayload) {
    if (!this.isConfigured) return false;

    try {
      await webpush.sendNotification(
        subscription,
        JSON.stringify({
          source: 'web-push',
          title: payload.title,
          body: payload.body,
          data: payload.data ?? {},
        }),
      );
      return true;
    } catch (error) {
      this.logger.error('Error sending Web Push notification', error);
      return false;
    }
  }
}
