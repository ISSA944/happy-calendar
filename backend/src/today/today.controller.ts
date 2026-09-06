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
import { randomUUID } from 'node:crypto';
import type { AiSupportBatch } from '../ai/ai.service';

const POOL_MIN = 2; // refill pool when fewer than this many phrases left
const POOL_TTL = 86400; // 24h TTL for pool keys
const SUPPORT_FALLBACK =
  'Сейчас можно спокойно вернуть себе опору. Выбери один бережный шаг и не требуй от себя решить всё сразу.';

@Controller('api/today')
@UseGuards(JwtAuthGuard)
export class TodayController {
  private readonly logger = new Logger(TodayController.name);
  private readonly fills = new Map<string, Promise<AiSupportBatch | null>>();

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
      let timer: ReturnType<typeof setTimeout> | undefined;
      const batch = await Promise.race([
        this.refillPool(poolKey, mood, zodiacSign, holiday, name, gender),
        new Promise<null>((resolve) => {
          timer = setTimeout(() => resolve(null), 8000);
        }),
      ]).finally(() => clearTimeout(timer));
      supportPhrase = await this.redis.rpop(poolKey);
      if (!supportPhrase) {
        // Slow/failed provider: return promptly, let the single refill finish in background.
        // Never persist this temporary response as the user's daily support.
        return { support: { text: batch?.phrases[0] ?? SUPPORT_FALLBACK } };
      }
    }

    await this.todayService.replaceSupportPhrase(user.sub, mood, supportPhrase);
    return { support: { text: supportPhrase } };
  }

  private refillPool(
    poolKey: string,
    mood: string,
    zodiacSign?: string,
    holiday?: string,
    name?: string,
    gender?: string,
  ): Promise<AiSupportBatch | null> {
    const existing = this.fills.get(poolKey);
    if (existing) return existing;
    const filling = (async (): Promise<AiSupportBatch | null> => {
      const lockKey = `lock:${poolKey}`;
      const owner = randomUUID();
      let owned = false;
      try {
        const cooldown = await this.redis.get(`fallback:${poolKey}`);
        if (cooldown) return JSON.parse(cooldown) as AiSupportBatch;
        const lock = await this.redis.acquireOwnedLock(lockKey, owner, 50);
        owned = lock === 'acquired';
        if (lock === 'busy') {
          const deadline = Date.now() + 8000;
          while (Date.now() < deadline) {
            if ((await this.redis.llen(poolKey)) > 0) return null;
            const fallback = await this.redis.get(`fallback:${poolKey}`);
            if (fallback) return JSON.parse(fallback) as AiSupportBatch;
            await new Promise((resolve) => setTimeout(resolve, 200));
          }
          return null;
        }
        if ((await this.redis.llen(poolKey)) >= POOL_MIN) return null;
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
        } else {
          await this.redis.set(
            `fallback:${poolKey}`,
            JSON.stringify(batch),
            300,
          );
        }
        return batch;
      } catch (err) {
        this.logger.error('Pool refill failed', err);
        const fallback: AiSupportBatch = {
          phrases: [SUPPORT_FALLBACK],
          isFallback: true,
        };
        await this.redis.set(
          `fallback:${poolKey}`,
          JSON.stringify(fallback),
          300,
        );
        return fallback;
      } finally {
        if (owned) await this.redis.releaseOwnedLock(lockKey, owner);
      }
    })();
    this.fills.set(poolKey, filling);
    void filling.finally(() => {
      if (this.fills.get(poolKey) === filling) this.fills.delete(poolKey);
    });
    return filling;
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
