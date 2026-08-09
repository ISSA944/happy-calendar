import { TodayService } from './today.service';

const compactPack = {
  horoscope:
    'Сегодня не распыляй силы: выбери одно дело, которое действительно двигает тебя вперёд. Спокойный разговор поможет прояснить ожидания и сохранить энергию для важного. Вечером отметь небольшой результат и дай себе время восстановиться.',
  horoscopeDetailed:
    'Марс поддерживает решительность Овна, но сегодня особенно важно направить её в одну понятную задачу. Лунная энергия усиливает чувствительность к чужим словам, поэтому полезно отделять факты от первой эмоциональной реакции. В отношениях честность сработает лучше давления, если дать собеседнику время ответить. Вечер подходит для спокойного подведения итогов и выбора главного шага на завтра.',
  advice:
    'Запиши один результат, который реально получить сегодня, и начни с самого простого действия.',
  moon: 'Лунная энергия делает чувства заметнее и помогает честно увидеть свою главную потребность.',
  aspect:
    'Мягкий аспект Марса и Сатурна поддерживает последовательные действия без лишней спешки.',
  supportPhrase:
    'Тревога может звучать громко, но она не определяет тебя и этот день. Верни себе опору одним спокойным вдохом и выбери ближайший бережный шаг.',
  holiday: 'Праздник',
};

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
        main: compactPack.horoscope,
        detailed: compactPack.horoscopeDetailed,
        advice: compactPack.advice,
        moon: compactPack.moon,
        aspect: compactPack.aspect,
      }),
    },
    supportPhrase: {
      create: jest.fn().mockResolvedValue({
        id: 'support-1',
        text: compactPack.supportPhrase,
      }),
    },
    holiday: {
      upsert: jest
        .fn()
        .mockResolvedValue({ id: 'holiday-1', title: 'Праздник' }),
    },
  };
  const pack = {
    ...compactPack,
    ...(options?.fallback ? { isFallback: true } : {}),
  };
  const ai = {
    generateDailyPack: jest.fn().mockResolvedValue(pack),
    generateSupportPhrasesBatch: jest.fn().mockResolvedValue({
      phrases: [
        compactPack.supportPhrase,
        compactPack.supportPhrase,
        compactPack.supportPhrase,
        compactPack.supportPhrase,
        compactPack.supportPhrase,
      ],
    }),
  };
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
      'pack:short-v2:user-1:Овен ♈︎:Нормально:2026-08-11',
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
        main: compactPack.horoscope,
        detailed: compactPack.horoscopeDetailed,
        advice: compactPack.advice,
        moon: compactPack.moon,
        aspect: compactPack.aspect,
      },
      supportPhrase: { text: compactPack.supportPhrase },
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

  it('rebuilds a stored feed that violates the compact content contract', async () => {
    const { prisma, ai, redis } = createDependencies();
    prisma.dailyFeed.findUnique.mockResolvedValue({
      horoscope: {
        zodiacSign: 'Овен ♈︎',
        main: 'Слишком коротко.',
        detailed: 'Слишком коротко.',
        advice: 'Совет.',
        moon: 'Луна.',
        aspect: 'Аспект.',
      },
      supportPhrase: {
        text: 'Первая длинная мысль. Вторая длинная мысль. Третья лишняя мысль.',
      },
      holiday: null,
    });
    const service = new TodayService(
      prisma as never,
      ai as never,
      redis as never,
    );

    const response = await service.getTodayPack('user-1');

    expect(prisma.dailyFeed.delete).toHaveBeenCalledWith({
      where: { userId_date: { userId: 'user-1', date: '2026-08-11' } },
    });
    expect(ai.generateDailyPack).toHaveBeenCalledTimes(1);
    expect(prisma.horoscope.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: {
          main: compactPack.horoscope,
          detailed: compactPack.horoscopeDetailed,
          advice: compactPack.advice,
          moon: compactPack.moon,
          aspect: compactPack.aspect,
        },
      }),
    );
    expect(response.meta).toEqual({ contentSource: 'ai' });
  });

  it('uses the personal short-v2 support pool and stores four remaining phrases for 24 hours', async () => {
    const { prisma, ai, redis } = createDependencies();
    redis.rpop.mockResolvedValue(null);
    const service = new TodayService(
      prisma as never,
      ai as never,
      redis as never,
    );

    const phrase = await service.getNextSupportPhrase('user-1');

    const poolKey = 'support-pool:short-v2:user-1:Овен ♈︎:Нормально:2026-08-11';
    expect(redis.rpop).toHaveBeenCalledWith(poolKey);
    expect(redis.lpush).toHaveBeenCalledWith(
      poolKey,
      expect.arrayContaining([compactPack.supportPhrase]),
      86_400,
    );
    expect(phrase).toBe(compactPack.supportPhrase);
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
