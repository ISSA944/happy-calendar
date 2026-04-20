import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma';
import { AiService, type PromptContext } from '../ai';

@Injectable()
export class FeedService {
  private readonly logger = new Logger(FeedService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ai: AiService,
  ) {}

  /**
   * Возвращает дневной пакет для пользователя.
   * Если в БД уже есть запись на сегодня — возвращает её.
   * Если нет — вызывает AI, сохраняет и возвращает.
   */
  async getTodayFeed(userId: string) {
    const today = this.getTodayDateStr();

    // 1. Пробуем найти существующий пакет
    const existing = await this.prisma.dailyFeed.findUnique({
      where: { userId_date: { userId, date: today } },
    });

    if (existing) {
      this.logger.log(`Feed cache HIT for user=${userId}, date=${today}`);
      return existing;
    }

    // 2. Нет в БД — нужно сгенерировать
    this.logger.log(`Feed cache MISS for user=${userId}, date=${today} — calling AI`);

    // Подтягиваем профиль пользователя для контекста
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
    });

    const context: PromptContext = {
      zodiacSign: profile?.zodiacSign ?? '',
      mood: profile?.currentMood ?? 'Спокойное',
      gender: profile?.gender ?? 'UNKNOWN',
      date: today,
    };

    const aiResult = await this.ai.generateDailyPack(userId, context);

    // 3. Сохраняем в БД
    const feed = await this.prisma.dailyFeed.create({
      data: {
        userId,
        date: today,
        horoscope: aiResult.horoscope,
        holiday: aiResult.holiday,
        supportPhrase: aiResult.supportPhrase,
        zodiacSign: context.zodiacSign,
      },
    });

    this.logger.log(`Feed created for user=${userId}, date=${today}`);
    return feed;
  }

  /** Формат DD.MM */
  private getTodayDateStr(): string {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${day}.${month}`;
  }
}
