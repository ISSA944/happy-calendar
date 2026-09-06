import { useEffect, useMemo, useCallback, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import type { Variants } from 'framer-motion'
import { useAppStore } from '../store'
import { MoodSheet } from '../features/mood/MoodSheet'
import { InstallBanner } from '../components/InstallBanner'
import { HolidaysTodayBlock } from '../features/holidays/HolidaysTodayBlock'
import { GoalsProgressBlock } from '../features/goals/GoalsProgressBlock'
import {
  getGreeting,
  getTodayFormatted,
  getMoodImage,
  getMoodLabel,
  getFullDateStr,
} from '../services/content.service'

// Slide variants — same pattern as CalendarSheet calendar grid, no async overhead
const slideVariants: Variants = {
  enter: (dir: number) => ({ x: dir > 0 ? 36 : -36, opacity: 0, scale: 0.98 }),
  center: { x: 0, opacity: 1, scale: 1 },
  exit:  (dir: number) => ({ x: dir < 0 ? 36 : -36, opacity: 0, scale: 0.98 }),
}
const SLIDE_TRANSITION = { duration: 0.22, ease: [0.22, 1, 0.36, 1] as const }
const SLIDE_STYLE = { willChange: 'transform, opacity' as const }

/** Шиммер-плейсхолдер вместо пустого текста, пока /api/today не ответил (первый заход
    за день — холодный кэш, живой AI-вызов занимает несколько секунд). Без этого блоки
    рендерились пустыми и приложение выглядело зависшим — см. план "долгий вход". */
function SkeletonLines({ lines = 2 }: { lines?: number }) {
  return (
    <div className="space-y-2.5 animate-pulse">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-3.5 rounded-full bg-outline-variant/20"
          style={{ width: i === lines - 1 ? '55%' : '90%' }}
        />
      ))}
    </div>
  )
}

export function HomePage() {
  const navigate = useNavigate()

  const currentMood        = useAppStore(s => s.currentMood)
  const gender             = useAppStore(s => s.gender)
  const zodiacSign         = useAppStore(s => s.zodiacSign)
  const userName           = useAppStore(s => s.userName)
  const dailyPack          = useAppStore(s => s.dailyPack)
  const refreshSupportPhrase = useAppStore(s => s.refreshSupportPhrase)
  const addBookmark        = useAppStore(s => s.addBookmark)
  const removeBookmark     = useAppStore(s => s.removeBookmark)
  const bookmarks          = useAppStore(s => s.bookmarks)
  const fetchBookmarks     = useAppStore(s => s.fetchBookmarks)
  const fetchGoals         = useAppStore(s => s.fetchGoals)
  const fetchHolidaysToday = useAppStore(s => s.fetchHolidaysToday)
  const fetchPersonalCareToday = useAppStore(s => s.fetchPersonalCareToday)
  const profilePhoto       = useAppStore(s => s.profilePhoto)

  const [horoscopeTab, setHoroscopeTab] = useState<'short' | 'detailed'>('short')
  const [tabDir, setTabDir]             = useState(1)
  const [isMoodSheetOpen, setIsMoodSheetOpen] = useState(false)

  useEffect(() => {
    void fetchBookmarks()
    void fetchGoals()
    void fetchHolidaysToday()
    void fetchPersonalCareToday()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const supportPhrase  = dailyPack?.supportPhrase ?? ''
  const horoscope      = dailyPack?.horoscope ?? null
  const moodImage      = useMemo(() => getMoodImage(currentMood), [currentMood])
  const todayStr       = useMemo(() => getFullDateStr(), [])
  const moodLabel      = useMemo(() => getMoodLabel(currentMood, gender), [currentMood, gender])

  const savedQuoteBookmark = useMemo(
    () => bookmarks.find(b => b.type === 'поддержка' && b.text === supportPhrase),
    [bookmarks, supportPhrase],
  )
  const savedHoroscopeBookmark = useMemo(
    () => bookmarks.find(b => b.type === 'гороскоп' && b.date === todayStr),
    [bookmarks, todayStr],
  )
  const savedQuote = Boolean(savedQuoteBookmark)
  const savedHoroscope = Boolean(savedHoroscopeBookmark)

  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleNewQuote = useCallback(async () => {
    if (isRefreshing) return
    setIsRefreshing(true)
    await refreshSupportPhrase()
    setIsRefreshing(false)
  }, [refreshSupportPhrase, isRefreshing])

  const handleSaveQuote = useCallback(() => {
    if (savedQuoteBookmark) { void removeBookmark(savedQuoteBookmark.id); return }
    if (!supportPhrase) return
    void addBookmark({ id: `tmp-q-${Date.now()}`, type: 'поддержка', date: todayStr, text: supportPhrase, icon: 'favorite' })
  }, [addBookmark, removeBookmark, savedQuoteBookmark, supportPhrase, todayStr])

  const handleSaveHoroscope = useCallback(() => {
    if (savedHoroscopeBookmark) { void removeBookmark(savedHoroscopeBookmark.id); return }
    if (!horoscope) return
    const text = horoscopeTab === 'short' ? horoscope.main : horoscope.detailed
    void addBookmark({ id: `tmp-h-${Date.now()}`, type: 'гороскоп', date: todayStr, text: `${zodiacSign}: ${text}`, icon: 'auto_awesome' })
  }, [addBookmark, removeBookmark, savedHoroscopeBookmark, horoscope, horoscopeTab, zodiacSign, todayStr])

  const handleTabChange = useCallback((tab: 'short' | 'detailed') => {
    setTabDir(tab === 'detailed' ? 1 : -1)
    setHoroscopeTab(tab)
  }, [])

  return (
    <>
      <div className="max-w-[430px] landscape:max-w-[860px] mx-auto px-5 pt-2 pb-8">

        <InstallBanner />

        <div className="flex flex-col gap-8 landscape:grid landscape:grid-cols-2 landscape:gap-x-6 landscape:gap-y-8">

          {/* ── Header ── */}
          <header className="flex justify-between items-center py-2 landscape:col-span-2 landscape:row-start-1">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-surface-container-high border-2 border-surface-container-lowest flex items-center justify-center">
              {profilePhoto
                ? <img src={profilePhoto} className="w-full h-full object-cover" alt="Фото профиля" />
                : <span className="material-symbols-outlined text-[28px] text-outline-variant opacity-50" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
              }
            </div>
            <span className="font-headline font-semibold text-on-surface-variant text-sm">Сегодня — {getTodayFormatted()}</span>
            <button
              onClick={() => navigate('/notifications-list')}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors active:scale-95 duration-200"
            >
              <span className="material-symbols-outlined text-on-surface-variant">notifications</span>
            </button>
          </header>

          {/* ── Greeting ── */}
          <section className="space-y-1 landscape:col-start-1 landscape:row-start-2">
            <h1 className="font-headline text-4xl font-extrabold tracking-tight text-on-surface leading-tight">
              {getGreeting()}{(userName || zodiacSign) && `, ${userName || zodiacSign}`}
            </h1>
            <div className="inline-flex items-center px-3 py-1 bg-surface-container rounded-full text-xs font-medium text-on-surface-variant gap-1.5">
              <span>Твой знак: {zodiacSign || '—'}</span>
            </div>
          </section>

          {/* ── 🆕 Праздники сегодня (2 карточки) ── */}
          <div className="landscape:col-span-2 landscape:row-start-3">
            <h2 className="font-headline text-lg font-bold text-on-surface mb-3 px-1">Праздники сегодня</h2>
            <HolidaysTodayBlock />
          </div>

          {/* ── 🆕 Твои цели ── */}
          <div className="landscape:col-span-2 landscape:row-start-4">
            <GoalsProgressBlock />
          </div>

          {/* ── Mood Banner ── */}
          <section className="w-full h-[200px] landscape:h-[140px] rounded-lg overflow-hidden relative landscape:col-start-2 landscape:row-start-2">
            <img src={moodImage} alt={currentMood} className="w-full h-full object-cover" loading="eager" fetchPriority="high" decoding="async" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
            <div className="absolute top-4 right-4 z-10 bg-white/90 text-primary px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm">
              {moodLabel}
            </div>
          </section>

          {/* ── Support Card ── */}
          <section className="bg-surface-container-low p-6 rounded-lg shadow-[0_4px_20px_rgba(0,0,0,0.02)] space-y-4 landscape:col-span-2 landscape:row-start-5">
            <div className="flex justify-between items-start gap-3">
              <h2 className="font-headline text-xl font-bold text-on-surface">Поддержка на сегодня</h2>
              <span className="flex-shrink-0 bg-primary-container/20 text-on-primary-container px-3 py-1 rounded-full text-xs font-semibold tracking-wide">{moodLabel}</span>
            </div>

            {/* Phrase slider — new phrase slides in from the right on each change.
                No AnimatePresence/mode="wait": that two-phase exit-then-enter choreography
                gets stuck (stale empty node, opacity:0 forever) when the key's very first
                value is '' (before dailyPack loads) and later changes to real text. A plain
                keyed remount is more robust and still gives the same "slide in" feel. */}
            <div className="relative overflow-hidden min-h-[60px]">
              {dailyPack ? (
                <motion.p
                  key={supportPhrase || 'support-loading'}
                  initial={{ x: 36, opacity: 0, scale: 0.98 }}
                  animate={{ x: 0, opacity: 1, scale: 1 }}
                  transition={SLIDE_TRANSITION}
                  style={SLIDE_STYLE}
                  className="font-body text-on-surface leading-relaxed italic text-[15px]"
                >
                  {supportPhrase}
                </motion.p>
              ) : (
                <div className="pt-1"><SkeletonLines lines={2} /></div>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <motion.button
                whileTap={{ scale: isRefreshing ? 1 : 0.97 }}
                onClick={handleNewQuote}
                disabled={isRefreshing}
                className={`flex-1 h-12 rounded-xl font-semibold text-sm transition-opacity ${
                  isRefreshing ? 'bg-primary-container/60 text-white opacity-70 cursor-not-allowed' : 'bg-primary-container text-white'
                }`}
              >
                {isRefreshing ? '...' : 'Другая фраза'}
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleSaveQuote}
                className={`flex-1 h-12 border rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-colors ${
                  savedQuote
                    ? 'border-primary/30 text-primary bg-primary/5'
                    : 'border-outline-variant text-on-surface-variant hover:bg-surface-container'
                }`}
              >
                <span className="material-symbols-outlined text-lg" style={savedQuote ? { fontVariationSettings: "'FILL' 1" } : undefined}>bookmark</span>
                {savedQuote ? 'Сохранено' : 'Сохранить'}
              </motion.button>
            </div>
          </section>

          {/* ── Change Mood (moved above Horoscope) ── */}
          <section className="pb-2 landscape:col-span-2 landscape:row-start-6">
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => setIsMoodSheetOpen(true)}
              className="w-full bg-surface-container-lowest border border-outline-variant/30 shadow-sm rounded-[24px] px-5 py-4 flex items-center gap-3 transition-colors duration-300 hover:bg-surface-container-low"
            >
              <span className="material-symbols-outlined text-primary text-xl">tune</span>
              <span className="text-sm font-semibold text-on-surface flex-grow text-left">Сменить настроение</span>
              <div className="px-2.5 py-0.5 bg-primary-container/10 rounded-full text-[11px] font-bold text-primary uppercase tracking-tight">{moodLabel}</div>
              <span className="material-symbols-outlined text-on-surface-variant text-xl">expand_more</span>
            </motion.button>
          </section>

          {/* ── Horoscope Card ── */}
          <section className="bg-surface-container-lowest p-6 rounded-lg shadow-[0_4px_20px_rgba(0,0,0,0.02)] space-y-6 landscape:col-span-2 landscape:row-start-7">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-headline text-xl font-bold text-on-surface">Гороскоп на сегодня</h2>

              {/* Tab switcher with spring-animated sliding indicator */}
              <div className="flex bg-surface-container rounded-full p-1 flex-shrink-0">
                {(['short', 'detailed'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => handleTabChange(tab)}
                    className="relative px-4 py-1.5 rounded-full text-xs font-semibold"
                  >
                    {horoscopeTab === tab && (
                      <motion.div
                        layoutId="horoscope-tab-bg"
                        className="absolute inset-0 bg-white rounded-full shadow-sm"
                        transition={{ type: 'spring', stiffness: 420, damping: 38 }}
                      />
                    )}
                    <span className={`relative z-10 transition-colors duration-150 ${
                      horoscopeTab === tab ? 'text-primary' : 'text-on-surface-variant'
                    }`}>
                      {tab === 'short' ? 'Сжато' : 'Подробнее'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Horoscope content — direction-aware slide + subtle scale */}
            <div className="relative overflow-hidden">
              {horoscope ? (
                <AnimatePresence mode="wait" custom={tabDir}>
                  <motion.div
                    key={horoscopeTab}
                    custom={tabDir}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                    style={{ willChange: 'transform, opacity' }}
                    className="space-y-4 text-on-surface"
                  >
                    <div className="flex gap-3">
                      <span className="material-symbols-outlined text-primary-container flex-shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
                      <p className="text-sm">
                        <span className="font-bold">Главное:</span>{' '}
                        {horoscopeTab === 'short' ? horoscope?.main : horoscope?.detailed}
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <span className="material-symbols-outlined text-primary-container flex-shrink-0">lightbulb</span>
                      <p className="text-sm"><span className="font-bold">Совет:</span> {horoscope?.advice}</p>
                    </div>
                    {horoscopeTab === 'detailed' && (
                      <>
                        <div className="flex items-center gap-3 opacity-80">
                          <span className="material-symbols-outlined text-primary-container flex-shrink-0">dark_mode</span>
                          <p className="text-sm"><span className="font-bold">Луна:</span> {horoscope?.moon}</p>
                        </div>
                        <div className="flex items-center gap-3 opacity-80">
                          <span className="material-symbols-outlined text-primary-container flex-shrink-0">balance</span>
                          <p className="text-sm"><span className="font-bold">Аспект:</span> {horoscope?.aspect}</p>
                        </div>
                      </>
                    )}
                  </motion.div>
                </AnimatePresence>
              ) : (
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <span className="material-symbols-outlined text-primary-container flex-shrink-0 opacity-40" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
                    <div className="flex-1 pt-1"><SkeletonLines lines={2} /></div>
                  </div>
                  <div className="flex gap-3">
                    <span className="material-symbols-outlined text-primary-container flex-shrink-0 opacity-40">lightbulb</span>
                    <div className="flex-1 pt-1"><SkeletonLines lines={1} /></div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-center pt-2">
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleSaveHoroscope}
                className={`border font-semibold text-sm flex items-center gap-2 transition-colors px-4 py-2 rounded-full ${
                  savedHoroscope
                    ? 'border-primary/30 text-primary bg-primary/5'
                    : 'border-outline-variant text-on-surface-variant hover:bg-surface-container'
                }`}
              >
                <span className="material-symbols-outlined text-lg" style={savedHoroscope ? { fontVariationSettings: "'FILL' 1" } : undefined}>bookmark_add</span>
                {savedHoroscope ? 'Сохранено' : 'Сохранить в закладки'}
              </motion.button>
            </div>
          </section>

        </div>
      </div>

      {/* ── MoodSheet ── */}
      <MoodSheet isOpen={isMoodSheetOpen} onClose={() => setIsMoodSheetOpen(false)} />
    </>
  )
}
