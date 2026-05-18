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
        const contents = this.buildPushContents(prefs, pack);

        if (!contents.length) {
          this.logger.log(`No enabled push content for userId=${prefs.userId}`);
          continue;
        }

        const profile = await this.prisma.profile.findUnique({
          where: { userId: prefs.userId },
          select: { currentMood: true },
        });

        for (const content of contents) {
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
        }
      } catch (error) {
        this.logger.error(
          `Failed to send scheduled push for userId=${prefs.userId}`,
          error,
        );
      }
    }
  }

  private getCurrentTimeKey(): string {
    const now = new Date();
    const h = String(now.getUTCHours()).padStart(2, '0');
    const m = String(now.getUTCMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  }

  private buildPushContents(
    prefs: {
      holidaysEnabled: boolean;
      horoscopeEnabled: boolean;
      supportEnabled: boolean;
    },
    pack: Awaited<ReturnType<TodayService['getTodayPack']>>,
  ): PushContent[] {
    const contents: PushContent[] = [];

    if (prefs.holidaysEnabled && pack.holiday?.title) {
      contents.push({
        title: 'Праздник дня',
        body: pack.holiday.title,
        type: 'daily_holiday',
      });
    }

    if (prefs.horoscopeEnabled && pack.horoscope?.main) {
      contents.push({
        title: 'Твой гороскоп на сегодня',
        body: pack.horoscope.main,
        type: 'daily_horoscope',
      });
    }

    if (prefs.supportEnabled && pack.support?.text) {
      contents.push({
        title: 'Поддержка на сегодня',
        body: pack.support.text,
        type: 'daily_support',
      });
    }

    return contents;
  }
}
