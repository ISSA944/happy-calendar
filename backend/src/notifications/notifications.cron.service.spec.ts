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
            {
              endpoint: 'https://push.example/second-device',
              p256dh: 'second-key',
              auth: 'second-auth',
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
    expect(send).toHaveBeenCalledTimes(2);
    expect(notificationInput).toMatchObject({
      data: { status: 'sent', type: 'daily_horoscope' },
    });
  });

  it('does not record notification history when every device send fails', async () => {
    const create = jest.fn();
    const prisma = {
      prefs: {
        findMany: jest.fn().mockResolvedValue([
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
        ]),
      },
      profile: { findUnique: jest.fn().mockResolvedValue(null) },
      notification: { create },
    };
    (currentTimeInTz as jest.Mock).mockReturnValue('09:00');
    const service = new NotificationCronService(
      prisma as unknown as PrismaService,
      {
        getTodayPack: jest.fn().mockResolvedValue({
          horoscope: { main: 'Сегодня хороший день.' },
        }),
      } as unknown as TodayService,
      { send: jest.fn().mockResolvedValue(false) } as unknown as WebPushService,
      {} as HolidaysService,
      {} as PersonalCareService,
    );

    await service.handleCron();

    expect(create).not.toHaveBeenCalled();
  });

  it('sends a separate personal-care notification for every active goal', async () => {
    const prisma = {
      prefs: {
        findMany: jest.fn().mockResolvedValue([
          {
            userId: 'user-1',
            horoscopeEnabled: false,
            supportEnabled: false,
            holidaysEnabled: false,
            personalCareEnabled: true,
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
        ]),
      },
      profile: {
        findUnique: jest.fn().mockResolvedValue({ currentMood: 'Нормально' }),
      },
      notification: {
        create: jest.fn().mockResolvedValue({ id: 'notification-1' }),
      },
    };
    const sentPayloads: Array<{ title: string; body: string }> = [];
    const send = (
      _subscription: unknown,
      payload: { title: string; body: string },
    ) => {
      sentPayloads.push(payload);
      return Promise.resolve(true);
    };
    (currentTimeInTz as jest.Mock).mockReturnValue('09:00');

    const service = new NotificationCronService(
      prisma as unknown as PrismaService,
      {} as TodayService,
      { send } as unknown as WebPushService,
      {} as HolidaysService,
      {
        getToday: jest.fn().mockResolvedValue([
          { title: 'Тихая самоподдержка', affirmation: 'Будь добра к себе.' },
          { title: 'День нежности к телу', affirmation: 'Дай телу отдохнуть.' },
        ]),
      } as unknown as PersonalCareService,
    );

    await service.handleCron();

    expect(sentPayloads.map(({ title, body }) => ({ title, body }))).toEqual([
      { title: 'Тихая самоподдержка', body: 'Будь добра к себе.' },
      { title: 'День нежности к телу', body: 'Дай телу отдохнуть.' },
    ]);
    expect(prisma.notification.create).toHaveBeenCalledTimes(2);
  });

  it('skips personal-care goals that are already completed today', async () => {
    const prisma = {
      prefs: {
        findMany: jest.fn().mockResolvedValue([
          {
            userId: 'user-1',
            horoscopeEnabled: false,
            supportEnabled: false,
            holidaysEnabled: false,
            personalCareEnabled: true,
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
        ]),
      },
      profile: {
        findUnique: jest.fn().mockResolvedValue({ currentMood: 'Нормально' }),
      },
      notification: {
        create: jest.fn().mockResolvedValue({ id: 'notification-1' }),
      },
    };
    const send = jest.fn().mockResolvedValue(true);
    (currentTimeInTz as jest.Mock).mockReturnValue('09:00');

    const service = new NotificationCronService(
      prisma as unknown as PrismaService,
      {} as TodayService,
      { send } as unknown as WebPushService,
      {} as HolidaysService,
      {
        getToday: jest.fn().mockResolvedValue([
          {
            title: 'Тихая самоподдержка',
            affirmation: 'Будь добра к себе.',
            doneToday: true,
          },
          {
            title: 'День нежности к телу',
            affirmation: 'Дай телу отдохнуть.',
            doneToday: false,
          },
        ]),
      } as unknown as PersonalCareService,
    );

    await service.handleCron();

    expect(send).toHaveBeenCalledTimes(1);
    expect(send).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        title: 'День нежности к телу',
        body: 'Дай телу отдохнуть.',
      }),
    );
    expect(prisma.notification.create).toHaveBeenCalledTimes(1);
  });

  it('sends every holiday as a separate notification without a counter', async () => {
    const prisma = {
      prefs: {
        findMany: jest.fn().mockResolvedValue([
          {
            userId: 'user-1',
            horoscopeEnabled: false,
            supportEnabled: false,
            holidaysEnabled: true,
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
        ]),
      },
      profile: {
        findUnique: jest.fn().mockResolvedValue({ currentMood: 'Нормально' }),
      },
      notification: {
        create: jest.fn().mockResolvedValue({ id: 'notification-1' }),
      },
    };
    const sentPayloads: Array<{ title: string; body: string }> = [];
    const send = jest.fn(
      (_subscription: unknown, payload: { title: string; body: string }) => {
        sentPayloads.push(payload);
        return Promise.resolve(true);
      },
    );
    (currentTimeInTz as jest.Mock).mockReturnValue('09:00');

    const service = new NotificationCronService(
      prisma as unknown as PrismaService,
      {} as TodayService,
      { send } as unknown as WebPushService,
      {
        getTodayHolidays: jest
          .fn()
          .mockResolvedValue([
            { title: 'День добрых встреч' },
            { title: 'Праздник тёплых слов' },
          ]),
      } as unknown as HolidaysService,
      {} as PersonalCareService,
    );

    await service.handleCron();

    expect(sentPayloads.map(({ title, body }) => ({ title, body }))).toEqual([
      { title: 'Праздник дня', body: 'День добрых встреч' },
      { title: 'Праздник дня', body: 'Праздник тёплых слов' },
    ]);
    expect(prisma.notification.create).toHaveBeenCalledTimes(2);
  });
});
