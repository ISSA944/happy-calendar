import { useCallback, useState } from 'react'
import { motion, type Variants } from 'framer-motion'
import { BottomSheet } from '../../components/ui/BottomSheet'
import type { PersonalCareView } from '../../store/app.store'
import { GOALS } from '../goals/goals.constant'
import { ThemeArt } from '../holidays/ThemeArt'
import { PersonalCareContent } from './PersonalCareSheet'

interface PersonalCareListSheetProps {
  isOpen: boolean
  onClose: () => void
  /** Карточки дня заботы — одна на каждую активную цель юзера (1-4), см. PersonalCareView[]. */
  items: PersonalCareView[]
}

// Тот же приём, что в HolidayListSheet: список → тап по строке → слайд в детальную карточку
// внутри того же шита, а не закрытие одного sheet и открытие другого.
const slideVariants: Variants = {
  enter: { x: 36, opacity: 0 },
  center: { x: 0, opacity: 1 },
}
const SLIDE_TRANSITION = { duration: 0.22, ease: [0.22, 1, 0.36, 1] as const }

/**
 * «Забота о себе» на одну или несколько целей (ТЗ п. 6.1, попап по каждой цели). При 1 активной
 * цели список пропускается — сразу открывается карточка задания, как раньше. При >1 — список
 * целей (иконка+название), тап по строке открывает карточку именно этой цели.
 */
export function PersonalCareListSheet({ isOpen, onClose, items }: PersonalCareListSheetProps) {
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null)
  const [isCelebrating, setIsCelebrating] = useState(false)

  const selected = selectedGoalId
    ? (items.find((c) => c.goalTags.includes(selectedGoalId)) ?? null)
    : (items.length === 1 ? items[0] : null)

  const goBackToList = useCallback(() => setSelectedGoalId(null), [])

  // Полное закрытие шита — сбрасываем выбор и веху, чтобы следующее открытие начиналось с чистого листа.
  const handleClose = useCallback(() => {
    onClose()
    setSelectedGoalId(null)
    setIsCelebrating(false)
  }, [onClose])

  const selectedGoalMeta = selected ? GOALS.find((g) => g.id === selected.goalTags[0]) : null

  const title = isCelebrating
    ? undefined
    : selected
      ? (items.length > 1 ? (
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={goBackToList}
              className="w-8 h-8 -ml-1 mr-1 flex items-center justify-center text-primary active:opacity-60 flex-shrink-0"
              aria-label="Назад"
            >
              <span className="material-symbols-outlined text-[22px]">chevron_left</span>
            </button>
            <h2 className="font-headline text-lg font-bold text-on-surface truncate min-w-0">
              {selectedGoalMeta?.title ?? selected.title}
            </h2>
          </div>
        ) : 'Персональный день')
      : 'Забота о себе'

  return (
    <BottomSheet isOpen={isOpen} onClose={handleClose} title={title} hideDragIndicator={isCelebrating}>
      <motion.div layout="size" className="relative overflow-hidden">
        {selected ? (
          <motion.div
            key={`care-${selected.goalTags[0]}`}
            variants={slideVariants}
            initial="enter"
            animate="center"
            transition={SLIDE_TRANSITION}
            style={{ willChange: 'transform, opacity' }}
          >
            <PersonalCareContent care={selected} onClose={handleClose} onCelebratingChange={setIsCelebrating} />
          </motion.div>
        ) : (
          <motion.div
            key="list"
            variants={slideVariants}
            initial="enter"
            animate="center"
            transition={SLIDE_TRANSITION}
            style={{ willChange: 'transform, opacity' }}
            className="px-5 pb-6 flex flex-col gap-3"
          >
            <p className="text-sm text-on-surface-variant -mt-1">У тебя несколько целей — вот день заботы по каждой.</p>
            {items.map((item) => {
              const goalId = item.goalTags[0]
              const meta = GOALS.find((g) => g.id === goalId)
              return (
                <button
                  key={goalId}
                  onClick={() => setSelectedGoalId(goalId)}
                  className="flex items-center gap-3 bg-white rounded-2xl p-4 shadow-[0_2px_10px_rgba(0,0,0,0.04)] active:scale-[0.98] transition-transform text-left"
                >
                  <div className="w-11 h-11 flex-shrink-0 rounded-xl overflow-hidden">
                    <ThemeArt themeKey={item.themeKey} className="w-full h-full" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="block text-[10px] font-bold text-primary uppercase tracking-wide">{meta?.title ?? goalId}</span>
                    <span className="block font-semibold text-sm text-on-surface truncate">{item.title}</span>
                  </div>
                  {item.doneToday && (
                    <span className="material-symbols-outlined text-primary text-lg flex-shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>
                      check_circle
                    </span>
                  )}
                  <span className="material-symbols-outlined text-on-surface-variant text-lg flex-shrink-0">chevron_right</span>
                </button>
              )
            })}
          </motion.div>
        )}
      </motion.div>
    </BottomSheet>
  )
}
