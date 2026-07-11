import { useCallback, useMemo } from 'react'
import { BottomSheet } from '../../components/ui/BottomSheet'
import { useAppStore } from '../../store'
import { GOALS } from '../goals/goals.constant'
import { themeGradientCss } from '../holidays/themeGradients'
import { getFullDateStr } from '../../services/content.service'
import type { MilestoneHit } from '../../store/app.store'

interface PersonalCareSheetProps {
  isOpen: boolean
  onClose: () => void
  onMilestones: (hits: MilestoneHit[]) => void
}

/** Экран дня заботы: задание + аффирмация + Сохранить/«Я сделала это» (ТЗ п. 6.1). */
export function PersonalCareSheet({ isOpen, onClose, onMilestones }: PersonalCareSheetProps) {
  const care = useAppStore((s) => s.personalCareToday)
  const addBookmark = useAppStore((s) => s.addBookmark)
  const bookmarks = useAppStore((s) => s.bookmarks)
  const completePersonalCare = useAppStore((s) => s.completePersonalCare)

  const goalTags = useMemo(
    () => (care ? GOALS.filter((g) => care.goalTags.includes(g.id)) : []),
    [care],
  )

  const isSaved = care ? bookmarks.some((b) => b.type === 'забота' && b.text === care.task) : false

  const handleSave = useCallback(() => {
    if (!care || isSaved) return
    void addBookmark({
      id: `tmp-p-${Date.now()}`,
      type: 'забота',
      date: getFullDateStr(),
      text: care.task,
      icon: 'spa',
    })
  }, [care, isSaved, addBookmark])

  const handleComplete = useCallback(async () => {
    if (!care || care.doneToday) return
    const hits = await completePersonalCare()
    onClose()
    if (hits.length) onMilestones(hits)
  }, [care, completePersonalCare, onClose, onMilestones])

  if (!care) return null

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Персональный день">
      <div className="px-5 pb-6 flex flex-col gap-4">
        <div
          className="h-36 rounded-3xl flex items-center justify-center overflow-hidden"
          style={{ background: care.imageUrl ? undefined : themeGradientCss(care.themeKey) }}
        >
          {care.imageUrl
            ? <img src={care.imageUrl} alt="" className="w-full h-full object-cover" />
            : <span className="material-symbols-outlined text-white text-5xl" style={{ fontVariationSettings: "'FILL' 1" }}>spa</span>
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
            disabled={isSaved}
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
      </div>
    </BottomSheet>
  )
}
