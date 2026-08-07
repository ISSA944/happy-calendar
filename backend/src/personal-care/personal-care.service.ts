import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma';
import { GoalsService } from '../goals';
import { GOAL_IDS, goalTitle } from '../goals';
import { WebPushService } from '../push/web-push.service';
import { todayDdMmYyyy, dayOfYear } from '../common/date.util';
import { fillName } from '../common/name.util';
import type { PersonalCareDay } from '@prisma/client';

export interface PersonalCareView {
  id: string;
  title: string;
  task: string; // {имя} уже подставлено
  affirmation: string;
  goalTags: string[];
  themeKey: string;
  imageUrl: string | null;
  doneToday: boolean;
}

// Поля задание/совет на PersonalCareDay для каждой из 4 целей (ТЗ: контент от клиента различается
// по цели — xlsx «Личные праздники» даёт отдельную пару task/advice на каждую из calm/hear/food/move).
const VARIANT_FIELDS: Record<
  string,
  { task: keyof PersonalCareDay; advice: keyof PersonalCareDay }
> = {
  calm: { task: 'calmTask', advice: 'calmAdvice' },
  hear: { task: 'hearTask', advice: 'hearAdvice' },
  food: { task: 'foodTask', advice: 'foodAdvice' },
  move: { task: 'moveTask', advice: 'moveAdvice' },
};

/**
 * Все активные цели юзера, в стабильном порядке GOAL_IDS (не порядке из БД) — показываем КАЖДУЮ
 * сразу отдельной карточкой (до 4), а не ротируем одну на день. Для UI при отсутствии активных
 * целей доступен дефолт calm; фоновые уведомления отключают этот fallback через опцию getToday().
 */
function orderedGoalIds(
  activeGoals: string[],
  fallbackWhenNoActiveGoals: boolean,
): string[] {
  const ordered = GOAL_IDS.filter((id) => activeGoals.includes(id));
  return ordered.length || !fallbackWhenNoActiveGoals ? ordered : [GOAL_IDS[0]];
}

export interface MilestoneHit {
  goalId: string;
  goalTitle: string;
  count: number;
  emoji: string;
}

export interface CompleteResult {
  alreadyDone: boolean;
  milestoneHits: MilestoneHit[];
}

@Injectable()
export class PersonalCareService {
  private readonly logger = new Logger(PersonalCareService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly goals: GoalsService,
    private readonly webPush: WebPushService,
  ) {}

  private async resolveImageUrl(
    careDayId: string,
    themeKey: string,
  ): Promise<string | null> {
    const direct = await this.prisma.holidayImage.findFirst({
      where: { personalCareDayId: careDayId },
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
   * Сегодняшний день заботы: адресуется строго по дню года (реальный клиентский контент, xlsx
   * «Личные праздники» — 365 дней). Если для номера дня строки нет (366-й день високосного года) —
   * фолбэк на день 1, чтобы блок никогда не пустовал. Если у юзера активно несколько целей —
   * возвращаем карточку НА КАЖДУЮ (до 4), а не одну ротируемую: title/themeKey/imageUrl общие на
   * весь день, различаются только task/affirmation/goalTags/doneToday (см. VARIANT_FIELDS).
   * fallbackWhenNoActiveGoals по умолчанию true для совместимости с Home; cron передаёт false.
   */
  async getToday(
    userId: string,
    options: { fallbackWhenNoActiveGoals?: boolean } = {},
  ): Promise<PersonalCareView[]> {
    const [prefs, user, activeGoals] = await Promise.all([
      this.prisma.prefs.findUnique({ where: { userId } }),
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { name: true },
      }),
      this.goals.activeGoalIds(userId),
    ]);

    const doy = dayOfYear(prefs?.timezone);
    const day =
      (await this.prisma.personalCareDay.findUnique({
        where: { dayOfYear: doy },
      })) ??
      (await this.prisma.personalCareDay.findUnique({
        where: { dayOfYear: 1 },
      }));
    if (!day) return [];

    const goalIds = orderedGoalIds(
      activeGoals,
      options.fallbackWhenNoActiveGoals ?? true,
    );
    const dateKey = todayDdMmYyyy(prefs?.timezone);
    const imageUrl = await this.resolveImageUrl(day.id, day.themeKey);

    const completions = await this.prisma.personalCareCompletion.findMany({
      where: { userId, date: dateKey, goalId: { in: goalIds } },
      select: { goalId: true },
    });
    const doneGoalIds = new Set(completions.map((c) => c.goalId));

    return goalIds.map((goalId) => {
      const { task: taskField, advice: adviceField } = VARIANT_FIELDS[goalId];
      return {
        id: day.id,
        title: day.title,
        task: fillName(day[taskField] as string, user?.name),
        affirmation: day[adviceField] as string,
        goalTags: [goalId],
        themeKey: day.themeKey,
        imageUrl,
        doneToday: doneGoalIds.has(goalId),
      };
    });
  }

  /**
   * «Я сделала это»: засчитывает день заботы для КОНКРЕТНОЙ цели (идемпотентно — один зачёт
   * на пару (день, цель); при нескольких активных целях каждая карточка засчитывается
   * независимо своей кнопкой), считает попадания в вехи и шлёт отдельный push по достигнутой цели.
   * goalId приходит от клиента — он же был показан на конкретной карточке в
   * getToday(), проверяем только, что это один из 4 известных id (защита от мусорных значений).
   */
  async complete(
    userId: string,
    careDayId: string,
    goalId: string,
  ): Promise<CompleteResult> {
    if (!VARIANT_FIELDS[goalId]) throw new NotFoundException('Unknown goal id');

    const [prefs, user, careDay] = await Promise.all([
      this.prisma.prefs.findUnique({ where: { userId } }),
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { name: true },
      }),
      this.prisma.personalCareDay.findUnique({ where: { id: careDayId } }),
    ]);
    if (!careDay) throw new NotFoundException('Personal care day not found');

    const dateKey = todayDdMmYyyy(prefs?.timezone);

    // Идемпотентность: один зачёт на (день, цель), повторное нажатие не наращивает прогресс.
    const existing = await this.prisma.personalCareCompletion.findUnique({
      where: { userId_date_goalId: { userId, date: dateKey, goalId } },
      select: { id: true },
    });
    if (existing) {
      return { alreadyDone: true, milestoneHits: [] };
    }

    await this.prisma.personalCareCompletion.create({
      data: { userId, personalCareDayId: careDayId, date: dateKey, goalId },
    });

    const count = await this.goals.progressFor(userId, goalId); // уже включает свежий зачёт
    const template = await this.prisma.pushMilestoneTemplate.findUnique({
      where: { milestone: count },
    });
    const hits: MilestoneHit[] = template
      ? [{ goalId, goalTitle: goalTitle(goalId), count, emoji: template.emoji }]
      : [];

    if (hits.length) {
      await this.sendMilestonePushes(userId, user?.name ?? null, hits);
    }

    return { alreadyDone: false, milestoneHits: hits };
  }

  /** Каждая достигнутая веха отправляется отдельным push с явным названием цели. */
  private async sendMilestonePushes(
    userId: string,
    name: string | null,
    hits: MilestoneHit[],
  ) {
    const subs = await this.prisma.webPushSubscription.findMany({
      where: { userId },
    });
    if (!subs.length) return;

    for (const hit of hits) {
      const template = await this.prisma.pushMilestoneTemplate.findUnique({
        where: { milestone: hit.count },
      });
      if (!template) continue;

      const body = `${fillName(template.body, name)} Цель: «${hit.goalTitle}».`;
      const title = `${template.emoji} ${template.title}`;

      let anySent = false;
      for (const sub of subs) {
        const ok = await this.webPush.send(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          {
            title,
            body,
            data: {
              type: 'goal_milestone',
              milestone: hit.count,
              url: 'https://yoyojoy.online/home',
            },
          },
        );
        if (ok) anySent = true;
      }

      if (anySent) {
        await this.prisma.notification.create({
          data: { userId, type: 'goal_milestone', status: 'sent', title, body },
        });
      }
    }
  }
}
