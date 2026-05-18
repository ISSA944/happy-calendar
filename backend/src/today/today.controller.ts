import { Controller, Get, Post, HttpCode, UseGuards, Logger } from '@nestjs/common';
import { TodayService } from './today.service';
import { AiService } from '../ai';
import { PrismaService } from '../prisma';
import { RedisService } from '../redis/redis.service';
import { resolveHoliday } from '../ai/holidays.data';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthUser } from '../auth/current-user.decorator';

const POOL_MIN = 2;     // refill pool when fewer than this many phrases left
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
    // HTTP-level cache: 30s cache per user+date — при смене дня старый ключ
    // автоматически устаревает и пользователь сразу видит новый праздник/контент.
    const now = new Date();
    const dateKey = `${String(now.getUTCDate()).padStart(2, '0')}.${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
    const cacheKey = `today:response:${user.sub}:${dateKey}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch { /* fall through to fresh fetch */ }
    }

    const pack = await this.todayService.getTodayPack(user.sub);
    await this.redis.set(cacheKey, JSON.stringify(pack), 30);
    return pack;
  }

  @Post('support/next')
  @HttpCode(200)
  async nextSupport(@CurrentUser() user: AuthUser) {
    const [profile, prefs, userRow] = await Promise.all([
      this.prisma.profile.findUnique({ where: { userId: user.sub } }),
      this.prisma.prefs.findUnique({ where: { userId: user.sub } }),
      this.prisma.user.findUnique({ where: { id: user.sub }, select: { name: true } }),
    ]);

    const mood       = profile?.currentMood ?? 'Нормально';
    const zodiacSign = profile?.zodiacSign  ?? undefined;
    const gender     = profile?.gender      ?? undefined;
    const name       = userRow?.name        ?? undefined;
    const today      = this.getTodayStr(prefs?.timezone);
    const holiday    = resolveHoliday(today).name ?? undefined;

    // Pool делим по имени+полу (или anon) — иначе фразы одного юзера достанутся другому.
    const poolKey = `support-pool:${mood}:${zodiacSign ?? 'unknown'}:${name ?? 'anon'}:${gender ?? 'u'}:${today}`;

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
      const batch = await this.ai.generateSupportPhrasesBatch(mood, zodiacSign, holiday, name, gender);
      if (batch.length > 1) {
        await this.redis.lpush(poolKey, batch.slice(1), POOL_TTL);
      }
      supportPhrase = batch[0] ?? 'Ты справляешься. Продолжай.';
    }

    await this.todayService.replaceSupportPhrase(user.sub, mood, supportPhrase);
    // Инвалидируем HTTP-кэш чтобы следующий GET /api/today показал новую фразу
    const nowInv = new Date();
    const dateInv = `${String(nowInv.getUTCDate()).padStart(2, '0')}.${String(nowInv.getUTCMonth() + 1).padStart(2, '0')}`;
    await this.redis.del(`today:response:${user.sub}:${dateInv}`);
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
      const batch = await this.ai.generateSupportPhrasesBatch(mood, zodiacSign, holiday, name, gender);
      if (batch.length > 0) {
        await this.redis.lpush(poolKey, batch, POOL_TTL);
        this.logger.log(`nextSupport pool refilled key=${poolKey}, ${batch.length} phrases`);
      }
    } catch (err) {
      this.logger.error('Pool refill failed', err);
    }
  }

  private getTodayStr(timezone?: string | null): string {
    const now = new Date();
    if (timezone) {
      try {
        const parts = new Intl.DateTimeFormat('en-GB', {
          timeZone: timezone,
          day: '2-digit',
          month: '2-digit',
        }).formatToParts(now);
        const day   = parts.find(p => p.type === 'day')?.value   ?? '';
        const month = parts.find(p => p.type === 'month')?.value ?? '';
        if (day && month) return `${day}.${month}`;
      } catch { /* fall through */ }
    }
    const d = String(now.getUTCDate()).padStart(2, '0');
    const m = String(now.getUTCMonth() + 1).padStart(2, '0');
    return `${d}.${m}`;
  }
}
