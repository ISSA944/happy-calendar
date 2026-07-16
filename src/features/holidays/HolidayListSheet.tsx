import { useCallback, useState } from 'react'
import { motion, type Variants } from 'framer-motion'
import { BottomSheet } from '../../components/ui/BottomSheet'
import type { HolidayCard } from '../../store/app.store'
import { PostcardContent } from './PostcardSheet'
import { ThemeArt } from './ThemeArt'

interface HolidayListSheetProps {
  isOpen: boolean
  onClose: () => void
  holidays: HolidayCard[]
}

// Без AnimatePresence/mode="wait": та же ловушка, что уже чинили на HomePage — двухфазная
// choreography (сначала дождаться exit, потом mount) виснет, если requestAnimationFrame не
// тикает (свёрнутая/неактивная вкладка бросает анимацию на первом кадре). Простой keyed remount
// надёжнее кросс-контекстно и всё равно даёт нужный slide-in при каждой смене экрана.
const slideVariants: Variants = {
  enter: { x: 36, opacity: 0, scale: 0.98 },
  center: { x: 0, opacity: 1, scale: 1 },
}
const SLIDE_TRANSITION = { duration: 0.22, ease: [0.22, 1, 0.36, 1] as const }

/** Список праздников на дату (ТЗ п. 5.1) → тап по строке открывает открытку внутри того же шита. */
export function HolidayListSheet({ isOpen, onClose, holidays }: HolidayListSheetProps) {
  const [selected, setSelected] = useState<HolidayCard | null>(null)

  const goToCard = useCallback((h: HolidayCard) => setSelected(h), [])
  const goBackToList = useCallback(() => setSelected(null), [])

  // Полное закрытие шита — сбрасываем выбор, чтобы следующее открытие начиналось со списка.
  const handleClose = useCallback(() => {
    onClose()
    setSelected(null)
  }, [onClose])

  const hasRu = holidays.some((h) => h.scope === 'ru')
  const note = hasRu ? 'Российские праздники на сегодня.' : 'Сегодня нет российских праздников — показываем международные.'

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={handleClose}
      title={
        selected ? (
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={goBackToList}
              className="w-8 h-8 -ml-1 mr-1 flex items-center justify-center text-primary active:opacity-60 flex-shrink-0"
              aria-label="Назад"
            >
              <span className="material-symbols-outlined text-[22px]">chevron_left</span>
            </button>
            <h2 className="font-headline text-lg font-bold text-on-surface truncate min-w-0">{selected.title}</h2>
          </div>
        ) : (
          'Праздники сегодня'
        )
      }
    >
      <div className="relative overflow-hidden">
        {selected ? (
          <motion.div
            key={`card-${selected.id}`}
            variants={slideVariants}
            initial="enter"
            animate="center"
            transition={SLIDE_TRANSITION}
            style={{ willChange: 'transform, opacity' }}
          >
            <PostcardContent holiday={selected} />
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
            <p className="text-sm text-on-surface-variant -mt-1">{note}</p>
            {holidays.map((h) => (
              <button
                key={h.id}
                onClick={() => goToCard(h)}
                className="flex items-center gap-3 bg-white rounded-2xl p-4 shadow-[0_2px_10px_rgba(0,0,0,0.04)] active:scale-[0.98] transition-transform text-left"
              >
                <div className="w-11 h-11 flex-shrink-0 rounded-xl overflow-hidden">
                  <ThemeArt themeKey={h.themeKey} className="w-full h-full" />
                </div>
                <span className="flex-1 min-w-0 font-semibold text-sm text-on-surface truncate">{h.title}</span>
                {h.scope === 'intl' && (
                  <span className="text-[10px] font-bold text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full flex-shrink-0">
                    Международный
                  </span>
                )}
                <span className="material-symbols-outlined text-on-surface-variant text-lg flex-shrink-0">chevron_right</span>
              </button>
            ))}
          </motion.div>
        )}
      </div>
    </BottomSheet>
  )
}
