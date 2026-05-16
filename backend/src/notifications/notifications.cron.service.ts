import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma';
import { TodayService } from '../today/today.service';
import { WebPushService } from '../push/web-push.service';

type PushContent = {
  title: string;
  body: string;
  type: string;
};

@Injectable()
export class NotificationCronService {
  private readonly logger = new Logger(NotificationCronService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly todayService: TodayService,
    private readonly webPushService: WebPushService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handleCron() {
    const currentTime = this.getCurrentTimeKey();
    this.logger.log(`Push CRON tick: ${currentTime}`);

    const prefsList = await this.prisma.prefs.findMany({
      where: {
        pushTime: currentTime,
        AND: [
          {
            OR: [
              { holidaysEnabled: true },
              { horoscopeEnabled: true },
              { supportEnabled: true },
            ],
          },
          {
            user: { webPushSubscriptions: { some: {} } },
          },
        ],
      },
      select: {
        userId: true,
        horoscopeEnabled: true,
        holidaysEnabled: true,
        supportEnabled: true,
        user: {
          select: {
            webPushSubscriptions: true,
          },
        },
      },
    });

    if (!prefsList.length) {
      this.logger.log(`No push recipients for ${currentTime}`);
      return;
    }

    for (const prefs of prefsList) {
      try {
        const pack = await this.todayService.getTodayPack(prefs.userId);
        const content = this.selectPushContent(prefs, pack);

        if (!content) {
          this.logger.log(`No enabled push content for userId=${prefs.userId}`);
          continue;
        }

        let hasSuccessfulSend = false;

        for (const subscription of prefs.user.webPushSubscriptions) {
          const response = await this.webPushService.send(
            {
              endpoint: subscription.endpoint,
              keys: { p256dh: subscription.p256dh, auth: subscription.auth },
            },
            {
              title: content.title,
              body: content.body,
              data: {
                userId: prefs.userId,
                date: pack.date,
                type: content.type,
                url: 'https://yoyojoy.online/home',
              },
            },
          );

          if (response) {
            hasSuccessfulSend = true;
          }
        }

        if (hasSuccessfulSend) {
          const profile = await this.prisma.profile.findUnique({
            where: { userId: prefs.userId },
            select: { currentMood: true },
          });

          await this.prisma.notification.create({
            data: {
              userId: prefs.userId,
              type: content.type,
              status: 'sent',
              title: content.title,
              body: content.body,
              date: pack.date,
              mood: profile?.currentMood ?? null,
            },
          });
        }
      } catch (error) {
        this.logger.error(
          `Failed to send scheduled push for userId=${prefs.userId}`,
          error,
        );
      }
    }
  }

  /**
   * Once a day at 03:00 UTC: deletes stale push subscriptions that haven't been
   * updated in 60 days. Most browsers expire push subscriptions silently —
   * without this CRON, dead endpoints accumulate forever and waste CPU on every
   * push tick.
   */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async cleanupDeadSubscriptions() {
    const cutoff = new Date(Date.now() - 60 * 24 * 60 * 60_000);
    try {
      const result = await this.prisma.webPushSubscription.deleteMany({
        where: { updatedAt: { lt: cutoff } },
      });
      this.logger.log(`Cleaned up ${result.count} stale push subscriptions (>60 days old)`);
    } catch (error) {
      this.logger.error('Failed to clean stale push subscriptions', error);
    }
  }

  private getCurrentTimeKey(): string {
    const now = new Date();
    const h = String(now.getUTCHours()).padStart(2, '0');
    const m = String(now.getUTCMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  }

  private selectPushContent(
    prefs: {
      holidaysEnabled: boolean;
      horoscopeEnabled: boolean;
      supportEnabled: boolean;
    },
    pack: Awaited<ReturnType<TodayService['getTodayPack']>>,
  ): PushContent | null {
    if (prefs.holidaysEnabled && pack.holiday?.title) {
      return {
        title: 'Праздник дня',
        body: pack.holiday.title,
        type: 'daily_holiday',
      };
    }

    if (prefs.horoscopeEnabled) {
      return {
        title: 'Твой гороскоп на сегодня',
        body: pack.horoscope.main,
        type: 'daily_horoscope',
      };
    }

    if (prefs.supportEnabled) {
      return {
        title: 'Поддержка на сегодня',
        body: pack.support.text,
        type: 'daily_support',
      };
    }

    return null;
  }
}
