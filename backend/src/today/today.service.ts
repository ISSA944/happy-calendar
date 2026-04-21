import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma';
import { AiService, type PromptContext } from '../ai';

@Injectable()
export class TodayService {
  private readonly logger = new Logger(TodayService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ai: AiService,
  ) {}

  /**
   * Phase 1 stub: читает профиль, берёт mock-pack из AiService.
   * Phase 2: заменить на ref-table lookup (Horoscope/Holiday/SupportPhrase) + Redis cache.
   */
  async getTodayPack(userId: string) {
    const today = this.getTodayDateStr();

    const profile = await this.prisma.profile.findUnique({ where: { userId } });

    const context: PromptContext = {
      zodiacSign: profile?.zodiacSign ?? '',
      mood: profile?.currentMood ?? 'Спокойное',
      gender: profile?.gender ?? 'UNKNOWN',
      date: today,
    };

    const pack = await this.ai.generateDailyPack(userId, context);

    return {
      date: today,
      horoscope: {
        main: pack.horoscope,
        detailed: pack.horoscopeDetailed,
        advice: pack.advice,
        moon: pack.moon,
        aspect: pack.aspect,
      },
      support: { text: pack.supportPhrase },
      holiday: pack.holiday ? { title: pack.holiday } : null,
    };
  }

  private getTodayDateStr(): string {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${day}.${month}`;
  }
}
