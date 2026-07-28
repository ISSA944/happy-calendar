import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma';
import { TodayService } from '../today/today.service';
import { WebPushService } from '../push/web-push.service';
import { HolidaysService } from '../holidays';
import { PersonalCareService } from '../personal-care';
import { currentTimeInTz } from '../common/date.util';

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
    private readonly holidaysService: HolidaysService,
    private readonly personalCareService: PersonalCareService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handleCron() {
    // Юзер попадает в выборку, если хотя бы одна категория включена и есть хотя бы одна активная
    // push-подписка. Совпадение времени больше НЕ фильтруется в SQL (одного глобального "текущего
    // времени" не существует — у каждого юзера своя timezone, см. prefs.timezone), а считается
    // ниже в коде через currentTimeInTz() для каждого юзера по его таймзоне.
    const prefsList = await this.prisma.prefs.findMany({
      where: {
        user: { webPushSubscriptions: { some: {} } },
        OR: [
          { horoscopeEnabled: true },
          { supportEnabled: true },
          { holidaysEnabled: true },
          { personalCareEnabled: true },
        ],
      },
      select: {
        userId: true,
        horoscopeEnabled: true,
        supportEnabled: true,
        holidaysEnabled: true,
        personalCareEnabled: true,
        horoscopeTime: true,
        supportTime: true,
        holidaysTime: true,
        personalCareTime: true,
        timezone: true,
        user: { select: { webPushSubscriptions: true } },
      },
    });

    if (!prefsList.length) return;

    // Локальное HH:mm считаем один раз на уникальную таймзону за тик, а не заново на каждого юзера.
    const localTimeByTz = new Map<string, string>();
    const localTimeFor = (tz: string): string => {
      let time = localTimeByTz.get(tz);
      if (!time) {
        time = currentTimeInTz(tz);
        localTimeByTz.set(tz, time);
      }
      return time;
    };

    for (const prefs of prefsList) {
      try {
        const currentTime = localTimeFor(prefs.timezone);

        // Какие категории «стреляют» именно в эту минуту (в локальном времени юзера).
        const fireHoroscope =
          prefs.horoscopeEnabled && prefs.horoscopeTime === currentTime;
        const fireSupport =
          prefs.supportEnabled && prefs.supportTime === currentTime;
        const fireHolidays =
          prefs.holidaysEnabled && prefs.holidaysTime === currentTime;
        const firePersonalCare =
          prefs.personalCareEnabled && prefs.personalCareTime === currentTime;

        if (
          !fireHoroscope &&
          !fireSupport &&
          !fireHolidays &&
          !firePersonalCare
        )
          continue;

        const contents = await this.buildPushContents(prefs.userId, {
          fireHoroscope,
          fireSupport,
          fireHolidays,
          firePersonalCare,
        });

        if (!contents.length) {
          this.logger.log(
            `No firing push content for userId=${prefs.userId} at ${currentTime}`,
          );
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
                  type: content.type,
                  url: 'https://yoyojoy.online/home',
                },
              },
            );
            if (response) hasSuccessfulSend = true;
          }

          if (hasSuccessfulSend) {
            await this.prisma.notification.create({
              data: {
                userId: prefs.userId,
                type: content.type,
                status: 'sent',
                title: content.title,
                body: content.body,
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

  /**
   * Собирает контент только для «стреляющих» категорий. Тяжёлый getTodayPack (AI/кэш)
   * вызываем лишь если нужен гороскоп или поддержка.
   */
  private async buildPushContents(
    userId: string,
    fire: {
      fireHoroscope: boolean;
      fireSupport: boolean;
      fireHolidays: boolean;
      firePersonalCare: boolean;
    },
  ): Promise<PushContent[]> {
    const contents: PushContent[] = [];

    if (fire.fireHoroscope || fire.fireSupport) {
      const pack = await this.todayService.getTodayPack(userId);

      if (fire.fireHoroscope && pack.horoscope?.main) {
        contents.push({
          title: 'Твой гороскоп на сегодня',
          body: pack.horoscope.main,
          type: 'daily_horoscope',
        });
      }

      if (fire.fireSupport) {
        // Свежая фраза из пула, чтобы подряд идущие пуши отличались (как «Другая фраза»).
        const freshPhrase =
          await this.todayService.getNextSupportPhrase(userId);
        const text = freshPhrase ?? pack.support?.text;
        if (text)
          contents.push({
            title: 'Поддержка на сегодня',
            body: text,
            type: 'daily_support',
          });
      }
    }

    if (fire.fireHolidays) {
      const holidays = await this.holidaysService.getTodayHolidays(userId);
      if (holidays.length) {
        const extra = holidays.length - 1;
        const body =
          extra > 0 ? `${holidays[0].title} и ещё ${extra}` : holidays[0].title;
        contents.push({ title: 'Праздник дня', body, type: 'daily_holiday' });
      }
    }

    if (fire.firePersonalCare) {
      // При нескольких активных целях getToday() отдаёт карточку на каждую — в пуш идёт первая,
      // остальные упоминаются числом (сама детализация — в приложении, см. HolidaysTodayBlock).
      const [main, ...rest] = await this.personalCareService.getToday(userId);
      if (main) {
        const body =
          rest.length > 0
            ? `${main.affirmation} И ещё ${rest.length} по другим целям.`
            : main.affirmation;
        contents.push({ title: main.title, body, type: 'daily_personal_care' });
      }
    }

    return contents;
  }
}
