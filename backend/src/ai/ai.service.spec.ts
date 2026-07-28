import { ConfigService } from '@nestjs/config';
import { AiService } from './ai.service';

const context = {
  zodiacSign: 'Овен ♈︎',
  mood: 'Нормально',
  gender: 'F',
  date: '28.07',
};

describe('AiService', () => {
  it('returns the safe fallback when no API key is configured', async () => {
    const config = { get: jest.fn().mockReturnValue(undefined) };
    const service = new AiService(config as unknown as ConfigService);

    const pack = await service.generateDailyPack('user-1', context);

    expect(pack.isFallback).toBe(true);
    expect(pack.horoscope).toBeTruthy();
    expect(pack.supportPhrase).toBeTruthy();
  });

  it('uses max_completion_tokens for a real daily-pack call', async () => {
    const config = { get: jest.fn().mockReturnValue(undefined) };
    const service = new AiService(config as unknown as ConfigService);
    let request: unknown;
    const create = (input: unknown) => {
      request = input;
      return Promise.resolve({
        choices: [
          {
            message: {
              content: JSON.stringify({
                horoscope: 'Прогноз',
                horoscopeDetailed: 'Подробный прогноз',
                advice: 'Совет',
                moon: 'Луна',
                aspect: 'Аспект',
                supportPhrase: 'Поддержка',
              }),
            },
          },
        ],
        usage: { total_tokens: 42 },
      });
    };
    Object.defineProperty(service, 'openai', {
      value: { chat: { completions: { create } } },
    });

    const pack = await service.generateDailyPack('user-1', context);
    const requestWithLimits = request as {
      max_completion_tokens?: number;
      max_tokens?: number;
    };

    expect(pack.isFallback).toBeUndefined();
    expect(requestWithLimits.max_completion_tokens).toBe(700);
    expect(requestWithLimits.max_tokens).toBeUndefined();
  });
});
