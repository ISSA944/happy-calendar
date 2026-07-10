import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma';
import { GoalsService } from '../goals';
import { goalTitle } from '../goals';
import { WebPushService } from '../push/web-push.service';
import { todayDdMm, todayDdMmYyyy, dayOfYear } from '../common/date.util';
import { fillName } from '../common/name.util';

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
   * Сегодняшний день заботы: ротация по дню года, с приоритетом дней, тегированных
   * активными целями пользователя (ТЗ п. 6.1, логика prototype personalFor()).
   */
  async getToday(userId: string): Promise<PersonalCareView | null> {
    const [prefs, user, activeGoals, allDays] = await Promise.all([
      this.prisma.prefs.findUnique({ where: { userId } }),
      this.prisma.user.findUnique({ where: { id: userId }, select: { name: true } }),
      this.goals.activeGoalIds(userId),
      this.prisma.personalCareDay.findMany({ orderBy: { id: 'asc' } }),
    ]);

    if (allDays.length === 0) return null;

    const matched = activeGoals.length
      ? allDays.filter((d) => d.goalTags.some((t) => activeGoals.includes(t)))
      : [];
    const pool = matched.length ? matched : allDays;

    const idx = dayOfYear(prefs?.timezone) % pool.length;
    const day = pool[idx];

    const dateKey = todayDdMmYyyy(prefs?.timezone);
    const done = await this.prisma.personalCareCompletion.findUnique({
      where: { userId_date: { userId, date: dateKey } },
      select: { id: true },
    });

    return {
      id: day.id,
      title: day.title,
      task: fillName(day.task, user?.name),
      affirmation: day.affirmation,
      goalTags: day.goalTags,
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
    const [prefs, user, careDay] = await Promise.all([
      this.prisma.prefs.findUnique({ where: { userId } }),
      this.prisma.user.findUnique({ where: { id: userId }, select: { name: true } }),
      this.prisma.personalCareDay.findUnique({ where: { id: careDayId } }),
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

    await this.prisma.personalCareCompletion.create({
      data: { userId, personalCareDayId: careDayId, date: dateKey },
    });

    // Вехи — только по активным целям, чьи теги есть у выполненного дня (ТЗ п. 6.4).
    const activeGoals = await this.goals.activeGoalIds(userId);
    const relevantGoals = careDay.goalTags.filter((t) => activeGoals.includes(t));

    const hits: MilestoneHit[] = [];
    for (const goalId of relevantGoals) {
      const count = await this.goals.progressFor(userId, goalId); // уже включает свежий зачёт
      const template = await this.prisma.pushMilestoneTemplate.findUnique({ where: { milestone: count } });
      if (template) {
        hits.push({ goalId, goalTitle: goalTitle(goalId), count, emoji: template.emoji });
      }
    }

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
