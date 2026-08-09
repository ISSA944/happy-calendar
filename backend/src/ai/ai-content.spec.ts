import { dailyPackContentSchema, parseSupportContent } from './ai-content';

const shortPack = {
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

describe('short AI content contract', () => {
  it('accepts the restored compact daily pack', () => {
    expect(dailyPackContentSchema.parse(shortPack)).toEqual(shortPack);
  });

  it('rejects a third support sentence', () => {
    expect(() =>
      parseSupportContent(
        JSON.stringify({
          supportPhrase:
            'Ты уже справляешься с тем, что сейчас перед тобой. Сделай один спокойный шаг и не требуй от себя всего сразу. У тебя обязательно получится.',
        }),
      ),
    ).toThrow(/supportPhrase/);
  });

  it('rejects a main horoscope longer than 500 characters', () => {
    const tooLong = `${'Сегодня выбери один ясный ориентир и действуй без спешки. '.repeat(9)}Заверши день спокойно.`;
    expect(
      dailyPackContentSchema.safeParse({ ...shortPack, horoscope: tooLong })
        .success,
    ).toBe(false);
  });

  it('rejects a detailed horoscope longer than 850 characters', () => {
    const tooLong = `${'Марс помогает действовать увереннее, а Луна просит внимательнее относиться к собственным чувствам и не торопить решения. '.repeat(7)}Вечером восстанови силы.`;
    expect(
      dailyPackContentSchema.safeParse({
        ...shortPack,
        horoscopeDetailed: tooLong,
      }).success,
    ).toBe(false);
  });
});
