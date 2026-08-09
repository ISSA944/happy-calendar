import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma';
import { todayDdMm } from '../common/date.util';

export type Tone = 'cute' | 'humor' | 'cynical';
export const TONES: Tone[] = ['cute', 'humor', 'cynical'];

export interface HolidayCard {
  id: string;
  date: string;
  title: string;
  scope: string; // 'ru' | 'intl'
  themeKey: string;
  imageUrl: string | null; // null → фронт рисует градиент по themeKey
  postcardReady: boolean;
}

export interface HolidayCardWithText extends HolidayCard {
  tone: Tone;
  text: string;
}

@Injectable()
export class HolidaysService {
  private readonly logger = new Logger(HolidaysService.name);
  private readonly postcardBaseUrl = 'https://yoyojoy.online/postcards';

  constructor(private readonly prisma: PrismaService) {}

  private postcardUrl(
    postcardKey: string | null,
    postcardPack: string | null,
    tone: Tone,
  ): string | null {
    if (!postcardKey || !postcardPack) return null;
    return `${this.postcardBaseUrl}/${postcardPack}/${postcardKey}_${tone}.webp`;
  }

  /**
   * Legacy-фолбэк для праздников без готового пака: сначала прямая привязка
   * HolidayImage, затем картинка темы, затем фронтовый градиент. ТЗ п. 7.3.
   */
  private async resolveImageUrl(
    holidayId: string,
    themeKey: string,
  ): Promise<string | null> {
    const direct = await this.prisma.holidayImage.findFirst({
      where: { calendarHolidayId: holidayId },
      select: { url: true },
    });
    if (direct) return direct.url;
    const byTheme = await this.prisma.holidayImage.findFirst({
      where: { themeKey },
      select: { url: true },
    });
    return byTheme?.url ?? null;
  }

  /**
   * Все праздники на сегодня (дата в TZ пользователя), RU-first.
   * v1: показываем ВСЕ праздники дня (без скрытия intl) — размётки scope от клиента нет.
   * scope влияет только на порядок и бейдж (Россия/Международный).
   */
  async getTodayHolidays(userId: string): Promise<HolidayCard[]> {
    const prefs = await this.prisma.prefs.findUnique({ where: { userId } });
    const date = todayDdMm(prefs?.timezone);

    const rows = await this.prisma.calendarHoliday.findMany({
      where: { date },
      orderBy: [{ scope: 'asc' }, { title: 'asc' }], // 'intl' < 'ru' по алфавиту → инвертируем ниже
    });
    // ru должен идти первым: сортируем вручную (ru → intl), затем по названию.
    rows.sort((a, b) => {
      if (a.scope !== b.scope) return a.scope === 'ru' ? -1 : 1;
      return a.title.localeCompare(b.title, 'ru');
    });

    return Promise.all(
      rows.map(async (h) => {
        const postcardImageUrl = this.postcardUrl(
          h.postcardKey,
          h.postcardPack,
          'cute',
        );
        return {
          id: h.id,
          date: h.date,
          title: h.title,
          scope: h.scope,
          themeKey: h.themeKey,
          imageUrl:
            postcardImageUrl ?? (await this.resolveImageUrl(h.id, h.themeKey)),
          postcardReady: Boolean(postcardImageUrl),
        };
      }),
    );
  }

  /** Открытка конкретного праздника в выбранном тоне. */
  async getCard(id: string, tone: Tone): Promise<HolidayCardWithText> {
    const h = await this.prisma.calendarHoliday.findUnique({ where: { id } });
    if (!h) throw new NotFoundException('Holiday not found');

    const text =
      tone === 'humor' ? h.humor : tone === 'cynical' ? h.cynical : h.cute;

    const postcardImageUrl = this.postcardUrl(
      h.postcardKey,
      h.postcardPack,
      tone,
    );

    return {
      id: h.id,
      date: h.date,
      title: h.title,
      scope: h.scope,
      themeKey: h.themeKey,
      imageUrl:
        postcardImageUrl ?? (await this.resolveImageUrl(h.id, h.themeKey)),
      postcardReady: Boolean(postcardImageUrl),
      tone,
      text,
    };
  }
}
