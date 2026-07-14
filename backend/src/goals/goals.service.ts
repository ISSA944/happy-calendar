import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma';
import { GOALS, GOAL_IDS } from './goals.constant';

export interface GoalView {
  id: string;
  title: string;
  sub: string;
  emoji: string;
  active: boolean;
  progress: number; // число выполненных дней заботы с тегом этой цели
}

@Injectable()
export class GoalsService {
  private readonly logger = new Logger(GoalsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Прогресс цели = число выполненных дней заботы, засчитанных именно за эту цель
   * (personalCareCompletion.goalId — какая цель была показана в тот день, ТЗ п. 6.1).
   * Считается независимо от статуса active (ТЗ п. 4.5: прогресс сохраняется при отключении).
   */
  async progressFor(userId: string, goalId: string): Promise<number> {
    return this.prisma.personalCareCompletion.count({ where: { userId, goalId } });
  }

  /** Список 4 целей с флагом active и прогрессом. Неактивные с прогрессом тоже возвращаются. */
  async getGoalsForUser(userId: string): Promise<GoalView[]> {
    const [userGoals, ...counts] = await Promise.all([
      this.prisma.userGoal.findMany({ where: { userId } }),
      ...GOALS.map((g) => this.progressFor(userId, g.id)),
    ]);

    const activeMap = new Map(userGoals.map((ug) => [ug.goalId, ug.active]));

    return GOALS.map((g, i) => ({
      id: g.id,
      title: g.title,
      sub: g.sub,
      emoji: g.emoji,
      active: activeMap.get(g.id) ?? false,
      progress: counts[i],
    }));
  }

  /** Активные goalId пользователя (для подбора дней заботы и вех-пушей). */
  async activeGoalIds(userId: string): Promise<string[]> {
    const rows = await this.prisma.userGoal.findMany({
      where: { userId, active: true },
      select: { goalId: true },
    });
    return rows.map((r) => r.goalId);
  }

  /**
   * Устанавливает выбор целей: выбранные → active=true, остальные → active=false.
   * Реактивация не обнуляет прогресс (он в completions). Игнорирует неизвестные id.
   */
  async setGoals(userId: string, selected: string[]): Promise<GoalView[]> {
    const chosen = new Set(selected.filter((id) => GOAL_IDS.includes(id as never)));
    this.logger.log(`setGoals user=${userId} selected=[${[...chosen].join(',')}]`);

    await Promise.all(
      GOAL_IDS.map((goalId) =>
        this.prisma.userGoal.upsert({
          where: { userId_goalId: { userId, goalId } },
          update: { active: chosen.has(goalId) },
          create: { userId, goalId, active: chosen.has(goalId) },
        }),
      ),
    );

    return this.getGoalsForUser(userId);
  }
}
