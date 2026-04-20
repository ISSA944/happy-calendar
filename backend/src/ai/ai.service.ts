import { Injectable, Logger } from '@nestjs/common';

/** Структура дневного пакета, возвращаемого AI */
export interface AiDailyPack {
  horoscope: string;
  horoscopeDetailed: string;
  advice: string;
  moon: string;
  aspect: string;
  holiday: string | null;
  supportPhrase: string;
}

/** Контекст для генерации пакета */
export interface PromptContext {
  zodiacSign: string;
  mood: string;
  gender: string;
  date: string;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  // ─── Mock horoscope bank ───
  private readonly horoscopes: Record<string, { main: string; detailed: string; advice: string; moon: string; aspect: string }> = {
    'Овен ♈︎': {
      main: 'Сегодня день решительных действий. Ваша энергия на пике — используйте её для важных начинаний.',
      detailed: 'Марс активно влияет на ваш знак, придавая мощную внутреннюю силу. Не бойтесь брать инициативу.',
      advice: 'Действуйте смело, но избегайте конфликтов — сила в спокойствии.',
      moon: 'Растущая Луна усиливает вашу интуицию.',
      aspect: 'Марс в тригоне с Юпитером — удача на вашей стороне.',
    },
    'Телец ♉︎': {
      main: 'Финансовые вопросы выходят на первый план. Присмотритесь к новым возможностям.',
      detailed: 'Венера благоволит стабильности. Сегодня хороший день для долгосрочных инвестиций и планирования.',
      advice: 'Не торопитесь с крупными тратами — подождите пару дней.',
      moon: 'Луна в вашем знаке — время самозаботы.',
      aspect: 'Венера секстиль Сатурн — надёжность во всём.',
    },
    'Близнецы ♊︎': {
      main: 'Коммуникация — ваш главный инструмент сегодня. Важный разговор может изменить всё.',
      detailed: 'Меркурий усиливает ваше красноречие. Используйте слова как мост к новым возможностям.',
      advice: 'Слушайте больше, чем говорите — так вы узнаете главное.',
      moon: 'Луна в воздушном знаке — лёгкость в общении.',
      aspect: 'Меркурий конъюнкция Солнце — ясность мысли.',
    },
  };

  // ─── Mock support phrases ───
  private readonly supportPhrases: Record<string, string[]> = {
    'Спокойное': [
      'Ты на правильном пути. Каждый шаг имеет значение.',
      'Сегодня прекрасный день, чтобы просто быть собой.',
      'Спокойствие — это суперсила. Ты уже победил.',
      'Тишина внутри — лучший советчик.',
    ],
    'Радостное': [
      'Твоя радость заразительна! Делись ею с миром.',
      'Когда сердце поёт — весь мир танцует.',
      'Запомни этот момент. Ты создаёшь счастье прямо сейчас.',
      'Улыбка — твой лучший аксессуар сегодня.',
    ],
    'Грустное': [
      'Грусть — это не слабость. Это глубина твоей души.',
      'После дождя всегда выходит солнце. Подожди немного.',
      'Ты сильнее, чем думаешь. Это пройдёт.',
      'Разреши себе чувствовать — это нормально и важно.',
    ],
    'Тревожное': [
      'Вдохни глубоко. Ты в безопасности прямо сейчас.',
      'Тревога лжёт. Реальность добрее, чем кажется.',
      'Шаг за шагом. Не нужно решать всё сразу.',
      'Ты справлялся раньше — справишься и сейчас.',
    ],
    'Энергичное': [
      'Направь эту энергию в созидание — результат удивит!',
      'Мир не успевает за тобой сегодня. Вперёд!',
      'Энергия — это дар. Используй его мудро.',
      'Сегодня ты можешь свернуть горы. Какую выберешь?',
    ],
  };

  // ─── Mock holidays ───
  private readonly holidays: Record<string, { name: string; description: string; icon: string }> = {
    '01.01': { name: 'Новый год', description: 'С Новым годом! Пусть этот год принесёт счастье.', icon: 'celebration' },
    '08.03': { name: 'Международный женский день', description: 'Поздравляем всех женщин!', icon: 'favorite' },
    '14.02': { name: 'День святого Валентина', description: 'День любви и нежности.', icon: 'favorite' },
    '09.05': { name: 'День Победы', description: 'Помним и гордимся.', icon: 'military_tech' },
    '31.12': { name: 'Канун Нового года', description: 'Время подводить итоги и мечтать!', icon: 'celebration' },
  };

  /**
   * Генерирует полный дневной пакет.
   * В продакшене — вызов LLM (OpenAI / Anthropic).
   * Сейчас — mock с имитацией задержки 2-3 сек.
   */
  async generateDailyPack(
    userId: string,
    context: PromptContext,
  ): Promise<AiDailyPack> {
    this.logger.log(`[MOCK] generateDailyPack for user=${userId}, sign=${context.zodiacSign}, mood=${context.mood}`);

    // Имитация задержки LLM (2000–3000ms)
    const delay = 2000 + Math.floor(Math.random() * 1000);
    await new Promise((resolve) => setTimeout(resolve, delay));

    // Выбираем гороскоп по знаку (или дефолт)
    const horoscope = this.horoscopes[context.zodiacSign] ?? {
      main: 'Звёзды сегодня благосклонны к вам. Доверьтесь интуиции и действуйте.',
      detailed: 'Планеты выстраиваются в гармоничную конфигурацию. Это отличное время для самоанализа.',
      advice: 'Будьте открыты новому — неожиданные возможности уже рядом.',
      moon: 'Луна в нейтральной фазе — стабильный эмоциональный фон.',
      aspect: 'Благоприятное расположение планет для личного роста.',
    };

    // Выбираем фразу поддержки по настроению
    const phrases = this.supportPhrases[context.mood] ?? this.supportPhrases['Спокойное'];
    const supportPhrase = phrases[Math.floor(Math.random() * phrases.length)];

    // Проверяем праздник
    const holiday = this.holidays[context.date] ?? null;

    this.logger.log(`[MOCK] generateDailyPack done in ${delay}ms`);

    return {
      horoscope: horoscope.main,
      horoscopeDetailed: horoscope.detailed,
      advice: horoscope.advice,
      moon: horoscope.moon,
      aspect: horoscope.aspect,
      holiday: holiday?.name ?? null,
      supportPhrase,
    };
  }

  /**
   * Обновляет только фразу поддержки при смене настроения.
   * В продакшене — быстрый LLM-запрос.
   * Сейчас — mock с задержкой 800–1500ms.
   */
  async updateMoodSupport(
    userId: string,
    newMood: string,
  ): Promise<{ supportPhrase: string }> {
    this.logger.log(`[MOCK] updateMoodSupport for user=${userId}, mood=${newMood}`);

    // Имитация задержки (более короткая, т.к. запрос проще)
    const delay = 800 + Math.floor(Math.random() * 700);
    await new Promise((resolve) => setTimeout(resolve, delay));

    const phrases = this.supportPhrases[newMood] ?? this.supportPhrases['Спокойное'];
    const supportPhrase = phrases[Math.floor(Math.random() * phrases.length)];

    this.logger.log(`[MOCK] updateMoodSupport done in ${delay}ms`);

    return { supportPhrase };
  }
}
