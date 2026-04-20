import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import type { Variants } from 'framer-motion'
import { useAppStore } from '../store'
import type { BookmarkType } from '../store/app.store'

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
}
// Opacity-only — no y translate on shadowed cards.
const itemVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.25, ease: 'easeOut' } },
}

export function BookmarksPage() {
  const navigate = useNavigate()
  const bookmarks = useAppStore(s => s.bookmarks)
  const removeBookmark = useAppStore(s => s.removeBookmark)
  const [filter, setFilter] = useState<'все' | BookmarkType>('все')

  const filtered = useMemo(
    () => bookmarks.filter(b => filter === 'все' || b.type === filter),
    [bookmarks, filter],
  )

  const handleRemove = useCallback((id: string) => removeBookmark(id), [removeBookmark])
  const handleBack = useCallback(() => navigate(-1), [navigate])

  return (
    <motion.div initial="hidden" animate="show" variants={containerVariants} className="flex flex-col min-h-full bg-background">
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

      <main className="flex-1 px-5 pt-4 pb-24">
        <motion.div variants={itemVariants} className="mb-6">
          <p className="text-on-surface-variant font-body text-sm leading-relaxed">
            Ваши сохраненные моменты и предсказания в одном безопасном месте.
          </p>
        </motion.div>

        <motion.div variants={itemVariants} className="flex gap-2 overflow-x-auto pb-6 no-scrollbar">
          {(['все', 'гороскоп', 'поддержка'] as const).map(type => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`flex-shrink-0 px-6 py-2 rounded-full text-sm font-medium transition-colors active:scale-95 ${
                filter === type
                  ? 'text-white'
                  : 'bg-white border border-outline-variant text-on-surface-variant'
              }`}
              style={filter === type ? { background: 'linear-gradient(to right, #006a65, #2fa7a0)' } : undefined}
            >
              {type === 'все' ? 'Все' : type === 'гороскоп' ? 'Гороскоп' : 'Поддержка'}
            </button>
          ))}
        </motion.div>

        <section className="space-y-5">
          <AnimatePresence mode="popLayout">
            {filtered.map(bm => (
              <motion.div
                layout
                key={bm.id}
                variants={itemVariants}
                initial="hidden"
                animate="show"
                exit={{ opacity: 0 }}
                className="bg-white rounded-[24px] p-5 flex flex-col gap-4 shadow-[0_4px_16px_rgba(0,0,0,0.04)]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center bg-accent/10 text-accent">
                    <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                      {bm.icon}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold mb-0.5 uppercase tracking-wider ${
                        bm.type === 'гороскоп'
                          ? 'bg-accent/10 text-accent'
                          : 'bg-surface-container text-on-surface-variant'
                      }`}
                    >
                      {bm.type}
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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-20 text-center space-y-3">
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
    </motion.div>
  )
}

