import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma';
import { FirebaseService } from '../firebase/firebase.service';
import { TodayService } from '../today/today.service';

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
    private readonly firebaseService: FirebaseService,
    private readonly todayService: TodayService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handleCron() {
    const currentTime = this.getCurrentTimeKey();
    this.logger.log(`Push CRON tick: ${currentTime}`);

    const prefsList = await this.prisma.prefs.findMany({
      where: {
        pushTime: currentTime,
        OR: [
          { holidaysEnabled: true },
          { horoscopeEnabled: true },
          { supportEnabled: true },
        ],
        fcmTokens: {
          isEmpty: false,
        },
      },
      select: {
        userId: true,
        fcmTokens: true,
        horoscopeEnabled: true,
        holidaysEnabled: true,
        supportEnabled: true,
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

        for (const token of prefs.fcmTokens) {
          const response = await this.firebaseService.sendPushNotification(
            token,
            content.title,
            content.body,
            {
              userId: prefs.userId,
              date: pack.date,
              type: content.type,
              url: 'https://yoyojoy.online/home',
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
