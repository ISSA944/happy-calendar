import {
  Controller,
  Get,
  Post,
  HttpCode,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { TodayService } from './today.service';
import { AiService } from '../ai';
import { PrismaService } from '../prisma';
import { RedisService } from '../redis/redis.service';
import { resolveHoliday } from '../ai/holidays.data';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthUser } from '../auth/current-user.decorator';

const POOL_MIN = 2; // refill pool when fewer than this many phrases left
const POOL_TTL = 86400; // 24h TTL for pool keys

@Controller('api/today')
@UseGuards(JwtAuthGuard)
export class TodayController {
  private readonly logger = new Logger(TodayController.name);

  constructor(
    private readonly todayService: TodayService,
    private readonly ai: AiService,
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  @Get()
  async getToday(@CurrentUser() user: AuthUser) {
    return this.todayService.getTodayPack(user.sub);
  }

  @Post('support/next')
  @HttpCode(200)
  async nextSupport(@CurrentUser() user: AuthUser) {
    const [profile, prefs, userRow] = await Promise.all([
      this.prisma.profile.findUnique({ where: { userId: user.sub } }),
      this.prisma.prefs.findUnique({ where: { userId: user.sub } }),
      this.prisma.user.findUnique({
        where: { id: user.sub },
        select: { name: true },
      }),
    ]);

    const mood = profile?.currentMood ?? 'Нормально';
    const zodiacSign = profile?.zodiacSign ?? undefined;
    const gender = profile?.gender ?? undefined;
    const name = userRow?.name ?? undefined;
    const { isoDate, displayDate } = this.getTodayDateParts(prefs?.timezone);
    const holiday = resolveHoliday(displayDate).name ?? undefined;

    // Персональный versioned pool; имя используется только в AI prompt, не в key/logs.
    const poolKey = `support-pool:short-v2:${user.sub}:${zodiacSign ?? 'unknown'}:${mood}:${isoDate}`;

    // Try to pop a phrase from the shared pool first (no AI call)
    let supportPhrase = await this.redis.rpop(poolKey);

    if (supportPhrase) {
      this.logger.log(`nextSupport pool HIT key=${poolKey}`);
      // Refill pool in background if running low
      const remaining = await this.redis.llen(poolKey);
      if (remaining < POOL_MIN) {
        void this.refillPool(poolKey, mood, zodiacSign, holiday, name, gender);
      }
    } else {
      // Pool empty — generate batch and fill it
      this.logger.log(`nextSupport pool MISS key=${poolKey}, generating batch`);
      const batch = await this.ai.generateSupportPhrasesBatch(
        mood,
        zodiacSign,
        holiday,
        name,
        gender,
      );
      if (!batch.isFallback && batch.phrases.length > 1) {
        await this.redis.lpush(poolKey, batch.phrases.slice(1), POOL_TTL);
      }
      supportPhrase =
        batch.phrases[0] ??
        'Сейчас можно спокойно вернуть себе опору. Выбери один бережный шаг и не требуй от себя решить всё сразу.';
      if (batch.isFallback) {
        return { support: { text: supportPhrase } };
      }
    }

    await this.todayService.replaceSupportPhrase(user.sub, mood, supportPhrase);
    return { support: { text: supportPhrase } };
  }

  private async refillPool(
    poolKey: string,
    mood: string,
    zodiacSign?: string,
    holiday?: string,
    name?: string,
    gender?: string,
  ): Promise<void> {
    try {
      const batch = await this.ai.generateSupportPhrasesBatch(
        mood,
        zodiacSign,
        holiday,
        name,
        gender,
      );
      if (!batch.isFallback && batch.phrases.length > 0) {
        await this.redis.lpush(poolKey, batch.phrases, POOL_TTL);
        this.logger.log(
          `nextSupport pool refilled key=${poolKey}, ${batch.phrases.length} phrases`,
        );
      }
    } catch (err) {
      this.logger.error('Pool refill failed', err);
    }
  }

  private getTodayDateParts(timezone?: string | null): {
    isoDate: string;
    displayDate: string;
  } {
    const now = new Date();
    if (timezone) {
      try {
        const parts = new Intl.DateTimeFormat('en-CA', {
          timeZone: timezone,
          year: 'numeric',
          day: '2-digit',
          month: '2-digit',
        }).formatToParts(now);
        const year = parts.find((p) => p.type === 'year')?.value ?? '';
        const day = parts.find((p) => p.type === 'day')?.value ?? '';
        const month = parts.find((p) => p.type === 'month')?.value ?? '';
        if (year && day && month) {
          return {
            isoDate: `${year}-${month}-${day}`,
            displayDate: `${day}.${month}`,
          };
        }
      } catch {
        /* fall through */
      }
    }
    const y = String(now.getUTCFullYear());
    const d = String(now.getUTCDate()).padStart(2, '0');
    const m = String(now.getUTCMonth() + 1).padStart(2, '0');
    return { isoDate: `${y}-${m}-${d}`, displayDate: `${d}.${m}` };
  }
}
