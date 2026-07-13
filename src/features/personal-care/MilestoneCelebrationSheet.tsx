import { plural } from '../../utils/plural'
import type { MilestoneHit } from '../../store/app.store'

interface MilestoneCelebrationContentProps {
  hits: MilestoneHit[]
  onClose: () => void
}

/**
 * Содержимое экрана-поздравления при попадании в веху цели (ТЗ п. 6.1/6.4).
 * Презентационный компонент без собственного BottomSheet — рендерится внутри
 * общего шита в PersonalCareSheet, чтобы переход задание→поздравление был
 * одной анимацией, а не закрытием одного sheet и открытием другого.
 */
export function MilestoneCelebrationContent({ hits, onClose }: MilestoneCelebrationContentProps) {
  const isMultiple = hits.length > 1

  return (
    <div className="px-6 pb-8 pt-2 text-center">
      <div className="text-6xl mb-2">{hits[0].emoji}</div>
      <h2 className="font-headline text-xl font-bold text-on-surface mb-2">
        {isMultiple ? 'Сразу несколько вех!' : 'Новая веха!'}
      </h2>
      <p className="text-[15px] text-on-surface-variant leading-relaxed mb-6">
        {isMultiple
          ? 'Сразу несколько твоих целей сделали шаг вперёд. Ты большая молодец.'
          : `${hits[0].count} ${plural(hits[0].count, 'день', 'дня', 'дней')} заботы по цели «${hits[0].goalTitle}». Продолжай в своём тёплом темпе.`}
      </p>
      <div className="flex flex-wrap justify-center gap-3 mb-6">
        {hits.map((h) => (
          <div key={h.goalId} className="flex flex-col items-center gap-1 bg-primary/[0.07] rounded-2xl px-5 py-3">
            <span className="text-3xl">{h.emoji}</span>
            <span className="text-[11px] font-bold text-primary uppercase tracking-wide">
              {h.goalTitle} · {h.count} {plural(h.count, 'день', 'дня', 'дней')}
            </span>
          </div>
        ))}
      </div>
      <button
        onClick={onClose}
        className="w-full h-13 py-4 rounded-full bg-primary-container text-white font-headline font-bold text-sm"
      >
        Спасибо
      </button>
    </div>
  )
}
