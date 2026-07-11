import { useCallback, useState } from 'react'
import type { GoalView } from '../../store/app.store'

/**
 * Открыть/переключить/сохранить редактор целей (BottomSheet + GoalsSelector) — единая логика
 * для Настроек и главной, чтобы не дублировать руками (ТЗ п. 4.5 «Изменить цели»).
 */
export function useGoalsEditor(goals: GoalView[], setGoals: (selected: string[]) => Promise<void>) {
  const [isOpen, setIsOpen] = useState(false)
  const [editingGoals, setEditingGoals] = useState<string[]>([])

  const open = useCallback(() => {
    setEditingGoals(goals.filter((g) => g.active).map((g) => g.id))
    setIsOpen(true)
  }, [goals])

  const close = useCallback(() => setIsOpen(false), [])

  const toggle = useCallback((id: string) => {
    setEditingGoals((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }, [])

  const save = useCallback(async () => {
    await setGoals(editingGoals)
    setIsOpen(false)
  }, [editingGoals, setGoals])

  const handleReactivateGoal = useCallback((id: string) => {
    const current = goals.filter((g) => g.active).map((g) => g.id)
    void setGoals([...current, id])
  }, [goals, setGoals])

  return { isOpen, editingGoals, open, close, toggle, save, handleReactivateGoal }
}
