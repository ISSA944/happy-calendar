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
    // ── 0. Timezone-aware "today" ──────────────────────────────────────────────
    // Prefs lookup is cheap (PK) and needed for timezone correctness.
    const prefs = await this.prisma.prefs.findUnique({ where: { userId } });
    const today = this.getTodayDateStr(prefs?.timezone ?? undefined);

    // ── 1. DailyFeed hit (DB cache) ────────────────────────────────────────────
    const existingFeed = await this.prisma.dailyFeed.findUnique({
      where: { userId_date: { userId, date: today } },
      include: { horoscope: true, supportPhrase: true, holiday: true },
    });

    if (existingFeed?.horoscope && existingFeed?.supportPhrase) {
      this.logger.log(`getTodayPack DB hit userId=${userId} date=${today}`);
      return this.buildResponse(today, existingFeed.horoscope, existingFeed.supportPhrase, existingFeed.holiday);
    }

    // ── 2. Profile lookup ──────────────────────────────────────────────────────
    const profile = await this.prisma.profile.findUnique({ where: { userId } });
    const zodiacSign = profile?.zodiacSign ?? '';
    const mood       = profile?.currentMood ?? 'Нормально';
    const gender     = profile?.gender ?? 'UNKNOWN';

    // ── 3. Redis hit (shared by zodiacSign + mood + date) ──────────────────────
    const cacheKey = `pack:${zodiacSign}:${mood}:${today}`;
    let pack: AiDailyPack | null = null;

    const cached = await this.redis.get(cacheKey);
    if (cached) {
      this.logger.log(`getTodayPack Redis HIT key=${cacheKey}`);
      pack = JSON.parse(cached) as AiDailyPack;
    }

    // ── 4. AI call on full cache miss ──────────────────────────────────────────
    if (!pack) {
      this.logger.log(`getTodayPack MISS — calling AI key=${cacheKey}`);
      const context: PromptContext = { zodiacSign, mood, gender, date: today };
      pack = await this.ai.generateDailyPack(userId, context);
      await this.redis.set(cacheKey, JSON.stringify(pack), CACHE_TTL_SECONDS);
    }

    // ── 5. Persist to ref tables ───────────────────────────────────────────────
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

    // ── 6. Create DailyFeed (user↔ref join for today) ──────────────────────────
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
    // getTodayPack will create a complete record (horoscope + support) on first home load.
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
