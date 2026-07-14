import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma';
import { GoalsService } from '../goals';
import { GOAL_IDS, goalTitle } from '../goals';
import { WebPushService } from '../push/web-push.service';
import { todayDdMm, todayDdMmYyyy, dayOfYear } from '../common/date.util';
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
const VARIANT_FIELDS: Record<string, { task: keyof PersonalCareDay; advice: keyof PersonalCareDay }> = {
  calm: { task: 'calmTask', advice: 'calmAdvice' },
  hear: { task: 'hearTask', advice: 'hearAdvice' },
  food: { task: 'foodTask', advice: 'foodAdvice' },
  move: { task: 'moveTask', advice: 'moveAdvice' },
};

/**
 * Какую из целей юзера показать в этот день года: детерминированная ротация по dayOfYear среди
 * его активных целей (в стабильном порядке GOAL_IDS, не порядке из БД), чтобы за несколько дней
 * подряд юзер с несколькими целями увидел контент по каждой из них по очереди. Если активных целей
 * нет — дефолт на первую цель (calm), чтобы блок не пустовал.
 */
function pickGoalId(doy: number, activeGoals: string[]): string {
  const ordered = GOAL_IDS.filter((id) => activeGoals.includes(id));
  const pool = ordered.length ? ordered : [GOAL_IDS[0]];
  return pool[doy % pool.length];
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

  private async resolveImageUrl(careDayId: string, themeKey: string): Promise<string | null> {
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
   * фолбэк на день 1, чтобы блок никогда не пустовал. Цель выбирается ротацией среди активных
   * целей юзера, см. pickGoalId().
   */
  async getToday(userId: string): Promise<PersonalCareView | null> {
    const [prefs, user, activeGoals] = await Promise.all([
      this.prisma.prefs.findUnique({ where: { userId } }),
      this.prisma.user.findUnique({ where: { id: userId }, select: { name: true } }),
      this.goals.activeGoalIds(userId),
    ]);

    const doy = dayOfYear(prefs?.timezone);
    const day =
      (await this.prisma.personalCareDay.findUnique({ where: { dayOfYear: doy } })) ??
      (await this.prisma.personalCareDay.findUnique({ where: { dayOfYear: 1 } }));
    if (!day) return null;

    const goalId = pickGoalId(doy, activeGoals);
    const { task: taskField, advice: adviceField } = VARIANT_FIELDS[goalId];

    const dateKey = todayDdMmYyyy(prefs?.timezone);
    const done = await this.prisma.personalCareCompletion.findUnique({
      where: { userId_date: { userId, date: dateKey } },
      select: { id: true },
    });

    return {
      id: day.id,
      title: day.title,
      task: fillName(day[taskField] as string, user?.name),
      affirmation: day[adviceField] as string,
      goalTags: [goalId],
      themeKey: day.themeKey,
      imageUrl: await this.resolveImageUrl(day.id, day.themeKey),
      doneToday: Boolean(done),
    };
  }

  /**
   * «Я сделала это»: засчитывает день заботы (идемпотентно — один зачёт в сутки),
   * считает попадания в вехи по активным целям и шлёт пуш(и) по правилу группировки (ТЗ п. 3).
   */
  async complete(userId: string, careDayId: string): Promise<CompleteResult> {
    const [prefs, user, careDay, activeGoals] = await Promise.all([
      this.prisma.prefs.findUnique({ where: { userId } }),
      this.prisma.user.findUnique({ where: { id: userId }, select: { name: true } }),
      this.prisma.personalCareDay.findUnique({ where: { id: careDayId } }),
      this.goals.activeGoalIds(userId),
    ]);
    if (!careDay) throw new NotFoundException('Personal care day not found');

    const dateKey = todayDdMmYyyy(prefs?.timezone);

    // Идемпотентность: один зачёт в сутки, повторное нажатие не наращивает прогресс.
    const existing = await this.prisma.personalCareCompletion.findUnique({
      where: { userId_date: { userId, date: dateKey } },
      select: { id: true },
    });
    if (existing) {
      return { alreadyDone: true, milestoneHits: [] };
    }

    // Та же цель, что была показана в getToday() — пересчитываем тем же детерминированным
    // правилом (не доверяем клиенту передавать её отдельным параметром).
    const doy = dayOfYear(prefs?.timezone);
    const goalId = pickGoalId(doy, activeGoals);

    await this.prisma.personalCareCompletion.create({
      data: { userId, personalCareDayId: careDayId, date: dateKey, goalId },
    });

    const count = await this.goals.progressFor(userId, goalId); // уже включает свежий зачёт
    const template = await this.prisma.pushMilestoneTemplate.findUnique({ where: { milestone: count } });
    const hits: MilestoneHit[] = template
      ? [{ goalId, goalTitle: goalTitle(goalId), count, emoji: template.emoji }]
      : [];

    if (hits.length) {
      await this.sendMilestonePushes(userId, user?.name ?? null, hits);
    }

    return { alreadyDone: false, milestoneHits: hits };
  }

  /**
   * Правило группировки (ТЗ п. 3, лист «Как использовать»):
   * одна веха у нескольких целей → ОДИН пуш (цели перечислены); разные вехи → отдельные пуши.
   */
  private async sendMilestonePushes(userId: string, name: string | null, hits: MilestoneHit[]) {
    const subs = await this.prisma.webPushSubscription.findMany({ where: { userId } });
    if (!subs.length) return;

    // Группируем по номеру вехи.
    const byMilestone = new Map<number, MilestoneHit[]>();
    for (const h of hits) {
      const arr = byMilestone.get(h.count) ?? [];
      arr.push(h);
      byMilestone.set(h.count, arr);
    }

    for (const [milestone, group] of byMilestone) {
      const template = await this.prisma.pushMilestoneTemplate.findUnique({ where: { milestone } });
      if (!template) continue;

      let body = fillName(template.body, name);
      if (group.length > 1) {
        const titles = group.map((g) => `«${g.goalTitle}»`).join(', ');
        body += ` Сразу по целям: ${titles}.`;
      }
      const title = `${template.emoji} ${template.title}`;

      let anySent = false;
      for (const sub of subs) {
        const ok = await this.webPush.send(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          { title, body, data: { type: 'goal_milestone', milestone, url: 'https://yoyojoy.online/home' } },
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
