import { PrismaService } from '../prisma';
import { HolidaysService } from './holidays.service';

describe('HolidaysService postcards', () => {
  it('uses the cute postcard as the list thumbnail for an installed pack', async () => {
    const holidayImageFindFirst = jest.fn();
    const prisma = {
      prefs: {
        findUnique: jest.fn().mockResolvedValue({ timezone: 'UTC' }),
      },
      calendarHoliday: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'holiday-1',
            date: '25.01',
            title: 'Праздник дат и планов',
            themeKey: 'Работа и достижения',
            scope: 'ru',
            postcardKey: '01-114',
            postcardPack: 'calendar/01/v8-20260808',
          },
        ]),
      },
      holidayImage: { findFirst: holidayImageFindFirst },
    };
    const service = new HolidaysService(prisma as unknown as PrismaService);

    const cards = await service.getTodayHolidays('user-1');

    expect(cards[0]).toMatchObject({
      postcardReady: true,
      imageUrl:
        'https://yoyojoy.online/postcards/calendar/01/v8-20260808/01-114_cute.webp',
    });
    expect(holidayImageFindFirst).not.toHaveBeenCalled();
  });

  it('returns the selected tone image from an installed postcard pack', async () => {
    const holidayImageFindFirst = jest.fn();
    const prisma = {
      calendarHoliday: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'holiday-1',
          date: '25.01',
          title: 'Праздник дат и планов',
          cute: 'Милый текст',
          humor: 'Смешной текст',
          cynical: 'Циничный текст',
          themeKey: 'Работа и достижения',
          scope: 'ru',
          postcardKey: '01-114',
          postcardPack: 'calendar/01/v8-20260808',
        }),
      },
      holidayImage: { findFirst: holidayImageFindFirst },
    };
    const service = new HolidaysService(prisma as unknown as PrismaService);

    const card = await service.getCard('holiday-1', 'humor');

    expect(card).toMatchObject({
      postcardReady: true,
      imageUrl:
        'https://yoyojoy.online/postcards/calendar/01/v8-20260808/01-114_humor.webp',
      tone: 'humor',
      text: 'Смешной текст',
    });
    expect(holidayImageFindFirst).not.toHaveBeenCalled();
  });

  it('keeps the legacy themed-image fallback when no postcard is installed', async () => {
    const prisma = {
      calendarHoliday: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'holiday-2',
          date: '09.08',
          title: 'Праздник без готовой открытки',
          cute: 'Милый текст',
          humor: 'Смешной текст',
          cynical: 'Циничный текст',
          themeKey: 'Уютные пустяки и радости',
          scope: 'ru',
          postcardKey: null,
          postcardPack: null,
        }),
      },
      holidayImage: {
        findFirst: jest
          .fn()
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce({ url: 'https://images.example/theme.webp' }),
      },
    };
    const service = new HolidaysService(prisma as unknown as PrismaService);

    const card = await service.getCard('holiday-2', 'cute');

    expect(card).toMatchObject({
      postcardReady: false,
      imageUrl: 'https://images.example/theme.webp',
      text: 'Милый текст',
    });
  });
});
