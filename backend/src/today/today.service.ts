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
    const today = this.getTodayDateStr();

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

  /** Called by patchMood to replace only the support phrase in today's feed. */
  async replaceSupportPhrase(userId: string, mood: string, text: string) {
    const today = this.getTodayDateStr();

    const newPhrase = await this.prisma.supportPhrase.create({
      data: { mood, text },
    });

    await this.prisma.dailyFeed.upsert({
      where: { userId_date: { userId, date: today } },
      update: { supportPhraseId: newPhrase.id },
      create: { userId, date: today, supportPhraseId: newPhrase.id },
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

  private getTodayDateStr(): string {
    const now = new Date();
    const day   = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${day}.${month}`;
  }
}
