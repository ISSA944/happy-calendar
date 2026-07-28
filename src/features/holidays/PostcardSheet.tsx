import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useAppStore } from '../../store'
import type { HolidayCard, HolidayCardWithText, Tone } from '../../store/app.store'
import { ThemeArt } from './ThemeArt'
import { nativeShare, shareViaChannel, SHARE_CHANNELS } from '../../utils/share'
import { getFullDateStr } from '../../services/content.service'

const TONES: { id: Tone; label: string }[] = [
  { id: 'cute', label: 'Милая' },
  { id: 'humor', label: 'С юмором' },
  { id: 'cynical', label: 'Цинично' },
]

interface PostcardContentProps {
  holiday: HolidayCard
}

/**
 * Содержимое открытки: переключатель тона + Сохранить/Поделиться (ТЗ п. 5).
 * Презентационный компонент без собственного BottomSheet — рендерится внутри
 * общего шита в HolidayListSheet, чтобы переход список↔открытка был одной
 * анимацией, а не закрытием одного sheet и открытием другого.
 */
export function PostcardContent({ holiday }: PostcardContentProps) {
  return <PostcardContentInner key={holiday.id} holiday={holiday} />
}

function PostcardContentInner({ holiday }: PostcardContentProps) {
  const getHolidayCard = useAppStore((s) => s.getHolidayCard)
  const addBookmark = useAppStore((s) => s.addBookmark)
  const removeBookmark = useAppStore((s) => s.removeBookmark)
  const bookmarks = useAppStore((s) => s.bookmarks)

  const [tone, setTone] = useState<Tone>('cute')
  const [card, setCard] = useState<HolidayCardWithText | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showChannels, setShowChannels] = useState(false)
  const [copyFeedback, setCopyFeedback] = useState('')

  useEffect(() => {
    let cancelled = false
    getHolidayCard(holiday.id, tone)
      .then((data) => { if (!cancelled) setCard(data) })
      .catch(() => { if (!cancelled) setCard(null) })
      .finally(() => { if (!cancelled) setIsLoading(false) })
    return () => { cancelled = true }
  }, [holiday, tone, getHolidayCard])

  const savedBookmark = card ? bookmarks.find((b) => b.type === 'открытка' && b.text === card.text) : undefined
  const isSaved = Boolean(savedBookmark)

  const handleSave = useCallback(() => {
    if (savedBookmark) { void removeBookmark(savedBookmark.id); return }
    if (!card) return
    void addBookmark({
      id: `tmp-c-${Date.now()}`,
      type: 'открытка',
      date: getFullDateStr(),
      text: card.text,
      icon: 'celebration',
    })
  }, [card, savedBookmark, addBookmark, removeBookmark])

  const handleShare = useCallback(async () => {
    if (!card) return
    const ok = await nativeShare(`YoYoJoy · ${card.title}`, card.text)
    if (!ok) setShowChannels(true)
  }, [card])

  return (
    <div className="px-5 pb-6 flex flex-col gap-4">
      <p className="text-sm text-on-surface-variant -mt-1">Выбери тон открытки — и отправь близким.</p>

      <div className="flex gap-2">
        {TONES.map((t) => (
          <button
            key={t.id}
            onClick={() => {
              setTone(t.id)
              setIsLoading(true)
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-semibold border transition-colors ${
              tone === t.id
                ? 'bg-primary/10 border-primary/40 text-primary'
                : 'bg-white border-outline-variant/30 text-on-surface-variant'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="rounded-3xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.05)]">
        {/* Картинка/тема не зависит от тона — не должна дёргаться при переключении Милая/С юмором/Циничная.
            layout — только на текстовом блоке ниже, НЕ на этом внешнем контейнере: layout на родителе
            анимирует transform всего блока целиком при смене высоты, задевая и картинку тоже. */}
        <div className="h-40 overflow-hidden">
          {card?.imageUrl
            ? <img src={card.imageUrl} alt="" className="block w-full h-full object-cover" />
            : <ThemeArt themeKey={holiday.themeKey} className="w-full h-full" />
          }
        </div>
        <motion.div layout="size" className="bg-white p-5 min-h-[64px]">
          <motion.p
            key={isLoading ? 'loading' : tone}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15 }}
            className="text-[15px] leading-relaxed text-on-surface"
          >
            {isLoading ? '…' : card?.text}
          </motion.p>
        </motion.div>
      </div>

      {!showChannels ? (
        <div className="flex gap-3">
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
            onClick={handleShare}
            className="flex-1 h-12 rounded-xl bg-primary-container text-white font-semibold text-sm flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">ios_share</span>
            Поделиться
          </button>
        </div>
      ) : (
        <div>
          <div className="grid grid-cols-5 gap-2">
            {SHARE_CHANNELS.map((ch) => (
              <button
                key={ch.id}
                onClick={async () => {
                  if (!card) return
                  shareViaChannel(ch.id, `YoYoJoy · ${card.title}`, card.text)
                  if (ch.id === 'copy' || ch.id === 'max') {
                    setCopyFeedback(ch.id === 'max' ? 'Вставь в МАКС' : 'Скопировано')
                    setTimeout(() => setCopyFeedback(''), 1800)
                  }
                }}
                className="flex flex-col items-center gap-1.5 py-3 rounded-2xl bg-white border border-outline-variant/30 active:scale-95 transition-transform"
              >
                <span className="material-symbols-outlined text-primary text-xl">{ch.icon}</span>
                <span className="text-[10px] font-semibold text-on-surface-variant">{ch.label}</span>
              </button>
            ))}
          </div>
          {copyFeedback && <p className="text-center text-xs text-primary font-semibold mt-2">{copyFeedback}</p>}
        </div>
      )}
    </div>
  )
}
