import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma';
import { AiService, type AiDailyPack, type PromptContext } from '../ai';
import { RedisService } from '../redis/redis.service';

const CACHE_TTL_SECONDS = 129_600; // 36 hours (covers all RU timezones)
const AI_LOCK_TTL = 30; // max seconds one AI call should take

@Injectable()
export class TodayService {
  private readonly logger = new Logger(TodayService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ai: AiService,
    private readonly redis: RedisService,
  ) {}

  async getTodayPack(userId: string) {
    // ── 0. Prefs + Profile + User.name in parallel (all needed before cache check) ─
    const [prefs, profile, user] = await Promise.all([
      this.prisma.prefs.findUnique({ where: { userId } }),
      this.prisma.profile.findUnique({ where: { userId } }),
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { name: true },
      }),
    ]);

    const today = this.getTodayDateStr(prefs?.timezone ?? undefined);
    const zodiacSign = profile?.zodiacSign ?? '';
    const mood = profile?.currentMood ?? 'Нормально';
    const gender = profile?.gender ?? 'UNKNOWN';
    const name = user?.name ?? undefined;

    // ── 1. DailyFeed DB cache — must match current zodiac sign ────────────────
    const existingFeed = await this.prisma.dailyFeed.findUnique({
      where: { userId_date: { userId, date: today } },
      include: { horoscope: true, supportPhrase: true, holiday: true },
    });

    if (
      existingFeed?.horoscope &&
      existingFeed?.supportPhrase &&
      existingFeed.horoscope.zodiacSign === zodiacSign
    ) {
      this.logger.log(`getTodayPack DB hit userId=${userId} date=${today}`);
      return this.buildResponse(
        today,
        existingFeed.horoscope,
        existingFeed.supportPhrase,
        existingFeed.holiday,
      );
    }

    // Stale or mismatched zodiac — delete so it rebuilds correctly.
    if (existingFeed) {
      this.logger.log(
        `getTodayPack invalidating stale feed userId=${userId} ` +
          `(zodiac was="${existingFeed.horoscope?.zodiacSign ?? 'none'}", now="${zodiacSign}")`,
      );
      await this.prisma.dailyFeed.delete({
        where: { userId_date: { userId, date: today } },
      });
    }

    // ── 2. Redis cache (zodiacSign + mood + name + date) ───────────────────────
    // Включаем имя в ключ: AI обращается по имени, поэтому фразу нельзя шарить
    // между разными юзерами с одним знаком. Юзеры без имени делят anon-кэш.
    const nameKey = name ?? 'anon';
    const cacheKey = `pack:${zodiacSign}:${mood}:${nameKey}:${today}`;
    const lockKey = `lock:${cacheKey}`;

    let pack: AiDailyPack | null = null;
    const cached = await this.redis.get(cacheKey);

    if (cached) {
      this.logger.log(`getTodayPack Redis HIT key=${cacheKey}`);
      pack = JSON.parse(cached) as AiDailyPack;
    }

    // ── 3. AI call — protected by a distributed lock to prevent x2 calls ──────
    if (!pack) {
      const lockAcquired = await this.redis.acquireLock(lockKey, AI_LOCK_TTL);

      if (!lockAcquired) {
        // Another request has the lock — wait briefly then re-check Redis.
        this.logger.log(`getTodayPack lock busy, waiting... key=${cacheKey}`);
        await new Promise((r) => setTimeout(r, 1000));
        const retried = await this.redis.get(cacheKey);
        if (retried) {
          pack = JSON.parse(retried) as AiDailyPack;
        }
      }

      if (!pack) {
        // Call AI and write to Redis whether we hold the lock or not.
        // Edge case without lock: two concurrent writes are idempotent (same data).
        try {
          this.logger.log(`getTodayPack calling AI key=${cacheKey}`);
          const context: PromptContext = {
            zodiacSign,
            mood,
            gender,
            date: today,
            name,
          };
          pack = await this.ai.generateDailyPack(userId, context);
          const ttl = pack.isFallback ? 300 : CACHE_TTL_SECONDS;
          if (pack.isFallback) {
            this.logger.warn(
              `Caching fallback response for 5 minutes (key=${cacheKey})`,
            );
          }
          await this.redis.set(cacheKey, JSON.stringify(pack), ttl);
        } finally {
          if (lockAcquired) await this.redis.releaseLock(lockKey);
        }
      } else if (lockAcquired) {
        // Cache was populated after our wait — release the lock we no longer need.
        await this.redis.releaseLock(lockKey);
      }
    }

    // ── 4. Persist horoscope (shared ref — upsert is idempotent) ──────────────
    const horoscope = await this.prisma.horoscope.upsert({
      where: { date_zodiacSign: { date: today, zodiacSign } },
      update: {},
      create: {
        date: today,
        zodiacSign,
        main: pack.horoscope,
        detailed: pack.horoscopeDetailed,
        advice: pack.advice,
        moon: pack.moon,
        aspect: pack.aspect,
      },
    });

    // ── 5. Persist support phrase (per-user, always fresh) ─────────────────────
    const supportPhrase = await this.prisma.supportPhrase.create({
      data: { mood, text: pack.supportPhrase },
    });

    // ── 6. Persist holiday (shared ref — upsert is idempotent) ────────────────
    const holiday = pack.holiday
      ? await this.prisma.holiday.upsert({
          where: { date: today },
          update: {},
          create: { date: today, title: pack.holiday },
        })
      : null;

    // ── 7. Save DailyFeed (user ↔ content join for today) ─────────────────────
    await this.prisma.dailyFeed.upsert({
      where: { userId_date: { userId, date: today } },
      update: {
        horoscopeId: horoscope.id,
        supportPhraseId: supportPhrase.id,
        holidayId: holiday?.id ?? null,
      },
      create: {
        userId,
        date: today,
        horoscopeId: horoscope.id,
        supportPhraseId: supportPhrase.id,
        holidayId: holiday?.id ?? null,
      },
    });

    return this.buildResponse(today, horoscope, supportPhrase, holiday);
  }

  /**
   * Called by patchMood (mood change) and nextSupport ("Другая фраза").
   * Replaces ONLY the support phrase in today's DailyFeed — horoscope is untouched.
   */
  async replaceSupportPhrase(userId: string, mood: string, text: string) {
    const prefs = await this.prisma.prefs.findUnique({ where: { userId } });
    const today = this.getTodayDateStr(prefs?.timezone ?? undefined);

    const newPhrase = await this.prisma.supportPhrase.create({
      data: { mood, text },
    });

    // updateMany silently skips if no DailyFeed exists yet.
    // getTodayPack will create a complete record on first home load.
    await this.prisma.dailyFeed.updateMany({
      where: { userId, date: today },
      data: { supportPhraseId: newPhrase.id },
    });

    return newPhrase;
  }

  /**
   * For push notifications: returns a FRESH support phrase from the Redis pool.
   * Each call pops the next phrase so consecutive pushes have different texts.
   * If pool is empty — generates a new batch via AI.
   */
  async getNextSupportPhrase(userId: string): Promise<string | null> {
    const [profile, prefs, user] = await Promise.all([
      this.prisma.profile.findUnique({ where: { userId } }),
      this.prisma.prefs.findUnique({ where: { userId } }),
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { name: true },
      }),
    ]);

    const mood = profile?.currentMood ?? 'Нормально';
    const zodiac = profile?.zodiacSign ?? undefined;
    const gender = profile?.gender ?? undefined;
    const name = user?.name ?? undefined;
    const today = this.getTodayDateStr(prefs?.timezone ?? undefined);

    const poolKey = `support-pool:${mood}:${zodiac ?? 'unknown'}:${name ?? 'anon'}:${gender ?? 'u'}:${today}`;

    let phrase = await this.redis.rpop(poolKey);

    if (!phrase) {
      // Pool empty — generate fresh batch
      const context: PromptContext = {
        zodiacSign: zodiac ?? '',
        mood,
        gender: gender ?? 'UNKNOWN',
        date: today,
        name,
      };
      const batch = await this.ai.generateSupportPhrasesBatch(
        context.mood,
        context.zodiacSign || undefined,
        undefined,
        context.name,
        context.gender !== 'UNKNOWN' ? context.gender : undefined,
      );
      if (batch.length > 1) {
        await this.redis.lpush(poolKey, batch.slice(1), 86400);
      }
      phrase = batch[0] ?? null;
    }

    // Update DailyFeed so home screen also shows the new phrase
    if (phrase) {
      await this.replaceSupportPhrase(userId, mood, phrase);
    }

    return phrase;
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private buildResponse(
    date: string,
    horoscope: {
      main: string;
      detailed: string | null;
      advice: string;
      moon: string;
      aspect: string;
    },
    supportPhrase: { text: string },
    holiday: { title: string } | null,
  ) {
    return {
      date,
      horoscope: {
        main: horoscope.main,
        detailed: horoscope.detailed ?? horoscope.main,
        advice: horoscope.advice,
        moon: horoscope.moon,
        aspect: horoscope.aspect,
      },
      support: { text: supportPhrase.text },
      holiday: holiday ? { title: holiday.title } : null,
    };
  }

  /** Returns today's date as "DD.MM" in the user's timezone, or UTC if unknown/invalid. */
  private getTodayDateStr(timezone?: string): string {
    const now = new Date();
    if (timezone) {
      try {
        const parts = new Intl.DateTimeFormat('en-GB', {
          timeZone: timezone,
          day: '2-digit',
          month: '2-digit',
        }).formatToParts(now);
        const day = parts.find((p) => p.type === 'day')?.value ?? '';
        const month = parts.find((p) => p.type === 'month')?.value ?? '';
        if (day && month) return `${day}.${month}`;
      } catch {
        // Invalid IANA timezone — fall through to UTC
      }
    }
    const day = String(now.getUTCDate()).padStart(2, '0');
    const month = String(now.getUTCMonth() + 1).padStart(2, '0');
    return `${day}.${month}`;
  }
}
