import { TodayController } from './today.controller';

describe('TodayController support pool', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-08-10T22:30:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('serves consecutive support phrases from the personal short-v2 Redis pool without AI', async () => {
    const todayService = {
      replaceSupportPhrase: jest.fn().mockResolvedValue(undefined),
    };
    const ai = {
      generateSupportPhrasesBatch: jest.fn(),
    };
    const prisma = {
      profile: {
        findUnique: jest.fn().mockResolvedValue({
          currentMood: 'Нормально',
          zodiacSign: 'Рак ♋︎',
          gender: 'F',
        }),
      },
      prefs: {
        findUnique: jest.fn().mockResolvedValue({ timezone: 'Asia/Almaty' }),
      },
      user: {
        findUnique: jest.fn().mockResolvedValue({ name: 'Анна' }),
      },
    };
    const redis = {
      rpop: jest
        .fn()
        .mockResolvedValueOnce('Первая короткая поддержка из Redis.')
        .mockResolvedValueOnce('Вторая короткая поддержка из Redis.'),
      llen: jest.fn().mockResolvedValue(5),
      lpush: jest.fn(),
    };
    const controller = new TodayController(
      todayService as never,
      ai as never,
      prisma as never,
      redis as never,
    );
    const user = { sub: 'user-1' } as never;

    await controller.nextSupport(user);
    await controller.nextSupport(user);

    const poolKey = 'support-pool:short-v2:user-1:Рак ♋︎:Нормально:2026-08-11';
    expect(redis.rpop).toHaveBeenNthCalledWith(1, poolKey);
    expect(redis.rpop).toHaveBeenNthCalledWith(2, poolKey);
    expect(ai.generateSupportPhrasesBatch).not.toHaveBeenCalled();
    expect(todayService.replaceSupportPhrase).toHaveBeenCalledTimes(2);
  });
});
