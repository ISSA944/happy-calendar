import { GOALS } from './goals.constant'

interface GoalsSelectorProps {
  selected: string[]
  onToggle: (id: string) => void
}

/**
 * Мультивыбор 4 целей. Переиспользуется в шаге 2 онбординга и в Настройках
 * ("Изменить цели" открывает тот же компонент) — ТЗ п. 4.2/4.5.
 */
export function GoalsSelector({ selected, onToggle }: GoalsSelectorProps) {
  return (
    <div className="flex flex-col gap-3">
      {GOALS.map((g) => {
        const isSelected = selected.includes(g.id)
        return (
          <button
            key={g.id}
            type="button"
            onClick={() => onToggle(g.id)}
            className={`flex items-center gap-4 p-4 rounded-2xl text-left transition-all active:scale-[0.98] border ${
              isSelected ? 'bg-primary/[0.08] border-primary/30' : 'bg-white border-outline-variant/20'
            }`}
          >
            <div
              className={`w-11 h-11 flex-shrink-0 rounded-xl flex items-center justify-center ${
                isSelected ? 'bg-white' : 'bg-surface-container-low'
              }`}
            >
              <span
                className="material-symbols-outlined text-primary text-xl"
                style={{ fontVariationSettings: isSelected ? "'FILL' 1" : "'FILL' 0" }}
              >
                {g.icon}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-headline font-semibold text-sm text-on-surface">{g.title}</p>
              <p className="text-xs text-on-surface-variant mt-0.5 leading-snug">{g.sub}</p>
            </div>
            <div
              className={`w-6 h-6 flex-shrink-0 rounded-full border-2 flex items-center justify-center transition-colors ${
                isSelected ? 'bg-primary border-primary' : 'border-outline-variant'
              }`}
            >
              {isSelected && <span className="material-symbols-outlined text-white text-sm">check</span>}
            </div>
          </button>
        )
      })}
    </div>
  )
}
