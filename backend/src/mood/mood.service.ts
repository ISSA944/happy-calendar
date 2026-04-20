import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma';
import { AiService } from '../ai';

@Injectable()
export class MoodService {
  private readonly logger = new Logger(MoodService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ai: AiService,
  ) {}

  /**
   * Обновляет настроение пользователя.
   * 1. Обновляет mood в Profile.
   * 2. Вызывает AI для генерации новой фразы поддержки.
   * 3. Обновляет фразу в DailyFeed на сегодня (если есть).
   * 4. Возвращает обновлённый пакет.
   */
  async updateMood(userId: string, newMood: string) {
    this.logger.log(`updateMood user=${userId}, mood=${newMood}`);

    // 1. Обновляем mood в профиле
    await this.prisma.profile.update({
      where: { userId },
      data: { currentMood: newMood },
    });

    // 2. Вызываем AI (mock) для новой фразы поддержки
    const { supportPhrase } = await this.ai.updateMoodSupport(userId, newMood);

    // 3. Обновляем DailyFeed на сегодня (если существует)
    const today = this.getTodayDateStr();
    const updatedFeed = await this.prisma.dailyFeed.updateMany({
      where: { userId, date: today },
      data: { supportPhrase },
    });

    this.logger.log(`Updated ${updatedFeed.count} feed(s) with new phrase`);

    // 4. Возвращаем обновлённый фид
    const feed = await this.prisma.dailyFeed.findUnique({
      where: { userId_date: { userId, date: today } },
    });

    return {
      mood: newMood,
      supportPhrase,
      feed,
    };
  }

  private getTodayDateStr(): string {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${day}.${month}`;
  }
}
