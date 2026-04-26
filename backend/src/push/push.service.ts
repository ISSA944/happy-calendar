import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma';
import { FirebaseService } from '../firebase/firebase.service';

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly firebase: FirebaseService,
  ) {}

  async subscribe(userId: string, fcmToken: string) {
    const normalizedToken = fcmToken.trim();
    this.logger.log(`subscribe userId=${userId}`);

    const prefs = await this.prisma.prefs.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });

    if (!normalizedToken) {
      return { subscribed: false, tokensCount: prefs.fcmTokens.length };
    }

    if (prefs.fcmTokens.includes(normalizedToken)) {
      return { subscribed: true, tokensCount: prefs.fcmTokens.length };
    }

    // Use $executeRaw for atomic append to prevent race condition when
    // two devices subscribe simultaneously (read-modify-write pattern).
    await this.prisma.$executeRaw`
      UPDATE prefs
      SET fcm_tokens = array_append(fcm_tokens, ${normalizedToken}::text)
      WHERE user_id = ${userId}::uuid
        AND NOT (fcm_tokens @> ARRAY[${normalizedToken}]::text[])
    `;
    const updated = await this.prisma.prefs.findUniqueOrThrow({ where: { userId } });

    return { subscribed: true, tokensCount: updated.fcmTokens.length };
  }

  async sendTestPush(userId: string) {
    const prefs = await this.prisma.prefs.findUnique({ where: { userId } });
    if (!prefs?.fcmTokens.length) {
      return { sent: 0, total: 0, reason: 'No FCM tokens registered' };
    }

    let sent = 0;
    for (const token of prefs.fcmTokens) {
      const result = await this.firebase.sendPushNotification(
        token,
        'Happy Calendar — тест 🌿',
        'Push-уведомления работают корректно!',
        { type: 'test' },
      );
      if (result) sent++;
    }

    return { sent, total: prefs.fcmTokens.length };
  }

  async unsubscribe(userId: string, fcmToken?: string) {
    const normalizedToken = fcmToken?.trim();
    this.logger.log(`unsubscribe userId=${userId}`);

    const prefs = await this.prisma.prefs.findUnique({ where: { userId } });
    if (!prefs) return { unsubscribed: true, tokensCount: 0 };

    const nextTokens = normalizedToken
      ? prefs.fcmTokens.filter((t) => t !== normalizedToken)
      : [];

    const updated = await this.prisma.prefs.update({
      where: { userId },
      data: { fcmTokens: { set: nextTokens } },
    });

    return { unsubscribed: true, tokensCount: updated.fcmTokens.length };
  }
}
