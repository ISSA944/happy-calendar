import { useAppStore } from '../../store'
import { BottomSheet } from '../../components/ui/BottomSheet'
import { GoalsProgress } from './GoalsProgress'
import { GoalsSelector } from './GoalsSelector'
import { useGoalsEditor } from './useGoalsEditor'

/** Мини-блок «Твои цели» на главной (ТЗ п. 4.3/6.4) — «Изменить →» открывает редактор целей на месте. */
export function GoalsProgressBlock() {
  const goals = useAppStore((s) => s.goals)
  const setGoals = useAppStore((s) => s.setGoals)
  const goalsEditor = useGoalsEditor(goals, setGoals)

  return (
    <section>
      <div className="flex items-baseline justify-between mb-3 px-1">
        <h2 className="font-headline text-lg font-bold text-on-surface">Твои цели</h2>
        <button
          onClick={goalsEditor.open}
          className="inline-flex items-center gap-0.5 text-xs font-semibold text-primary bg-primary/10 pl-3 pr-2 py-1.5 rounded-full active:scale-95 transition-transform"
        >
          Изменить
          <span className="material-symbols-outlined text-[16px]">chevron_right</span>
        </button>
      </div>
      <div className="bg-surface-container-lowest rounded-[1.5rem] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
        <GoalsProgress goals={goals} compact onReactivate={goalsEditor.handleReactivateGoal} />
      </div>

      <BottomSheet isOpen={goalsEditor.isOpen} onClose={goalsEditor.close} title="Твои цели">
        <div className="px-5 pb-6 flex flex-col gap-4">
          <GoalsSelector selected={goalsEditor.editingGoals} onToggle={goalsEditor.toggle} />
          <button
            onClick={goalsEditor.save}
            className="w-full h-12 rounded-full bg-primary-container text-white font-headline font-bold text-sm"
          >
            Сохранить
          </button>
        </div>
      </BottomSheet>
    </section>
  )
}
