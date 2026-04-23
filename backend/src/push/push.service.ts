import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma';

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);

  constructor(private readonly prisma: PrismaService) {}

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

    const nextTokens = Array.from(
      new Set([...prefs.fcmTokens, normalizedToken]),
    );
    const updated = await this.prisma.prefs.update({
      where: { userId },
      data: { fcmTokens: { set: nextTokens } },
    });

    return { subscribed: true, tokensCount: updated.fcmTokens.length };
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
