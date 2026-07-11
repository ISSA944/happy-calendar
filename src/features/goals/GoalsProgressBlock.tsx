import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../../store'
import { GoalsProgress } from './GoalsProgress'

/** Мини-блок «Твои цели» на главной (ТЗ п. 4.3/6.4) — «Изменить →» ведёт в Настройки. */
export function GoalsProgressBlock() {
  const navigate = useNavigate()
  const goals = useAppStore((s) => s.goals)

  return (
    <section>
      <div className="flex items-baseline justify-between mb-3 px-1">
        <h2 className="font-headline text-lg font-bold text-on-surface">Твои цели</h2>
        <button onClick={() => navigate('/settings')} className="text-xs font-semibold text-primary">
          Изменить →
        </button>
      </div>
      <div className="bg-surface-container-lowest rounded-[1.5rem] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
        <GoalsProgress goals={goals} compact />
      </div>
    </section>
  )
}
