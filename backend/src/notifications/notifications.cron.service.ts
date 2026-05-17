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
        const content = this.buildPushContent(prefs, pack);

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

  private getCurrentTimeKey(): string {
    const now = new Date();
    const h = String(now.getUTCHours()).padStart(2, '0');
    const m = String(now.getUTCMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  }

  private buildPushContent(
    prefs: {
      holidaysEnabled: boolean;
      horoscopeEnabled: boolean;
      supportEnabled: boolean;
    },
    pack: Awaited<ReturnType<TodayService['getTodayPack']>>,
  ): PushContent | null {
    // Берёт первое законченное предложение (до . ! ?).
    // Если предложение длиннее max — обрезает по границе слова.
    const firstSentence = (text: string, max = 120): string => {
      const end = text.search(/[.!?]/);
      if (end > 0 && end + 1 <= max) return text.slice(0, end + 1);
      if (text.length <= max) return text;
      const cut = text.slice(0, max);
      const lastSpace = cut.lastIndexOf(' ');
      return (lastSpace > 20 ? cut.slice(0, lastSpace) : cut) + '…';
    };

    const parts: string[] = [];

    if (prefs.holidaysEnabled && pack.holiday?.title) {
      parts.push(`Праздник: ${pack.holiday.title}`);
    }
    if (prefs.horoscopeEnabled && pack.horoscope?.main) {
      parts.push(`Гороскоп: ${firstSentence(pack.horoscope.main)}`);
    }
    if (prefs.supportEnabled && pack.support?.text) {
      parts.push(`Поддержка: ${firstSentence(pack.support.text)}`);
    }

    if (parts.length === 0) return null;

    // Один тип — специфичный заголовок, полный текст
    if (parts.length === 1) {
      if (prefs.holidaysEnabled && pack.holiday?.title) {
        return { title: 'Праздник дня', body: pack.holiday.title, type: 'daily_holiday' };
      }
      if (prefs.horoscopeEnabled && pack.horoscope?.main) {
        return { title: 'Твой гороскоп на сегодня', body: pack.horoscope.main, type: 'daily_horoscope' };
      }
      if (prefs.supportEnabled && pack.support?.text) {
        return { title: 'Поддержка на сегодня', body: pack.support.text, type: 'daily_support' };
      }
    }

    // Несколько типов — комбо с метками
    return {
      title: 'YoYoJoy Day',
      body: parts.join('\n'),
      type: 'daily_combined',
    };
  }
}
