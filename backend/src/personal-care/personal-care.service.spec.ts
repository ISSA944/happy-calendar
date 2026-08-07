import { PrismaService } from '../prisma';
import { GoalsService } from '../goals';
import { WebPushService } from '../push/web-push.service';
import { PersonalCareService } from './personal-care.service';

describe('PersonalCareService', () => {
  it('returns no notification cards when the user has no active goals', async () => {
    const prisma = {
      prefs: {
        findUnique: jest.fn().mockResolvedValue({ timezone: 'Asia/Qyzylorda' }),
      },
      user: { findUnique: jest.fn().mockResolvedValue({ name: 'Ольга' }) },
      personalCareDay: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'care-day-1',
          dayOfYear: 220,
          title: 'Тихая самоподдержка',
          themeKey: 'calm',
          calmTask: 'Сделай паузу.',
          calmAdvice: 'Будь добра к себе.',
        }),
      },
      holidayImage: { findFirst: jest.fn().mockResolvedValue(null) },
      personalCareCompletion: { findMany: jest.fn().mockResolvedValue([]) },
    };
    const goals = { activeGoalIds: jest.fn().mockResolvedValue([]) };
    const service = new PersonalCareService(
      prisma as unknown as PrismaService,
      goals as unknown as GoalsService,
      {} as WebPushService,
    );
    const cards = await service.getToday('user-1', {
      fallbackWhenNoActiveGoals: false,
    });

    expect(cards).toEqual([]);
  });

  it('names the completed goal in its own milestone push', async () => {
    const milestone = {
      milestone: 7,
      emoji: '⭐',
      title: 'Семь дней заботы',
      body: '{имя}, ты держишь прекрасный ритм.',
    };
    let notificationInput: unknown;
    const prisma = {
      prefs: {
        findUnique: jest.fn().mockResolvedValue({ timezone: 'Asia/Qyzylorda' }),
      },
      user: { findUnique: jest.fn().mockResolvedValue({ name: 'Ольга' }) },
      personalCareDay: {
        findUnique: jest.fn().mockResolvedValue({ id: 'care-day-1' }),
      },
      personalCareCompletion: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: 'completion-1' }),
      },
      pushMilestoneTemplate: {
        findUnique: jest.fn().mockResolvedValue(milestone),
      },
      webPushSubscription: {
        findMany: jest.fn().mockResolvedValue([
          {
            endpoint: 'https://push.example/subscription',
            p256dh: 'key',
            auth: 'auth',
          },
        ]),
      },
      notification: {
        create: (input: unknown) => {
          notificationInput = input;
          return Promise.resolve({ id: 'notification-1' });
        },
      },
    };
    const goals = { progressFor: jest.fn().mockResolvedValue(7) };
    const send = jest.fn().mockResolvedValue(true);
    const service = new PersonalCareService(
      prisma as unknown as PrismaService,
      goals as unknown as GoalsService,
      { send } as unknown as WebPushService,
    );

    await service.complete('user-1', 'care-day-1', 'calm');

    expect(send).toHaveBeenCalledTimes(1);
    expect(send).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        title: '⭐ Семь дней заботы',
        body: 'Ольга, ты держишь прекрасный ритм. Цель: «Стать спокойнее».',
      }),
    );
    expect(notificationInput).toMatchObject({
      data: {
        type: 'goal_milestone',
        body: 'Ольга, ты держишь прекрасный ритм. Цель: «Стать спокойнее».',
      },
    });
  });
});
