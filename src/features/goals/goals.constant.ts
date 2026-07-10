// Зеркало backend/src/goals/goals.constant.ts — держим id/title/sub идентичными,
// чтобы прогресс/ответы API совпадали по названиям без доп. похода на бэк за списком.
export const GOALS = [
  { id: 'calm', title: 'Стать спокойнее', sub: 'меньше тревоги, больше внутренней опоры', icon: 'spa' },
  { id: 'hear', title: 'Научиться слышать себя', sub: 'свои чувства, желания и настоящие потребности', icon: 'favorite' },
  { id: 'food', title: 'Здоровые привычки в еде', sub: 'мягкая забота о себе через питание', icon: 'nutrition' },
  { id: 'move', title: 'Больше двигаться', sub: 'забота о себе начинается с тела', icon: 'directions_run' },
] as const

export type GoalId = (typeof GOALS)[number]['id']
