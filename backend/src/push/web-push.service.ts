import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import webpush from 'web-push';
import { PrismaService } from '../prisma';

export type WebPushPayload = {
  title: string;
  body: string;
  data?: Record<string, string | number | boolean>;
};

export type BrowserPushSubscription = {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
};

type WebPushError = {
  statusCode?: number;
  message?: string;
  body?: unknown;
  headers?: unknown;
};

function asWebPushError(error: unknown): WebPushError {
  return typeof error === 'object' && error !== null ? error : {};
}

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
      webpush.setVapidDetails(
        subject ?? 'mailto:support@yoyojoy.online',
        publicKey!,
        privateKey!,
      );
    } else {
      this.logger.warn(
        'WEB_PUSH_PUBLIC_KEY/WEB_PUSH_PRIVATE_KEY missing; Web Push fallback disabled.',
      );
    }
  }

  async subscribe(
    userId: string,
    subscription: BrowserPushSubscription,
    userAgent?: string,
  ) {
    if (
      !subscription.endpoint ||
      !subscription.keys?.p256dh ||
      !subscription.keys?.auth
    ) {
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
      this.logger.log(
        `Web Push sent OK (title="${payload.title}", endpoint=...${subscription.endpoint.slice(-40)})`,
      );
      return true;
    } catch (error: unknown) {
      const pushError = asWebPushError(error);
      const statusCode = pushError.statusCode;
      if (statusCode === 410 || statusCode === 404) {
        this.logger.warn(
          `Dead push subscription (${statusCode}), removing: ${subscription.endpoint.slice(0, 60)}...`,
        );
        await this.prisma.webPushSubscription
          .deleteMany({
            where: { endpoint: subscription.endpoint },
          })
          .catch(() => {});
      } else {
        this.logger.error(
          `Web Push failed (status=${statusCode ?? 'n/a'}, endpoint=...${subscription.endpoint.slice(-40)}): ${pushError.message ?? String(error)}`,
          JSON.stringify({ body: pushError.body, headers: pushError.headers }),
        );
      }
      return false;
    }
  }
}
