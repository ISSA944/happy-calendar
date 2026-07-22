import { useCallback, useMemo, useState } from 'react'
import { motion, type Variants } from 'framer-motion'
import { useAppStore } from '../../store'
import type { PersonalCareView, MilestoneHit } from '../../store/app.store'
import { GOALS } from '../goals/goals.constant'
import { ThemeArt } from '../holidays/ThemeArt'
import { getFullDateStr } from '../../services/content.service'
import { MilestoneCelebrationContent } from './MilestoneCelebrationSheet'

interface PersonalCareContentProps {
  care: PersonalCareView
  /** Полное закрытие всего шита — вызывается и по кнопке «Спасибо» на экране поздравления. */
  onClose: () => void
  /** Хост (PersonalCareListSheet) слушает это, чтобы спрятать заголовок/индикатор шита во время
      поздравления — та же логика, что раньше жила прямо в PersonalCareSheet. */
  onCelebratingChange?: (celebrating: boolean) => void
}

// Без AnimatePresence/mode="wait" — та же ловушка, что уже чинили на HomePage и
// HolidayListSheet: двухфазная choreography (ждать exit, потом mount) виснет, если
// requestAnimationFrame не тикает. Простой keyed remount надёжнее.
// Без scale: у родителя ниже стоит layout="size" (тоже анимирует через transform) — scale на
// ребёнке поверх layout-transform родителя даёт составной, визуально "рваный" эффект.
const slideVariants: Variants = {
  enter: { x: 36, opacity: 0 },
  center: { x: 0, opacity: 1 },
}
const SLIDE_TRANSITION = { duration: 0.22, ease: [0.22, 1, 0.36, 1] as const }

/**
 * Содержимое дня заботы для КОНКРЕТНОЙ цели: задание + аффирмация + Сохранить/«Я сделала это»
 * (ТЗ п. 6.1). Презентационный компонент без собственного BottomSheet — рендерится внутри
 * PersonalCareListSheet, как PostcardContent внутри HolidayListSheet, чтобы переход
 * список-целей → задание → поздравление был одной анимацией.
 */
export function PersonalCareContent({ care, onClose, onCelebratingChange }: PersonalCareContentProps) {
  const addBookmark = useAppStore((s) => s.addBookmark)
  const removeBookmark = useAppStore((s) => s.removeBookmark)
  const bookmarks = useAppStore((s) => s.bookmarks)
  const completePersonalCare = useAppStore((s) => s.completePersonalCare)

  const [milestoneHits, setMilestoneHits] = useState<MilestoneHit[]>([])
  const goalId = care.goalTags[0]

  const goalTags = useMemo(
    () => GOALS.filter((g) => care.goalTags.includes(g.id)),
    [care],
  )

  const savedBookmark = bookmarks.find((b) => b.type === 'забота' && b.text === care.task)
  const isSaved = Boolean(savedBookmark)

  const handleSave = useCallback(() => {
    if (savedBookmark) { void removeBookmark(savedBookmark.id); return }
    void addBookmark({
      id: `tmp-p-${Date.now()}`,
      type: 'забота',
      date: getFullDateStr(),
      text: care.task,
      icon: 'spa',
    })
  }, [care, savedBookmark, addBookmark, removeBookmark])

  const handleComplete = useCallback(async () => {
    if (care.doneToday) return
    const hits = await completePersonalCare(goalId)
    if (hits.length) {
      setMilestoneHits(hits)
      onCelebratingChange?.(true)
    }
    // Без вехи — просто остаёмся на этом экране с кнопкой "Сделано" (не закрываем автоматически):
    // при нескольких активных целях автозакрытие всего шита после первой же цели мешало бы
    // отметить остальные без повторного открытия блока.
  }, [care.doneToday, completePersonalCare, goalId, onCelebratingChange])

  const handleCelebrationClose = useCallback(() => {
    onCelebratingChange?.(false)
    onClose()
  }, [onClose, onCelebratingChange])

  return (
    // layout="size": высота контейнера меняется вместе со слайдом (задание короче/длиннее
    // поздравления), см. HolidayListSheet.tsx для деталей, почему именно "size", не голый layout.
    <motion.div layout="size" className="relative overflow-hidden">
      {milestoneHits.length ? (
        <motion.div
          key="celebration"
          variants={slideVariants}
          initial="enter"
          animate="center"
          transition={SLIDE_TRANSITION}
          style={{ willChange: 'transform, opacity' }}
        >
          <MilestoneCelebrationContent hits={milestoneHits} onClose={handleCelebrationClose} />
        </motion.div>
      ) : (
        <motion.div
          key="task"
          variants={slideVariants}
          initial="enter"
          animate="center"
          transition={SLIDE_TRANSITION}
          style={{ willChange: 'transform, opacity' }}
          className="px-5 pb-6 flex flex-col gap-4"
        >
          <div className="h-36 rounded-3xl overflow-hidden">
            {care.imageUrl
              ? <img src={care.imageUrl} alt="" className="block w-full h-full object-cover" />
              : <ThemeArt themeKey={care.themeKey} className="w-full h-full" />
            }
          </div>

          <h2 className="font-headline text-xl font-bold text-on-surface -mb-1">{care.title}</h2>

          {goalTags.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-on-surface-variant font-semibold">Поддерживает твою цель:</span>
              {goalTags.map((g) => (
                <span key={g.id} className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs font-semibold px-2.5 py-1 rounded-full">
                  <span className="material-symbols-outlined text-[14px]">{g.icon}</span>
                  {g.title}
                </span>
              ))}
            </div>
          )}

          <p className="text-[16px] leading-relaxed text-on-surface">{care.task}</p>

          <div className="bg-primary/[0.07] text-primary text-sm italic rounded-2xl px-4 py-3 leading-relaxed">
            {care.affirmation}
          </div>

          <div className="flex gap-3 mt-1">
            <button
              onClick={handleSave}
              className={`flex-1 h-12 rounded-xl border font-semibold text-sm flex items-center justify-center gap-2 transition-colors ${
                isSaved ? 'border-primary/30 text-primary bg-primary/5' : 'border-outline-variant text-on-surface-variant'
              }`}
            >
              <span className="material-symbols-outlined text-lg" style={isSaved ? { fontVariationSettings: "'FILL' 1" } : undefined}>
                bookmark
              </span>
              {isSaved ? 'Сохранено' : 'Сохранить'}
            </button>
            <button
              onClick={handleComplete}
              disabled={care.doneToday}
              className={`flex-1 h-12 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-colors ${
                care.doneToday ? 'bg-primary/20 text-primary' : 'bg-primary-container text-white'
              }`}
            >
              <span className="material-symbols-outlined text-lg" style={care.doneToday ? { fontVariationSettings: "'FILL' 1" } : undefined}>
                {care.doneToday ? 'check_circle' : 'favorite'}
              </span>
              {care.doneToday ? 'Сделано' : 'Я сделала это'}
            </button>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}
