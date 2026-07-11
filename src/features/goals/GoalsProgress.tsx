import type { GoalView } from '../../store/app.store'
import { plural } from '../../utils/plural'
import { goalPhrase } from './goalPhrase'
import { GOALS } from './goals.constant'

interface GoalsProgressProps {
  goals: GoalView[]
  /** Вызывается при клике «Вернуть цель» на неактивной цели с прогрессом (ТЗ п. 4.5). */
  onReactivate?: (id: string) => void
  /** compact — для мини-блока на главной: без фразы под баром, без «Вернуть цель». */
  compact?: boolean
}

const MILESTONE_STEP = 5

export function GoalsProgress({ goals, onReactivate, compact = false }: GoalsProgressProps) {
  // Показываем активные + неактивные с прогрессом (ТЗ: прогресс сохраняется после отключения).
  const visible = goals.filter((g) => g.active || g.progress > 0)

  if (!visible.length) {
    return (
      <p className="text-sm text-on-surface-variant">
        Цели пока не выбраны.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      {visible.map((g) => {
        const icon = GOALS.find((x) => x.id === g.id)?.icon ?? 'spa'
        const segmentPct = Math.min(100, ((g.progress % MILESTONE_STEP) / MILESTONE_STEP) * 100)
        const pct = g.progress > 0 && g.progress % MILESTONE_STEP === 0 ? 100 : segmentPct

        return (
          <div key={g.id} className={g.active ? '' : 'opacity-60'}>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 flex-shrink-0 rounded-xl bg-primary/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-base">{icon}</span>
              </div>
              <span className="flex-1 min-w-0 text-sm font-semibold text-on-surface truncate">
                {g.title}
                {!g.active && (
                  <span className="ml-2 text-[11px] font-semibold text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full">
                    не активна
                  </span>
                )}
              </span>
              <span className="text-xs font-semibold text-on-surface-variant whitespace-nowrap">
                {g.progress} {plural(g.progress, 'день', 'дня', 'дней')}
              </span>
            </div>
            <div className="h-2 rounded-full bg-surface-container-high overflow-hidden">
              <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
            </div>
            {!compact && (
              <div className="flex items-start gap-2 bg-primary/[0.07] rounded-xl px-3 py-2 mt-2">
                <span className="material-symbols-outlined text-primary text-base flex-shrink-0 mt-0.5">favorite</span>
                <p className="text-xs text-primary leading-relaxed">{goalPhrase(g.progress)}</p>
              </div>
            )}
            {!compact && !g.active && g.progress > 0 && onReactivate && (
              <button
                type="button"
                onClick={() => onReactivate(g.id)}
                className="flex items-center gap-1 text-xs font-semibold text-primary mt-2"
              >
                <span className="material-symbols-outlined text-sm">restart_alt</span>
                Вернуть цель — прогресс сохранится
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}
