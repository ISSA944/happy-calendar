import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma';
import { AiService, type AiDailyPack, type PromptContext } from '../ai';
import { RedisService } from '../redis/redis.service';

const CACHE_TTL_SECONDS = 86_400; // 24 hours

@Injectable()
export class TodayService {
  private readonly logger = new Logger(TodayService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ai: AiService,
    private readonly redis: RedisService,
  ) {}

  async getTodayPack(userId: string) {
    // ── 0. Fetch prefs + profile in parallel (both needed before cache check) ──
    const [prefs, profile] = await Promise.all([
      this.prisma.prefs.findUnique({ where: { userId } }),
      this.prisma.profile.findUnique({ where: { userId } }),
    ]);

    const today      = this.getTodayDateStr(prefs?.timezone ?? undefined);
    const zodiacSign = profile?.zodiacSign ?? '';
    const mood       = profile?.currentMood ?? 'Нормально';
    const gender     = profile?.gender ?? 'UNKNOWN';

    // ── 1. DailyFeed hit (DB cache) — must match current zodiac sign ──────────
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
      return this.buildResponse(today, existingFeed.horoscope, existingFeed.supportPhrase, existingFeed.holiday);
    }

    // Stale or mismatched zodiac — delete DailyFeed so it rebuilds correctly.
    if (existingFeed) {
      this.logger.log(
        `getTodayPack invalidating stale DailyFeed userId=${userId} ` +
        `(had zodiac=${existingFeed.horoscope?.zodiacSign ?? 'none'}, now=${zodiacSign})`,
      );
      await this.prisma.dailyFeed.delete({ where: { userId_date: { userId, date: today } } });
    }

    // ── 2. Redis hit (shared by zodiacSign + mood + date) ──────────────────────
    const cacheKey = `pack:${zodiacSign}:${mood}:${today}`;
    let pack: AiDailyPack | null = null;

    const cached = await this.redis.get(cacheKey);
    if (cached) {
      this.logger.log(`getTodayPack Redis HIT key=${cacheKey}`);
      pack = JSON.parse(cached) as AiDailyPack;
    }

    // ── 3. AI call on full cache miss ──────────────────────────────────────────
    if (!pack) {
      this.logger.log(`getTodayPack MISS — calling AI key=${cacheKey}`);
      const context: PromptContext = { zodiacSign, mood, gender, date: today };
      pack = await this.ai.generateDailyPack(userId, context);
      await this.redis.set(cacheKey, JSON.stringify(pack), CACHE_TTL_SECONDS);
    }

    // ── 4. Persist to ref tables ───────────────────────────────────────────────
    const [horoscope, supportPhrase] = await Promise.all([
      this.prisma.horoscope.upsert({
        where: { date_zodiacSign: { date: today, zodiacSign } },
        update: {},
        create: {
          date: today,
          zodiacSign,
          main:     pack.horoscope,
          detailed: pack.horoscopeDetailed,
          advice:   pack.advice,
          moon:     pack.moon,
          aspect:   pack.aspect,
        },
      }),
      this.prisma.supportPhrase.create({
        data: { mood, text: pack.supportPhrase },
      }),
    ]);

    const holiday = pack.holiday
      ? await this.prisma.holiday.upsert({
          where: { date: today },
          update: {},
          create: { date: today, title: pack.holiday },
        })
      : null;

    // ── 5. Create DailyFeed (user↔ref join for today) ──────────────────────────
    await this.prisma.dailyFeed.upsert({
      where: { userId_date: { userId, date: today } },
      update: { horoscopeId: horoscope.id, supportPhraseId: supportPhrase.id, holidayId: holiday?.id ?? null },
      create: { userId, date: today, horoscopeId: horoscope.id, supportPhraseId: supportPhrase.id, holidayId: holiday?.id ?? null },
    });

    return this.buildResponse(today, horoscope, supportPhrase, holiday);
  }

  /** Called by patchMood and nextSupport to replace only the support phrase in today's feed. */
  async replaceSupportPhrase(userId: string, mood: string, text: string) {
    const prefs = await this.prisma.prefs.findUnique({ where: { userId } });
    const today = this.getTodayDateStr(prefs?.timezone ?? undefined);

    const newPhrase = await this.prisma.supportPhrase.create({
      data: { mood, text },
    });

    // updateMany silently skips if no DailyFeed exists yet for today.
    await this.prisma.dailyFeed.updateMany({
      where: { userId, date: today },
      data: { supportPhraseId: newPhrase.id },
    });

    return newPhrase;
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private buildResponse(
    date: string,
    horoscope: { main: string; detailed: string | null; advice: string; moon: string; aspect: string },
    supportPhrase: { text: string },
    holiday: { title: string } | null,
  ) {
    return {
      date,
      horoscope: {
        main:     horoscope.main,
        detailed: horoscope.detailed ?? horoscope.main,
        advice:   horoscope.advice,
        moon:     horoscope.moon,
        aspect:   horoscope.aspect,
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
        const day   = parts.find(p => p.type === 'day')?.value   ?? '';
        const month = parts.find(p => p.type === 'month')?.value ?? '';
        if (day && month) return `${day}.${month}`;
      } catch {
        // Invalid IANA timezone — fall through to UTC
      }
    }
    const day   = String(now.getUTCDate()).padStart(2, '0');
    const month = String(now.getUTCMonth() + 1).padStart(2, '0');
    return `${day}.${month}`;
  }
}
