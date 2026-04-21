import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma';

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);

  constructor(private readonly prisma: PrismaService) {}

  async subscribe(userId: string, fcmToken: string) {
    this.logger.log(`subscribe userId=${userId}`);

    const prefs = await this.prisma.prefs.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });

    if (prefs.fcmTokens.includes(fcmToken)) {
      return { subscribed: true, tokensCount: prefs.fcmTokens.length };
    }

    const updated = await this.prisma.prefs.update({
      where: { userId },
      data: { fcmTokens: { push: fcmToken } },
    });

    return { subscribed: true, tokensCount: updated.fcmTokens.length };
  }

  async unsubscribe(userId: string, fcmToken?: string) {
    this.logger.log(`unsubscribe userId=${userId}`);

    const prefs = await this.prisma.prefs.findUnique({ where: { userId } });
    if (!prefs) return { unsubscribed: true, tokensCount: 0 };

    const nextTokens = fcmToken
      ? prefs.fcmTokens.filter((t) => t !== fcmToken)
      : [];

    const updated = await this.prisma.prefs.update({
      where: { userId },
      data: { fcmTokens: { set: nextTokens } },
    });

    return { unsubscribed: true, tokensCount: updated.fcmTokens.length };
  }
}
