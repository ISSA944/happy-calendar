import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma';
import { FirebaseService } from '../firebase/firebase.service';
import { TodayService } from '../today/today.service';

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
        horoscopeEnabled: true,
        fcmTokens: {
          isEmpty: false,
        },
      },
      select: {
        userId: true,
        fcmTokens: true,
      },
    });

    if (!prefsList.length) {
      this.logger.log(`No push recipients for ${currentTime}`);
      return;
    }

    for (const prefs of prefsList) {
      try {
        const pack = await this.todayService.getTodayPack(prefs.userId);
        const title = 'Твой гороскоп на сегодня';
        const body = pack.horoscope.main;

        let hasSuccessfulSend = false;

        for (const token of prefs.fcmTokens) {
          const response = await this.firebaseService.sendPushNotification(
            token,
            title,
            body,
            {
              userId: prefs.userId,
              date: pack.date,
              type: 'daily_horoscope',
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
              type: 'daily_horoscope',
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
    const parts = new Intl.DateTimeFormat('ru-RU', {
      timeZone: 'Europe/Moscow',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(new Date());
    const h = parts.find((p) => p.type === 'hour')?.value ?? '00';
    const m = parts.find((p) => p.type === 'minute')?.value ?? '00';
    return `${h}:${m}`;
  }
}
