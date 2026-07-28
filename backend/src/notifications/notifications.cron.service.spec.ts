jest.mock('../common/date.util', () => ({
  currentTimeInTz: jest.fn(),
}));

import { PrismaService } from '../prisma';
import { TodayService } from '../today/today.service';
import { WebPushService } from '../push/web-push.service';
import { HolidaysService } from '../holidays';
import { PersonalCareService } from '../personal-care';
import { currentTimeInTz } from '../common/date.util';
import { NotificationCronService } from './notifications.cron.service';

describe('NotificationCronService', () => {
  it('fires in the user timezone and records a notification only after a successful send', async () => {
    const findMany = jest.fn().mockResolvedValue([
      {
        userId: 'user-1',
        horoscopeEnabled: true,
        supportEnabled: false,
        holidaysEnabled: false,
        personalCareEnabled: false,
        horoscopeTime: '09:00',
        supportTime: '09:00',
        holidaysTime: '09:00',
        personalCareTime: '09:00',
        timezone: 'Asia/Qyzylorda',
        user: {
          webPushSubscriptions: [
            {
              endpoint: 'https://push.example/subscription',
              p256dh: 'key',
              auth: 'auth',
            },
          ],
        },
      },
    ]);
    let notificationInput: unknown;
    const create = (input: unknown) => {
      notificationInput = input;
      return Promise.resolve({ id: 'notification-1' });
    };
    const prisma = {
      prefs: { findMany },
      profile: {
        findUnique: jest.fn().mockResolvedValue({ currentMood: 'Нормально' }),
      },
      notification: { create },
    };
    const getTodayPack = jest.fn().mockResolvedValue({
      horoscope: { main: 'Сегодня хороший день.' },
      support: { text: 'Ты справишься.' },
    });
    const send = jest.fn().mockResolvedValue(true);
    (currentTimeInTz as jest.Mock).mockReturnValue('09:00');

    const service = new NotificationCronService(
      prisma as unknown as PrismaService,
      { getTodayPack } as unknown as TodayService,
      { send } as unknown as WebPushService,
      {} as HolidaysService,
      {} as PersonalCareService,
    );

    await service.handleCron();

    expect(currentTimeInTz).toHaveBeenCalledWith('Asia/Qyzylorda');
    expect(send).toHaveBeenCalledTimes(1);
    expect(notificationInput).toMatchObject({
      data: { status: 'sent', type: 'daily_horoscope' },
    });
  });
});
