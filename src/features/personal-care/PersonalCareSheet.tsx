import { useCallback, useMemo, useState } from 'react'
import { motion, type Variants } from 'framer-motion'
import { BottomSheet } from '../../components/ui/BottomSheet'
import { useAppStore } from '../../store'
import { GOALS } from '../goals/goals.constant'
import { ThemeArt } from '../holidays/ThemeArt'
import { getFullDateStr } from '../../services/content.service'
import type { MilestoneHit } from '../../store/app.store'
import { MilestoneCelebrationContent } from './MilestoneCelebrationSheet'

interface PersonalCareSheetProps {
  isOpen: boolean
  onClose: () => void
}

// Без AnimatePresence/mode="wait" — та же ловушка, что уже чинили на HomePage и
// HolidayListSheet: двухфазная choreography (ждать exit, потом mount) виснет, если
// requestAnimationFrame не тикает. Простой keyed remount надёжнее.
const slideVariants: Variants = {
  enter: { x: 36, opacity: 0, scale: 0.98 },
  center: { x: 0, opacity: 1, scale: 1 },
}
const SLIDE_TRANSITION = { duration: 0.22, ease: [0.22, 1, 0.36, 1] as const }

/** Экран дня заботы: задание + аффирмация + Сохранить/«Я сделала это» (ТЗ п. 6.1). */
export function PersonalCareSheet({ isOpen, onClose }: PersonalCareSheetProps) {
  const care = useAppStore((s) => s.personalCareToday)
  const addBookmark = useAppStore((s) => s.addBookmark)
  const removeBookmark = useAppStore((s) => s.removeBookmark)
  const bookmarks = useAppStore((s) => s.bookmarks)
  const completePersonalCare = useAppStore((s) => s.completePersonalCare)

  const [milestoneHits, setMilestoneHits] = useState<MilestoneHit[]>([])

  const goalTags = useMemo(
    () => (care ? GOALS.filter((g) => care.goalTags.includes(g.id)) : []),
    [care],
  )

  const savedBookmark = care ? bookmarks.find((b) => b.type === 'забота' && b.text === care.task) : undefined
  const isSaved = Boolean(savedBookmark)

  const handleSave = useCallback(() => {
    if (savedBookmark) { void removeBookmark(savedBookmark.id); return }
    if (!care) return
    void addBookmark({
      id: `tmp-p-${Date.now()}`,
      type: 'забота',
      date: getFullDateStr(),
      text: care.task,
      icon: 'spa',
    })
  }, [care, savedBookmark, addBookmark, removeBookmark])

  const handleComplete = useCallback(async () => {
    if (!care || care.doneToday) return
    const hits = await completePersonalCare()
    if (hits.length) {
      setMilestoneHits(hits)
    } else {
      onClose()
    }
  }, [care, completePersonalCare, onClose])

  // Полное закрытие — сбрасываем веху, чтобы следующее открытие начиналось с задания.
  const handleClose = useCallback(() => {
    onClose()
    setMilestoneHits([])
  }, [onClose])

  if (!care) return null

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={handleClose}
      title={milestoneHits.length ? undefined : 'Персональный день'}
      hideDragIndicator={milestoneHits.length > 0}
    >
      <div className="relative overflow-hidden">
        {milestoneHits.length ? (
          <motion.div
            key="celebration"
            variants={slideVariants}
            initial="enter"
            animate="center"
            transition={SLIDE_TRANSITION}
            style={{ willChange: 'transform, opacity' }}
          >
            <MilestoneCelebrationContent hits={milestoneHits} onClose={handleClose} />
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
                ? <img src={care.imageUrl} alt="" className="w-full h-full object-cover" />
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
      </div>
    </BottomSheet>
  )
}
