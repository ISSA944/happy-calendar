import { TodayController } from './today.controller';

describe('TodayController support pool', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-08-10T22:30:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it.each(['busy', 'fallback', 'slow'])(
    'bounds %s refill without saving temporary support to PostgreSQL',
    async (mode) => {
      const values = new Map<string, string>();
      const ai = {
        generateSupportPhrasesBatch: jest
          .fn()
          .mockImplementation(() =>
            mode === 'slow'
              ? new Promise((resolve) =>
                  setTimeout(
                    () => resolve({ phrases: ['late'], isFallback: true }),
                    12_000,
                  ),
                )
              : Promise.resolve({ phrases: ['temporary'], isFallback: true }),
          ),
      };
      const prisma = {
        profile: {
          findUnique: jest.fn().mockResolvedValue({ currentMood: 'Нормально' }),
        },
        prefs: { findUnique: jest.fn().mockResolvedValue({ timezone: 'UTC' }) },
        user: { findUnique: jest.fn().mockResolvedValue({ name: 'Test' }) },
      };
      const redis = {
        get: jest.fn((key: string) => Promise.resolve(values.get(key) ?? null)),
        set: jest.fn((key: string, value: string) => {
          values.set(key, value);
          return Promise.resolve();
        }),
        rpop: jest.fn().mockResolvedValue(null),
        llen: jest.fn().mockResolvedValue(0),
        lpush: jest.fn(),
        acquireOwnedLock: jest
          .fn()
          .mockResolvedValue(mode === 'busy' ? 'busy' : 'acquired'),
        releaseOwnedLock: jest.fn(),
      };
      const today = { replaceSupportPhrase: jest.fn() };
      const controller = new TodayController(
        today as never,
        ai as never,
        prisma as never,
        redis as never,
      );
      const request = controller.nextSupport({ sub: 'u' } as never);
      await jest.advanceTimersByTimeAsync(8001);
      expect((await request).support.text.length).toBeGreaterThan(0);
      expect(today.replaceSupportPhrase).not.toHaveBeenCalled();
      if (mode === 'busy')
        expect(ai.generateSupportPhrasesBatch).not.toHaveBeenCalled();
      if (mode === 'fallback') {
        await controller.nextSupport({ sub: 'u' } as never);
        expect(ai.generateSupportPhrasesBatch).toHaveBeenCalledTimes(1);
        expect(redis.set).toHaveBeenCalledWith(
          expect.stringContaining('fallback:support-pool:short-v2:'),
          expect.any(String),
          300,
        );
      }
      await jest.advanceTimersByTimeAsync(5000);
      if (mode !== 'busy')
        expect(redis.releaseOwnedLock).toHaveBeenCalledTimes(1);
    },
  );

  it('generates one batch for concurrent empty-pool requests and serves different phrases', async () => {
    const phrases: string[] = [];
    let complete!: (value: { phrases: string[] }) => void;
    const ai = {
      generateSupportPhrasesBatch: jest.fn(
        () =>
          new Promise((resolve) => {
            complete = resolve;
          }),
      ),
    };
    const prisma = {
      profile: {
        findUnique: jest
          .fn()
          .mockResolvedValue({ currentMood: 'Нормально', zodiacSign: 'Рак' }),
      },
      prefs: { findUnique: jest.fn().mockResolvedValue({ timezone: 'UTC' }) },
      user: { findUnique: jest.fn().mockResolvedValue({ name: 'Тест' }) },
    };
    const redis = {
      rpop: jest.fn(() => Promise.resolve(phrases.shift() ?? null)),
      llen: jest.fn(() => Promise.resolve(phrases.length)),
      lpush: jest.fn((_key: string, batch: string[]) => {
        phrases.push(...batch);
        return Promise.resolve();
      }),
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn(),
      acquireOwnedLock: jest.fn().mockResolvedValue('acquired'),
      releaseOwnedLock: jest.fn(),
    };
    const today = {
      replaceSupportPhrase: jest.fn().mockResolvedValue(undefined),
    };
    const controller = new TodayController(
      today as never,
      ai as never,
      prisma as never,
      redis as never,
    );
    const requests = [
      controller.nextSupport({ sub: 'u' } as never),
      controller.nextSupport({ sub: 'u' } as never),
    ];
    await jest.advanceTimersByTimeAsync(0);
    expect(ai.generateSupportPhrasesBatch).toHaveBeenCalledTimes(1);
    complete({ phrases: ['one', 'two', 'three', 'four', 'five'] });
    const results = await Promise.all(requests);
    expect(results.map((result) => result.support.text)).toEqual([
      'one',
      'two',
    ]);
    expect(today.replaceSupportPhrase).toHaveBeenCalledTimes(2);
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
