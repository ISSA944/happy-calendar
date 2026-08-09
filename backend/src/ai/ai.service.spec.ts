import { ConfigService } from '@nestjs/config';
import { AiService } from './ai.service';

const context = {
  zodiacSign: 'Овен ♈︎',
  mood: 'Тревожна',
  gender: 'F',
  date: '10.08',
};

const validPack = {
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
};

function config(values: Record<string, string | undefined>) {
  return {
    get: jest.fn((key: string) => values[key]),
  } as unknown as ConfigService;
}

function completion(content: unknown) {
  return {
    choices: [{ message: { content: JSON.stringify(content) } }],
    usage: { total_tokens: 420 },
  };
}

describe('AiService', () => {
  it.each([
    'Овен ♈︎',
    'Телец ♉︎',
    'Близнецы ♊︎',
    'Рак ♋︎',
    'Лев ♌︎',
    'Дева ♍︎',
    'Весы ♎︎',
    'Скорпион ♏︎',
    'Стрелец ♐︎',
    'Козерог ♑︎',
    'Водолей ♒︎',
    'Рыбы ♓︎',
  ])('keeps the %s fallback substantive', async (zodiacSign) => {
    const service = new AiService(config({}));

    const pack = await service.generateDailyPack('user-1', {
      ...context,
      zodiacSign,
    });

    expect(pack.isFallback).toBe(true);
    expect(pack.horoscope.length).toBeGreaterThanOrEqual(160);
    expect(pack.horoscope.length).toBeLessThanOrEqual(500);
    expect(pack.horoscopeDetailed.length).toBeGreaterThanOrEqual(350);
    expect(pack.supportPhrase.length).toBeGreaterThanOrEqual(60);
    expect(pack.supportPhrase.length).toBeLessThanOrEqual(220);
  });

  it('uses the configured Workers AI endpoint, model and max_completion_tokens', async () => {
    const service = new AiService(
      config({
        AI_API_KEY: 'test-token',
        AI_BASE_URL:
          'https://api.cloudflare.com/client/v4/accounts/account/ai/v1',
        AI_MODEL: '@cf/openai/gpt-oss-120b',
      }),
    );
    const create = jest.fn().mockResolvedValue(completion(validPack));
    Object.defineProperty(service, 'openai', {
      value: { chat: { completions: { create } } },
    });

    const pack = await service.generateDailyPack('user-1', context);

    expect(pack.isFallback).toBeUndefined();
    expect(create).toHaveBeenCalledTimes(1);
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        model: '@cf/openai/gpt-oss-120b',
        reasoning_effort: 'low',
        max_completion_tokens: 1400,
      }),
    );
    expect((service as unknown as { baseURL?: string }).baseURL).toBe(
      'https://api.cloudflare.com/client/v4/accounts/account/ai/v1',
    );
  });

  it('accepts valid substantive JSON on the first attempt', async () => {
    const service = new AiService(
      config({ AI_API_KEY: 'test-token', AI_MODEL: 'test-model' }),
    );
    const create = jest.fn().mockResolvedValue(completion(validPack));
    Object.defineProperty(service, 'openai', {
      value: { chat: { completions: { create } } },
    });

    const pack = await service.generateDailyPack('user-1', context);

    expect(create).toHaveBeenCalledTimes(1);
    expect(pack.horoscope).toBe(validPack.horoscope);
    expect(pack.supportPhrase).toBe(validPack.supportPhrase);
  });

  it('retries malformed or too-short JSON exactly once', async () => {
    const service = new AiService(config({ AI_API_KEY: 'test-token' }));
    const create = jest
      .fn()
      .mockResolvedValueOnce(
        completion({ ...validPack, horoscope: 'Коротко.' }),
      )
      .mockResolvedValueOnce(completion(validPack));
    Object.defineProperty(service, 'openai', {
      value: { chat: { completions: { create } } },
    });

    const pack = await service.generateDailyPack('user-1', context);

    expect(create).toHaveBeenCalledTimes(2);
    expect(pack.isFallback).toBeUndefined();
  });

  it('does not retry a 403 and returns a substantive fallback', async () => {
    const service = new AiService(config({ AI_API_KEY: 'test-token' }));
    const forbidden = Object.assign(new Error('Forbidden'), { status: 403 });
    const create = jest.fn().mockRejectedValue(forbidden);
    Object.defineProperty(service, 'openai', {
      value: { chat: { completions: { create } } },
    });

    const pack = await service.generateDailyPack('user-1', context);

    expect(create).toHaveBeenCalledTimes(1);
    expect(pack.isFallback).toBe(true);
    expect(pack.horoscope.length).toBeGreaterThanOrEqual(160);
    expect(pack.horoscopeDetailed.length).toBeGreaterThanOrEqual(350);
    expect(pack.supportPhrase.length).toBeGreaterThanOrEqual(60);
    expect(pack.supportPhrase.length).toBeLessThanOrEqual(220);
  });

  it('keeps OPENAI_BASE_URL as a legacy fallback', () => {
    const service = new AiService(
      config({
        AI_API_KEY: 'test-token',
        OPENAI_BASE_URL: 'https://legacy.example/v1',
      }),
    );

    expect((service as unknown as { baseURL?: string }).baseURL).toBe(
      'https://legacy.example/v1',
    );
  });

  it('retries a short mood-support phrase once and returns substantive text', async () => {
    const service = new AiService(config({ AI_API_KEY: 'test-token' }));
    const create = jest
      .fn()
      .mockResolvedValueOnce(completion({ supportPhrase: 'Держись.' }))
      .mockResolvedValueOnce(
        completion({ supportPhrase: validPack.supportPhrase }),
      );
    Object.defineProperty(service, 'openai', {
      value: { chat: { completions: { create } } },
    });

    const result = await service.updateMoodSupport(
      'user-1',
      'Тревожна',
      'Овен ♈︎',
      'Анна',
      'F',
    );

    expect(create).toHaveBeenCalledTimes(2);
    expect(create).toHaveBeenLastCalledWith(
      expect.objectContaining({
        reasoning_effort: 'low',
        max_completion_tokens: 400,
      }),
    );
    expect(result).toEqual({ supportPhrase: validPack.supportPhrase });
  });

  it('generates five compact support phrases within the batch token budget', async () => {
    const service = new AiService(config({ AI_API_KEY: 'test-token' }));
    const create = jest.fn().mockResolvedValue(
      completion({
        p1: validPack.supportPhrase,
        p2: validPack.supportPhrase,
        p3: validPack.supportPhrase,
        p4: validPack.supportPhrase,
        p5: validPack.supportPhrase,
      }),
    );
    Object.defineProperty(service, 'openai', {
      value: { chat: { completions: { create } } },
    });

    const result = await service.generateSupportPhrasesBatch(
      'Тревожна',
      'Овен ♈︎',
      undefined,
      'Анна',
      'F',
    );

    expect(result.phrases).toHaveLength(5);
    expect(result.phrases.every((phrase) => phrase.length <= 220)).toBe(true);
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        reasoning_effort: 'low',
        max_completion_tokens: 1200,
      }),
    );
  });
});
