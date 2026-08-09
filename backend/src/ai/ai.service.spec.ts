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
    'Сегодня важно не торопить события и сначала понять, куда действительно хочется направить силы. Разговор, который давно откладывался, даст больше ясности, если говорить спокойно и без попытки всё решить за другого человека. Вечером оставь время для простого дела, которое возвращает ощущение опоры и собственного ритма.',
  horoscopeDetailed:
    'Марс, покровитель Овна, сегодня усиливает желание действовать быстро, но лунная энергия просит сначала проверить внутренний мотив. В рабочих вопросах полезно выбрать одну приоритетную задачу и довести её до ясного промежуточного результата. В отношениях прямота сработает лучше, если добавить к ней внимание к чувствам собеседника. Неожиданная идея может оказаться ценной, однако ей потребуется практичный план. После обеда темп стоит немного снизить, чтобы заметить детали и не принять усталость за потерю интереса. Вечер подходит для спокойного подведения итогов и решения, что действительно заслуживает твоей энергии завтра.',
  advice:
    'Перед важным ответом сделай короткую паузу и сформулируй для себя желаемый результат разговора. Затем выбери один конкретный шаг, который можно завершить сегодня без лишнего давления.',
  moon: 'Лунная энергия делает чувства заметнее, поэтому честная пауза поможет отличить тревогу от настоящего предчувствия.',
  aspect:
    'Мягкий аспект Марса и Сатурна поддерживает последовательные действия, если не пытаться получить весь результат сразу.',
  supportPhrase:
    'Тревога сейчас может говорить громко, но она не определяет ни тебя, ни исход этого дня. Сначала верни телу ощущение безопасности: выдохни, почувствуй опору под ногами и назови одну вещь, которая уже под контролем. Тебе не нужно решать всё сразу — достаточно следующего бережного шага.',
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
    expect(pack.horoscope.length).toBeGreaterThanOrEqual(240);
    expect(pack.horoscopeDetailed.length).toBeGreaterThanOrEqual(520);
    expect(pack.supportPhrase.length).toBeGreaterThanOrEqual(220);
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
        max_completion_tokens: 3000,
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
    expect(pack.horoscope.length).toBeGreaterThanOrEqual(240);
    expect(pack.horoscopeDetailed.length).toBeGreaterThanOrEqual(520);
    expect(pack.supportPhrase.length).toBeGreaterThanOrEqual(220);
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
        max_completion_tokens: 800,
      }),
    );
    expect(result).toEqual({ supportPhrase: validPack.supportPhrase });
  });
});
