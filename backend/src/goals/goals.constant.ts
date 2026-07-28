// 4 цели (ТЗ п. 4.2). id — стабильный ключ (тег в PersonalCareDay.goalTags и UserGoal.goalId).
// emoji/иконки для UI фронт берёт по id; здесь — источник правды для валидации и текстов пушей.

export const GOALS = [
  {
    id: 'calm',
    title: 'Стать спокойнее',
    sub: 'меньше тревоги, больше внутренней опоры',
    emoji: '🪶',
  },
  {
    id: 'hear',
    title: 'Научиться слышать себя',
    sub: 'свои чувства, желания и настоящие потребности',
    emoji: '♥',
  },
  {
    id: 'food',
    title: 'Здоровые привычки в еде',
    sub: 'мягкая забота о себе через питание',
    emoji: '🍎',
  },
  {
    id: 'move',
    title: 'Больше двигаться',
    sub: 'забота о себе начинается с тела',
    emoji: '〽️',
  },
] as const;

export type GoalId = (typeof GOALS)[number]['id'];

export const GOAL_IDS = GOALS.map((g) => g.id);

export function goalTitle(id: string): string {
  return GOALS.find((g) => g.id === id)?.title ?? id;
}
