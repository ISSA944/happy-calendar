import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { resolveHoliday } from './holidays.data';
import {
  parseDailyPackContent,
  parseSupportContent,
  stripHtml,
} from './ai-content';

const DEFAULT_AI_MODEL = '@cf/openai/gpt-oss-120b';
const RETRY_DELAY_MS = 750;

/** Структура дневного пакета, возвращаемого AI */
export interface AiDailyPack {
  horoscope: string;
  horoscopeDetailed: string;
  advice: string;
  moon: string;
  aspect: string;
  holiday: string | null;
  supportPhrase: string;
  isFallback?: boolean;
}

export interface AiSupportBatch {
  phrases: string[];
  isFallback?: boolean;
}

/** Контекст для генерации пакета */
export interface PromptContext {
  zodiacSign: string;
  mood: string;
  gender: string;
  date: string;
  holidayDate?: string;
  name?: string;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly openai: OpenAI | null;
  private readonly model: string;
  private readonly baseURL?: string;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('AI_API_KEY');
    this.baseURL =
      this.config.get<string>('AI_BASE_URL') ??
      this.config.get<string>('OPENAI_BASE_URL');
    this.model = this.config.get<string>('AI_MODEL') ?? DEFAULT_AI_MODEL;
    this.openai = apiKey
      ? new OpenAI({
          apiKey,
          timeout: 20_000,
          maxRetries: 0, // AiService owns the one retry; no hidden SDK multiplication.
          ...(this.baseURL ? { baseURL: this.baseURL } : {}),
        })
      : null;
    if (!this.openai) {
      this.logger.warn('AI_API_KEY not set — running in mock fallback mode');
    }
  }

  // ─── Mock horoscope bank (Fallback Policy) — all 12 signs ────────────────
  private readonly horoscopes: Record<
    string,
    {
      main: string;
      detailed: string;
      advice: string;
      moon: string;
      aspect: string;
    }
  > = {
    'Овен ♈︎': {
      main: 'Сегодня день решительных действий. Ваша энергия на пике — используйте её для важных начинаний.',
      detailed:
        'Марс активно влияет на ваш знак, придавая мощную внутреннюю силу. Планеты поддерживают смелые решения и новые старты. Не бойтесь брать инициативу в свои руки.',
      advice: 'Действуйте смело, но избегайте конфликтов — сила в спокойствии.',
      moon: 'Растущая Луна усиливает вашу интуицию и напор.',
      aspect: 'Марс в тригоне с Юпитером — удача на вашей стороне.',
    },
    'Телец ♉︎': {
      main: 'Финансовые вопросы выходят на первый план. Присмотритесь к новым возможностям для стабильности.',
      detailed:
        'Венера благоволит стабильности и накоплению. Сегодня хороший день для долгосрочных инвестиций, планирования и заботы о комфорте. Доверяйте своей интуиции в вопросах материального.',
      advice: 'Не торопитесь с крупными тратами — взвесьте всё дважды.',
      moon: 'Луна в вашем знаке — время самозаботы и отдыха.',
      aspect: 'Венера секстиль Сатурн — надёжность и стабильность во всём.',
    },
    'Близнецы ♊︎': {
      main: 'Коммуникация — ваш главный инструмент сегодня. Важный разговор может изменить всё.',
      detailed:
        'Меркурий усиливает ваше красноречие и любознательность. Используйте слова как мост к новым возможностям. Сегодня особенно продуктивны переговоры и обмен идеями.',
      advice: 'Слушайте больше, чем говорите — так вы узнаете самое важное.',
      moon: 'Луна в воздушном знаке дарит лёгкость в общении.',
      aspect: 'Меркурий конъюнкция Солнце — ясность мысли и красноречие.',
    },
    'Рак ♋︎': {
      main: 'Сегодня особенно важны близкие отношения и домашний уют. Прислушайтесь к своему сердцу.',
      detailed:
        'Луна — ваш покровитель — усиливает эмоциональную чуткость. Это время для глубоких разговоров с близкими, для заботы и принятия. Не закрывайтесь от тех, кто нуждается в вас.',
      advice: 'Позвольте себе быть уязвимым — это даёт силу, а не слабость.',
      moon: 'Луна в родном знаке усиливает интуицию и эмпатию.',
      aspect: 'Луна трин Нептун — мечты становятся ближе к реальности.',
    },
    'Лев ♌︎': {
      main: 'Ваше сияние сегодня особенно заметно окружающим. Время для творчества и самовыражения.',
      detailed:
        'Солнце наполняет вас уверенностью и магнетизмом. Люди тянутся к вашей энергии. Используйте этот день для реализации творческих идей и укрепления своего авторитета.',
      advice: 'Щедро делитесь своим светом — и он вернётся к вам сторицей.',
      moon: 'Растущая Луна усиливает вашу харизму и притяжение.',
      aspect: 'Солнце секстиль Юпитер — расширение возможностей и удача.',
    },
    'Дева ♍︎': {
      main: 'День подходит для анализа, планирования и наведения порядка — в делах и в голове.',
      detailed:
        'Меркурий активизирует вашу природную аналитичность. Детали, которые другие пропустят, вы заметите сразу. Этот день идеален для систематизации, решения задач и заботы о здоровье.',
      advice:
        'Не перфекционируйте до бесконечности — завершённое лучше идеального.',
      moon: 'Луна в земном знаке призывает к практичности и порядку.',
      aspect: 'Меркурий квадрат Сатурн — внимание к деталям принесёт плоды.',
    },
    'Весы ♎︎': {
      main: 'Гармония и баланс — ваши ключевые темы сегодня. Ищите компромисс там, где раньше виделся конфликт.',
      detailed:
        'Венера освещает ваши отношения и эстетическое восприятие мира. Сегодня легко находить красоту и справедливость вокруг. Особенно благоприятны партнёрства и совместные начинания.',
      advice:
        'Доверяйте своей интуиции при выборе — она подскажет верный путь.',
      moon: 'Луна в воздушном знаке гармонизирует отношения.',
      aspect: 'Венера трин Луна — эмоциональный баланс и тепло в отношениях.',
    },
    'Скорпион ♏︎': {
      main: 'Сегодня вы чувствуете глубину происходящего острее обычного. Время трансформации и открытий.',
      detailed:
        'Плутон усиливает вашу проницательность и волю к переменам. Скрытые мотивы станут очевидны, а глубокие разговоры принесут ясность. Не бойтесь идти туда, где другие останавливаются.',
      advice:
        'Отпустите то, что уже не служит вам — освободите место для нового.',
      moon: 'Луна усиливает интуицию и магнетизм вашего знака.',
      aspect: 'Плутон секстиль Марс — трансформирующая сила и решимость.',
    },
    'Стрелец ♐︎': {
      main: 'Оптимизм и тяга к новому — ваши союзники сегодня. Горизонты расширяются.',
      detailed:
        'Юпитер дарит вам щедрость судьбы и широту взглядов. Новые идеи, путешествия (даже мысленные) и обучение принесут радость. Ваш энтузиазм заразителен — делитесь им.',
      advice: 'Мечтайте масштабно, но делайте первый шаг уже сегодня.',
      moon: 'Растущая Луна зажигает дух приключений.',
      aspect: 'Юпитер трин Солнце — удача и расширение возможностей.',
    },
    'Козерог ♑︎': {
      main: 'Упорство и дисциплина сегодня вознаграждаются. Ваши усилия не останутся незамеченными.',
      detailed:
        'Сатурн укрепляет вашу решимость и строит прочный фундамент. Профессиональные вопросы решаются успешно. Долгосрочные планы, начатые сегодня, принесут стабильный результат.',
      advice:
        'Не сравнивайте свой путь с чужим — ваш темп именно таков, каким должен быть.',
      moon: 'Луна в земном знаке призывает к терпению и структуре.',
      aspect: 'Сатурн секстиль Меркурий — стратегическое мышление на высоте.',
    },
    'Водолей ♒︎': {
      main: 'Нестандартные идеи и свежий взгляд — ваши козыри сегодня. Не бойтесь быть собой.',
      detailed:
        'Уран активизирует ваш ум и тягу к переменам. Коллективные проекты и инновации в центре внимания. Ваша способность видеть будущее сегодня особенно сильна — доверяйте ей.',
      advice: 'Объединяйтесь с единомышленниками — вместе вы сдвинете горы.',
      moon: 'Луна в воздушном знаке пробуждает оригинальность мышления.',
      aspect: 'Уран квинкункс Солнце — неожиданные инсайты и открытия.',
    },
    'Рыбы ♓︎': {
      main: 'Интуиция сегодня говорит громче разума. Прислушайтесь к своим внутренним сигналам.',
      detailed:
        'Нептун открывает вашу чуткость к тонким энергиям мира. Творчество, медитация и духовные практики принесут глубокое удовлетворение. Граница между мечтой и реальностью сегодня очень тонка.',
      advice:
        'Выделите время для тишины и восстановления — это ваш источник силы.',
      moon: 'Луна усиливает вашу эмпатию и восприимчивость.',
      aspect: 'Нептун трин Венера — вдохновение, красота и душевный покой.',
    },
  };

  // ─── Mock support phrases (Fallback Policy) ───────────────────────────────
  // Keys = canonical mood IDs (feminine forms — base in DB).
  private readonly supportPhrases: Record<string, string[]> = {
    Спокойна: [
      'Ты на правильном пути. Каждый шаг имеет значение.',
      'Сегодня прекрасный день, чтобы просто быть собой.',
      'Спокойствие — это суперсила. Ты уже всё знаешь.',
      'Тишина внутри — лучший советчик.',
      'Доверься потоку. Всё происходит вовремя.',
    ],
    Нормально: [
      'Иногда «нормально» — это уже маленькая победа.',
      'Ровный день — лучшая основа для глубоких решений.',
      'Не каждый день должен быть ярким. И в этом тоже сила.',
      'Сегодня можно просто быть. Без подвигов.',
      'Баланс — это то, что ты создаёшь прямо сейчас.',
    ],
    Устала: [
      'Отдых — это не слабость, а мудрость. Позволь себе восстановиться.',
      'Даже самые сильные деревья склоняются перед ветром.',
      'Сегодня можно просто быть. Без подвигов. Без рекордов.',
      'Усталость — знак, что ты много отдала миру.',
      'Закрой глаза. Мир подождёт.',
    ],
    Тревожна: [
      'Вдохни глубоко. Ты в безопасности прямо сейчас.',
      'Тревога лжёт. Реальность добрее, чем кажется.',
      'Шаг за шагом. Не нужно решать всё сразу.',
      'Ты справлялась раньше — справишься и сейчас.',
      'Эта волна пройдёт. Ты крепче, чем она.',
    ],
    Грустна: [
      'Грусть — это не слабость. Это глубина твоей души.',
      'После дождя всегда выходит солнце. Подожди немного.',
      'Ты сильнее, чем думаешь. Это пройдёт.',
      'Разреши себе чувствовать — это нормально и важно.',
      'Каждая слеза поливает семена будущей радости.',
    ],
    Воодушевлена: [
      'Твоя энергия сегодня — подарок миру. Делись ею.',
      'Когда сердце поёт — весь мир танцует с тобой.',
      'Сегодня — идеальный день, чтобы начать то, о чём мечтаешь.',
      'Ты — магнит для чудес. Доверяй своей внутренней силе.',
      'Запомни этот момент. Ты создаёшь счастье прямо сейчас.',
    ],
  };

  // ─── Holidays: resolved locally (never by LLM), always returns a value ──
  // Real holiday → from HOLIDAYS_FULL dict; otherwise → wellness theme rotation.
  // See backend/src/ai/holidays.data.ts for the full calendar.

  // ─────────────────────────────────────────────────────────────────────────
  // generateDailyPack — Full Pack
  // try: OpenAI Structured Outputs → merge local holiday
  // catch: log error → return mock fallback (app never throws)
  // ─────────────────────────────────────────────────────────────────────────
  async generateDailyPack(
    userId: string,
    context: PromptContext,
  ): Promise<AiDailyPack> {
    this.logger.log(`generateDailyPack user=${userId}`);

    if (this.openai) {
      const startedAt = Date.now();
      let lastStatus: number | undefined;
      for (let attempt = 0; attempt < 2; attempt += 1) {
        try {
          const completion = await this.openai.chat.completions.create({
            model: this.model,
            reasoning_effort: 'low',
            temperature: 0.3,
            max_completion_tokens: 1400,
            response_format: { type: 'json_object' },
            messages: [
              {
                role: 'system',
                content:
                  'Ты — профессиональный астролог и психолог. Создаёшь глубоко персонализированные ежедневные прогнозы на русском языке. ' +
                  'Каждый ответ уникален и отражает характер конкретного знака зодиака, текущее настроение и дату. ' +
                  'Пиши живо, тепло, без клише и шаблонных фраз. Строго следуй JSON-схеме.',
              },
              {
                role: 'user',
                content:
                  (context.name ? `Имя: ${context.name}\n` : '') +
                  `Знак зодиака: ${context.zodiacSign}\n` +
                  `Настроение сейчас: ${context.mood}\n` +
                  `Пол: ${context.gender === 'F' ? 'женский' : context.gender === 'M' ? 'мужской' : 'не указан'}\n` +
                  `Дата: ${context.date}\n\n` +
                  'Сгенерируй персональный ежедневный пакет:\n\n' +
                  `- horoscope: главный прогноз на день для ${context.zodiacSign}: 2–4 предложения и 160–500 символов. ` +
                  'Говори конкретно о сегодняшнем дне, без длинного перечисления планет.\n\n' +
                  `- horoscopeDetailed: умеренно подробный разбор для ${context.zodiacSign}: 3–4 предложения и 350–850 символов. ` +
                  'Упомяни планету-покровителя и лунную энергию, но сохрани лёгкость чтения.\n\n' +
                  '- advice: 1–2 предложения и 60–220 символов с одним конкретным применимым шагом.\n\n' +
                  '- moon: фаза Луны и её влияние на знак — ровно 1 предложение и 45–180 символов.\n\n' +
                  '- aspect: один главный аспект дня — ровно 1 предложение и 45–180 символов.\n\n' +
                  `- supportPhrase: персональная фраза поддержки с настроением "${context.mood}" ` +
                  '(1–2 предложения и 60–220 символов). ' +
                  (context.name
                    ? `Обращайся к человеку по имени: "${context.name}, ...". Не упоминай знак зодиака во фразе. `
                    : `Обращайся через знак зодиака: "${context.zodiacSign}, ...". `) +
                  'Должна звучать как слова близкого человека. Не шаблонно, не банально.',
              },
            ],
          });

          const raw = completion.choices[0]?.message?.content ?? '';
          const parsed = parseDailyPackContent(raw);

          const holiday = resolveHoliday(context.holidayDate ?? context.date);
          this.logger.log(
            `AI_LIVE model=${this.model} status=200 durationMs=${Date.now() - startedAt} result=valid tokens=${completion.usage?.total_tokens ?? '?'}`,
          );

          return { ...parsed, holiday: holiday.name };
        } catch (err) {
          lastStatus = this.getHttpStatus(err);
          const retryable =
            attempt === 0 &&
            (lastStatus === undefined ||
              lastStatus === 408 ||
              lastStatus === 429 ||
              lastStatus >= 500);
          if (!retryable) break;
          if (lastStatus !== undefined) {
            await this.delay(RETRY_DELAY_MS);
          }
        }
      }
      this.logger.warn(
        `AI_FALLBACK model=${this.model} status=${lastStatus ?? 'invalid-response'} durationMs=${Date.now() - startedAt} result=fallback`,
      );
    }

    // ── Fallback: mock dictionaries ──────────────────────────────────────────
    const horoscope =
      this.horoscopes[context.zodiacSign] ?? this.horoscopes['Овен ♈︎'];
    const phrases =
      this.supportPhrases[context.mood] ?? this.supportPhrases['Нормально'];
    const holiday = resolveHoliday(context.holidayDate ?? context.date);

    return {
      horoscope: stripHtml(
        `${horoscope.main} Выберите один важный шаг, который можно завершить без спешки, и вечером отметьте получившийся результат.`,
      ),
      horoscopeDetailed: stripHtml(
        `${horoscope.detailed} Лунная энергия делает внутренние реакции заметнее, поэтому перед важным решением проверьте собственный мотив, выберите один ясный приоритет и оставьте собеседникам пространство для спокойного ответа.`,
      ),
      advice: stripHtml(
        `${horoscope.advice} Начните с него без лишней спешки.`,
      ),
      moon: stripHtml(horoscope.moon),
      aspect: stripHtml(horoscope.aspect),
      holiday: holiday.name,
      supportPhrase: stripHtml(
        this.expandSupportFallback(
          phrases[Math.floor(Math.random() * phrases.length)],
        ),
      ),
      isFallback: true,
    };
  }

  private getHttpStatus(error: unknown): number | undefined {
    if (
      typeof error === 'object' &&
      error !== null &&
      'status' in error &&
      typeof (error as { status?: unknown }).status === 'number'
    ) {
      return (error as { status: number }).status;
    }
    return undefined;
  }

  private delay(milliseconds: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
  }

  // ─────────────────────────────────────────────────────────────────────────
  // updateMoodSupport — Hybrid Partial Update (mood changed, only support changes)
  // Lightweight single-field LLM call; falls back to mock phrase on any error.
  // ─────────────────────────────────────────────────────────────────────────
  async updateMoodSupport(
    userId: string,
    newMood: string,
    zodiacSign?: string,
    name?: string,
    gender?: string,
  ): Promise<{ supportPhrase: string; isFallback?: boolean }> {
    this.logger.log(`updateMoodSupport user=${userId}`);

    if (this.openai) {
      const startedAt = Date.now();
      let lastStatus: number | undefined;
      for (let attempt = 0; attempt < 2; attempt += 1) {
        try {
          const signContext = zodiacSign ? `Знак зодиака: ${zodiacSign}. ` : '';
          const nameContext = name ? `Имя пользователя: ${name}. ` : '';
          const genderContext =
            gender === 'M'
              ? 'Пол: мужской. '
              : gender === 'F'
                ? 'Пол: женский. '
                : '';
          const addressInstruction = name
            ? `Обращайся по имени: "${name}, ...". Не упоминай знак зодиака.`
            : zodiacSign
              ? `Обращайся через знак зодиака: "${zodiacSign}, ...".`
              : '';
          const completion = await this.openai.chat.completions.create({
            model: this.model,
            reasoning_effort: 'low',
            temperature: 0.7,
            max_completion_tokens: 400,
            response_format: { type: 'json_object' },
            messages: [
              {
                role: 'system',
                content:
                  'Ты — мудрый астрологический наставник и психолог. Пишешь короткие, тёплые, персональные фразы поддержки на русском языке. ' +
                  'Учитываешь характер знака зодиака, текущее эмоциональное состояние и пол пользователя. ' +
                  'Отвечай строго по JSON-схеме. Без вступлений и пояснений.',
              },
              {
                role: 'user',
                content:
                  `${nameContext}${genderContext}${signContext}Текущее настроение: ${newMood}. ` +
                  'Напиши одну короткую персональную фразу поддержки: 1–2 предложения и 60–220 символов. ' +
                  'Она должна: отражать характер знака зодиака, принимать текущее состояние без осуждения, ' +
                  'мягко вдохновлять и звучать как слова близкого человека — не шаблонно. ' +
                  addressInstruction,
              },
            ],
          });

          const raw = completion.choices[0]?.message?.content ?? '';
          const parsed = parseSupportContent(raw);
          this.logger.log(
            `AI_LIVE model=${this.model} status=200 durationMs=${Date.now() - startedAt} result=support-valid`,
          );
          return parsed;
        } catch (err) {
          lastStatus = this.getHttpStatus(err);
          const retryable =
            attempt === 0 &&
            (lastStatus === undefined ||
              lastStatus === 408 ||
              lastStatus === 429 ||
              lastStatus >= 500);
          if (!retryable) break;
          if (lastStatus !== undefined) await this.delay(RETRY_DELAY_MS);
        }
      }
      this.logger.warn(
        `AI_FALLBACK model=${this.model} status=${lastStatus ?? 'invalid-response'} durationMs=${Date.now() - startedAt} result=support-fallback`,
      );
    }

    // ── Fallback ─────────────────────────────────────────────────────────────
    const phrases =
      this.supportPhrases[newMood] ?? this.supportPhrases['Нормально'];
    return {
      supportPhrase: this.expandSupportFallback(
        phrases[Math.floor(Math.random() * phrases.length)],
      ),
      isFallback: true,
    };
  }

  private expandSupportFallback(base: string): string {
    const firstSentence =
      base.split(/[.!?…]/, 1)[0]?.trim() || 'Ты справляешься';
    return stripHtml(
      `${firstSentence}. Выбери один бережный шаг и не требуй от себя решить всё сразу.`,
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // generateSupportPhrasesBatch — generates 5 phrases in one AI call.
  // Used to pre-fill Redis pool so subsequent "другая фраза" taps are free.
  // ─────────────────────────────────────────────────────────────────────────
  async generateSupportPhrasesBatch(
    mood: string,
    zodiacSign?: string,
    holiday?: string,
    name?: string,
    gender?: string,
  ): Promise<AiSupportBatch> {
    this.logger.log('generateSupportPhrasesBatch');

    if (this.openai) {
      const startedAt = Date.now();
      let lastStatus: number | undefined;
      for (let attempt = 0; attempt < 2; attempt += 1) {
        try {
          const signContext = zodiacSign ? `Знак зодиака: ${zodiacSign}. ` : '';
          const holidayContext = holiday
            ? `Сегодня праздник: ${holiday}. `
            : '';
          const nameContext = name ? `Имя пользователя: ${name}. ` : '';
          const genderContext =
            gender === 'M'
              ? 'Пол: мужской. '
              : gender === 'F'
                ? 'Пол: женский. '
                : '';
          const addressInstruction = name
            ? `В каждой фразе обращайся по имени: "${name}, ...". Не упоминай знак зодиака.`
            : zodiacSign
              ? `В каждой фразе обращайся через знак зодиака: "${zodiacSign}, ...".`
              : '';
          const completion = await this.openai.chat.completions.create({
            model: this.model,
            reasoning_effort: 'low',
            temperature: 0.9,
            max_completion_tokens: 1200,
            response_format: { type: 'json_object' },
            messages: [
              {
                role: 'system',
                content:
                  'Ты — мудрый астрологический наставник и психолог. Пишешь короткие, тёплые, персональные фразы поддержки на русском языке. ' +
                  'Каждая фраза уникальна, не повторяет другие. Учитываешь характер знака зодиака, настроение и пол пользователя. ' +
                  'Отвечай строго по JSON-схеме.',
              },
              {
                role: 'user',
                content:
                  `${nameContext}${genderContext}${signContext}${holidayContext}Текущее настроение: ${mood}. ` +
                  'Напиши 5 разных персональных фраз поддержки: каждая 1–2 предложения и 60–220 символов. ' +
                  'Каждая должна звучать по-разному — разный тон, разный угол. ' +
                  'Без шаблонов, как слова близкого человека. ' +
                  'Верни JSON ровно такого вида: {"p1":"...","p2":"...","p3":"...","p4":"...","p5":"..."}. ' +
                  'Не добавляй другие ключи. ' +
                  addressInstruction,
              },
            ],
          });

          const raw = completion.choices[0]?.message?.content ?? '';
          const parsed = JSON.parse(raw) as Record<string, unknown>;
          const phrases = ['p1', 'p2', 'p3', 'p4', 'p5'].map(
            (key) =>
              parseSupportContent(
                JSON.stringify({ supportPhrase: parsed[key] }),
              ).supportPhrase,
          );
          this.logger.log(
            `AI_LIVE model=${this.model} status=200 durationMs=${Date.now() - startedAt} result=support-batch-valid`,
          );
          return { phrases };
        } catch (err) {
          lastStatus = this.getHttpStatus(err);
          const retryable =
            attempt === 0 &&
            (lastStatus === undefined ||
              lastStatus === 408 ||
              lastStatus === 429 ||
              lastStatus >= 500);
          if (!retryable) break;
          if (lastStatus !== undefined) await this.delay(RETRY_DELAY_MS);
        }
      }
      this.logger.warn(
        `AI_FALLBACK model=${this.model} status=${lastStatus ?? 'invalid-response'} durationMs=${Date.now() - startedAt} result=support-batch-fallback`,
      );
    }

    // Fallback: pick 5 random from mock dictionary
    const phrases =
      this.supportPhrases[mood] ?? this.supportPhrases['Нормально'];
    const shuffled = [...phrases].sort(() => Math.random() - 0.5);
    return {
      phrases: shuffled
        .slice(0, 5)
        .map((phrase) => this.expandSupportFallback(phrase)),
      isFallback: true,
    };
  }
}
