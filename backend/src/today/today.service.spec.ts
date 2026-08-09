import { TodayService } from './today.service';

function createDependencies(options?: { fallback?: boolean }) {
  const persistedDailyFeedDates: string[] = [];
  const persistDailyFeed = (input: {
    create: { date: string };
  }): Promise<unknown> => {
    persistedDailyFeedDates.push(input.create.date);
    return Promise.resolve(undefined);
  };
  const prisma = {
    prefs: {
      findUnique: jest.fn().mockResolvedValue({ timezone: 'Asia/Almaty' }),
    },
    profile: {
      findUnique: jest.fn().mockResolvedValue({
        zodiacSign: 'Овен ♈︎',
        currentMood: 'Нормально',
        gender: 'F',
      }),
    },
    user: {
      findUnique: jest.fn().mockResolvedValue({ name: 'Тест' }),
    },
    dailyFeed: {
      findUnique: jest.fn().mockResolvedValue(null),
      delete: jest.fn(),
      upsert: jest.fn(persistDailyFeed),
      updateMany: jest.fn(),
    },
    horoscope: {
      upsert: jest.fn().mockResolvedValue({
        id: 'horoscope-1',
        main: 'Основной прогноз',
        detailed: 'Подробный прогноз',
        advice: 'Совет',
        moon: 'Луна',
        aspect: 'Аспект',
      }),
    },
    supportPhrase: {
      create: jest
        .fn()
        .mockResolvedValue({ id: 'support-1', text: 'Поддержка' }),
    },
    holiday: {
      upsert: jest
        .fn()
        .mockResolvedValue({ id: 'holiday-1', title: 'Праздник' }),
    },
  };
  const pack = {
    horoscope: 'Основной прогноз',
    horoscopeDetailed: 'Подробный прогноз',
    advice: 'Совет',
    moon: 'Луна',
    aspect: 'Аспект',
    supportPhrase: 'Поддержка',
    holiday: 'Праздник',
    ...(options?.fallback ? { isFallback: true } : {}),
  };
  const ai = { generateDailyPack: jest.fn().mockResolvedValue(pack) };
  const redis = {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue(undefined),
    acquireLock: jest.fn().mockResolvedValue(true),
    releaseLock: jest.fn().mockResolvedValue(undefined),
    rpop: jest.fn(),
    lpush: jest.fn(),
  };
  return { prisma, ai, redis, persistedDailyFeedDates };
}

describe('TodayService', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-08-10T22:30:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('caches fallback in Redis for 300 seconds but never persists it', async () => {
    const { prisma, ai, redis } = createDependencies({ fallback: true });
    const service = new TodayService(
      prisma as never,
      ai as never,
      redis as never,
    );

    const response = await service.getTodayPack('user-1');

    expect(redis.set).toHaveBeenCalledWith(
      expect.stringContaining('2026-08-11'),
      expect.any(String),
      300,
    );
    expect(prisma.horoscope.upsert).not.toHaveBeenCalled();
    expect(prisma.supportPhrase.create).not.toHaveBeenCalled();
    expect(prisma.dailyFeed.upsert).not.toHaveBeenCalled();
    expect(response.meta).toEqual({
      contentSource: 'fallback',
      retryAfterSeconds: 300,
    });
    expect(response.date).toBe('11.08');
  });

  it('persists successful AI output under an ISO date key', async () => {
    const { prisma, ai, redis } = createDependencies();
    const service = new TodayService(
      prisma as never,
      ai as never,
      redis as never,
    );

    const response = await service.getTodayPack('user-1');

    expect(prisma.horoscope.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          date_zodiacSign: { date: '2026-08-11', zodiacSign: 'Овен ♈︎' },
        },
      }),
    );
    expect(prisma.dailyFeed.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId_date: { userId: 'user-1', date: '2026-08-11' } },
      }),
    );
    expect(redis.set).toHaveBeenCalledWith(
      expect.stringContaining('2026-08-11'),
      expect.any(String),
      129_600,
    );
    expect(ai.generateDailyPack).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({ date: '2026-08-11', holidayDate: '11.08' }),
    );
    expect(response.meta).toEqual({ contentSource: 'ai' });
  });

  it('returns an ISO-keyed existing feed as stored content', async () => {
    const { prisma, ai, redis } = createDependencies();
    prisma.dailyFeed.findUnique.mockResolvedValue({
      horoscope: {
        zodiacSign: 'Овен ♈︎',
        main: 'Сохранённый прогноз',
        detailed: 'Сохранённый подробный прогноз',
        advice: 'Совет',
        moon: 'Луна',
        aspect: 'Аспект',
      },
      supportPhrase: { text: 'Сохранённая поддержка' },
      holiday: null,
    });
    const service = new TodayService(
      prisma as never,
      ai as never,
      redis as never,
    );

    const response = await service.getTodayPack('user-1');

    expect(prisma.dailyFeed.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId_date: { userId: 'user-1', date: '2026-08-11' } },
      }),
    );
    expect(ai.generateDailyPack).not.toHaveBeenCalled();
    expect(response.meta).toEqual({ contentSource: 'stored' });
  });

  it('uses different persistent keys for the same calendar day in another year', async () => {
    const first = createDependencies();
    const firstService = new TodayService(
      first.prisma as never,
      first.ai as never,
      first.redis as never,
    );
    await firstService.getTodayPack('user-1');

    jest.setSystemTime(new Date('2027-08-10T22:30:00.000Z'));
    const second = createDependencies();
    const secondService = new TodayService(
      second.prisma as never,
      second.ai as never,
      second.redis as never,
    );
    await secondService.getTodayPack('user-1');

    expect(first.persistedDailyFeedDates).toEqual(['2026-08-11']);
    expect(second.persistedDailyFeedDates).toEqual(['2027-08-11']);
  });
});
