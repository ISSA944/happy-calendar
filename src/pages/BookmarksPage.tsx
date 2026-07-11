import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '../store'
import type { BookmarkType } from '../store/app.store'

// Цветовая схема тегов закладок по типу — единый источник для табов, тегов и иконок.
// Цвета из дизайн-системы (tailwind.config.js): accent/primary/tertiary/secondary.
const TYPE_META: Record<BookmarkType, { label: string; color: string }> = {
  'гороскоп': { label: 'Гороскоп', color: '#2FA7A0' },
  'поддержка': { label: 'Поддержка', color: '#006a65' },
  'открытка': { label: 'Открытки', color: '#954928' },
  'забота': { label: 'Забота', color: '#914946' },
}

const FILTERS = ['все', 'гороскоп', 'поддержка', 'открытка', 'забота'] as const

export function BookmarksPage() {
  const navigate = useNavigate()
  const bookmarks = useAppStore(s => s.bookmarks)
  const fetchBookmarks = useAppStore(s => s.fetchBookmarks)
  const removeBookmark = useAppStore(s => s.removeBookmark)
  const [filter, setFilter] = useState<'все' | BookmarkType>('все')

  // Refresh from server on mount — keeps bookmarks in sync across devices
  useEffect(() => {
    void fetchBookmarks()
  }, [fetchBookmarks])

  const filtered = useMemo(
    () => bookmarks.filter(b => filter === 'все' || b.type === filter),
    [bookmarks, filter],
  )

  const handleRemove = useCallback((id: string) => { void removeBookmark(id) }, [removeBookmark])
  const handleBack = useCallback(() => navigate(-1), [navigate])

  return (
    <div className="flex flex-col min-h-full bg-background">
      <header className="sticky top-0 w-full z-50 bg-background px-5 pt-[env(safe-area-inset-top,0px)] border-b border-primary/5">
        <div className="flex items-center h-16 relative">
          <button
            onClick={handleBack}
            className="w-10 h-10 -ml-1 text-on-surface-variant hover:bg-black/5 rounded-full transition-colors active:scale-95 flex items-center justify-center shrink-0"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="absolute left-1/2 -translate-x-1/2 font-headline font-bold text-lg tracking-tight text-on-surface">Закладки</h1>
        </div>
      </header>

      <main className="flex-1 w-full max-w-[430px] landscape:max-w-[860px] mx-auto px-5 pt-4 pb-24">
        <div className="mb-6">
          <p className="text-on-surface-variant font-body text-sm leading-relaxed">
            Ваши сохраненные моменты и предсказания в одном безопасном месте.
          </p>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-6 no-scrollbar">
          {FILTERS.map(type => {
            const active = filter === type
            const color = type === 'все' ? '#006a65' : TYPE_META[type].color
            return (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`flex-shrink-0 px-6 py-2 rounded-full text-sm font-medium transition-colors active:scale-95 ${
                  active ? 'text-white' : 'bg-white border border-outline-variant text-on-surface-variant'
                }`}
                style={active ? { background: color } : undefined}
              >
                {type === 'все' ? 'Все' : TYPE_META[type].label}
              </button>
            )
          })}
        </div>

        <section className="space-y-5 landscape:space-y-0 landscape:grid landscape:grid-cols-2 landscape:gap-5">
          <AnimatePresence mode="popLayout">
            {filtered.map(bm => (
              <motion.div
                layout
                key={bm.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                className="bg-white rounded-[24px] p-5 flex flex-col gap-4 shadow-[0_4px_16px_rgba(0,0,0,0.04)]"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${TYPE_META[bm.type].color}1a`, color: TYPE_META[bm.type].color }}
                  >
                    <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                      {bm.icon}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold mb-0.5 uppercase tracking-wider"
                      style={{ backgroundColor: `${TYPE_META[bm.type].color}1a`, color: TYPE_META[bm.type].color }}
                    >
                      {TYPE_META[bm.type].label}
                    </div>
                    <p className="text-[11px] text-on-surface-variant">{bm.date}</p>
                  </div>
                  <button
                    onClick={() => handleRemove(bm.id)}
                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container text-on-surface-variant/50 transition-colors active:scale-90"
                    aria-label="Удалить"
                  >
                    <span className="material-symbols-outlined text-lg">close</span>
                  </button>
                </div>
                <p className="text-on-surface font-headline font-medium text-[15px] leading-relaxed">{bm.text}</p>
              </motion.div>
            ))}
          </AnimatePresence>

          {filtered.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-20 text-center space-y-3 landscape:col-span-2">
              <span className="material-symbols-outlined text-on-surface-variant/30 text-[48px]">bookmark_border</span>
              <p className="text-on-surface-variant text-sm">
                {bookmarks.length === 0
                  ? 'Здесь будут ваши сохранённые фразы и гороскопы.'
                  : 'Ничего не найдено в этой категории.'}
              </p>
            </motion.div>
          )}
        </section>
      </main>
    </div>
  )
}

