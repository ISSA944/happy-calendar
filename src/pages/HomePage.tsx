import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import type { Variants } from 'framer-motion'
import { useAppStore } from '../store'
import { MoodSheet } from '../features/mood/MoodSheet'
import { usePWAInstall } from '../hooks'
import {
  getGreeting,
  getTodayFormatted,
  getTodayHoliday,
  getRandomQuote,
  getHoroscope,
  getMoodImage,
  getFullDateStr,
} from '../services/content.service'

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } }
}
const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
}

export function HomePage() {
  const navigate = useNavigate()
  const currentMood = useAppStore(s => s.currentMood)
  const zodiacSign = useAppStore(s => s.zodiacSign)
  const addBookmark = useAppStore(s => s.addBookmark)

  const [horoscopeTab, setHoroscopeTab] = useState<'short' | 'detailed'>('short')
  const [isMoodSheetOpen, setIsMoodSheetOpen] = useState(false)
  const [installDismissed, setInstallDismissed] = useState(false)

  // Dynamic content
  const [quote, setQuote] = useState({ text: '', index: -1 })
  const [savedQuote, setSavedQuote] = useState(false)
  const [savedHoroscope, setSavedHoroscope] = useState(false)

  const holiday = getTodayHoliday()
  const horoscope = getHoroscope(zodiacSign)
  const moodImage = getMoodImage(currentMood)

  // Get initial quote on mood change
  useEffect(() => {
    setQuote(getRandomQuote(currentMood))
    setSavedQuote(false)
  }, [currentMood])

  const handleNewQuote = useCallback(() => {
    setQuote(prev => getRandomQuote(currentMood, prev.index))
    setSavedQuote(false)
  }, [currentMood])

  const handleSaveQuote = useCallback(() => {
    addBookmark({
      id: `q-${Date.now()}`,
      type: 'поддержка',
      date: getFullDateStr(),
      text: quote.text,
      icon: 'favorite',
    })
    setSavedQuote(true)
  }, [addBookmark, quote.text])

  const handleSaveHoroscope = useCallback(() => {
    const text = horoscopeTab === 'short' ? horoscope.main : horoscope.mainDetailed
    addBookmark({
      id: `h-${Date.now()}`,
      type: 'гороскоп',
      date: getFullDateStr(),
      text: `${zodiacSign}: ${text}`,
      icon: 'auto_awesome',
    })
    setSavedHoroscope(true)
  }, [addBookmark, horoscope, horoscopeTab, zodiacSign])

  const { isInstallable, isInstalled, triggerInstall } = usePWAInstall()
  const showInstallBanner = isInstallable && !isInstalled && !installDismissed

  const handleNotifClick = () => {
    navigate('/notifications-list')
  }

  return (
    <>
      <motion.div
        initial="hidden"
        animate="show"
        exit={{ opacity: 0 }}
        variants={containerVariants}
        className="max-w-[390px] mx-auto px-5 space-y-6 pt-2 pb-8"
        style={{ filter: isMoodSheetOpen ? 'blur(2px)' : 'none', transition: 'filter 0.3s ease' }}
      >

      {/* PWA Install Banner */}
      <AnimatePresence>
        {showInstallBanner && (
          <motion.div
            key="pwa-banner"
            initial={{ opacity: 0, y: -12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 340, damping: 28 }}
            className="bg-white border border-outline-variant/30 rounded-[24px] px-5 py-4 shadow-[0_8px_32px_-8px_rgba(47,167,160,0.18)] flex items-center gap-4"
          >
            <div className="w-12 h-12 flex-shrink-0 rounded-2xl bg-gradient-to-br from-primary/20 to-[#6ad8d0]/30 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>calendar_month</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-headline font-bold text-sm text-on-surface leading-tight">Установить приложение</p>
              <p className="text-xs text-on-surface-variant mt-0.5">Работает офлайн · Как родное</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button onClick={triggerInstall} className="h-9 px-4 rounded-full text-xs font-bold font-headline active:scale-95 transition-transform" style={{ background: 'linear-gradient(to right,#006a65,#2fa7a0)', color: '#fff', boxShadow: '0 2px 8px rgba(47,167,160,0.3)' }}>Установить</button>
              <button onClick={() => setInstallDismissed(true)} aria-label="Закрыть" className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors active:scale-95 text-on-surface-variant">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Section — REAL DATE */}
      <motion.header variants={itemVariants} className="flex justify-between items-center py-2">
        <div className="w-10 h-10 rounded-full overflow-hidden bg-surface-container-high border-2 border-surface-container-lowest flex items-center justify-center">
          <span className="material-symbols-outlined text-[28px] text-outline-variant opacity-50" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
        </div>
        <span className="font-headline font-semibold text-on-surface-variant text-sm">Сегодня — {getTodayFormatted()}</span>
        <button 
          onClick={handleNotifClick}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors active:scale-95 duration-200"
        >
          <span className="material-symbols-outlined text-on-surface-variant">notifications</span>
        </button>
      </motion.header>

      {/* Welcome Headlines */}
      <motion.section variants={itemVariants} className="space-y-1">
        <h1 className="font-headline text-[32px] font-extrabold tracking-tight text-on-surface leading-tight">{getGreeting()}</h1>
        <div className="inline-flex items-center px-3 py-1 bg-surface-container rounded-full text-xs font-medium text-on-surface-variant gap-1.5">
          <span>Твой знак: {zodiacSign}</span>
        </div>
      </motion.section>

      {/* Holiday Card — DYNAMIC */}
      {holiday && (
        <motion.section variants={itemVariants} className="bg-surface-container-lowest p-5 rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex items-center gap-4">
          <div className="w-14 h-14 flex-shrink-0 bg-[#ffdad7]/30 rounded-full flex items-center justify-center">
            <span className="material-symbols-outlined text-[28px] text-[#914946]/70" style={{ fontVariationSettings: "'FILL' 1" }}>{holiday.icon}</span>
          </div>
          <div className="space-y-0.5 min-w-0">
            <h2 className="font-headline text-base font-bold text-on-surface leading-snug">Сегодня: {holiday.name}</h2>
            <p className="text-sm text-on-surface-variant leading-snug">{holiday.description}</p>
          </div>
        </motion.section>
      )}

      {/* Mood Banner & Support — with REAL IMAGE & DYNAMIC QUOTE */}
      <motion.section variants={itemVariants} className="space-y-0">
        <div className="w-full h-[200px] rounded-t-3xl overflow-hidden relative bg-surface-container">
          <img
            src={moodImage}
            alt={currentMood}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          <div className="absolute top-4 right-4 z-10 bg-white/90 backdrop-blur-sm text-primary px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm">
            {currentMood}
          </div>
        </div>

        <div className="bg-white p-5 rounded-b-3xl shadow-[0_4px_20px_rgba(0,0,0,0.02)] space-y-4">
          <div className="flex justify-between items-start gap-3">
            <h2 className="font-headline text-lg font-bold text-on-surface leading-snug">Поддержка на сегодня</h2>
            <span className="flex-shrink-0 bg-primary/10 text-primary px-3 py-1 rounded-full text-[10px] font-semibold tracking-wide uppercase">{currentMood}</span>
          </div>
          <AnimatePresence mode="wait">
            <motion.p
              key={quote.index}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="font-body text-on-surface leading-relaxed italic text-[15px]"
            >
              {quote.text}
            </motion.p>
          </AnimatePresence>
          <div className="flex gap-3 pt-1">
            <button
              onClick={handleNewQuote}
              className="flex-1 h-11 rounded-xl font-semibold text-sm transition-transform active:scale-95"
              style={{ background: 'linear-gradient(to right, #006a65, #2fa7a0)', color: '#fff', boxShadow: '0 4px 12px rgba(47,167,160,0.25)' }}
            >
              Другая фраза
            </button>
            <button
              onClick={handleSaveQuote}
              disabled={savedQuote}
              className={`flex-1 h-11 border rounded-xl font-semibold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all ${
                savedQuote
                  ? 'border-primary/30 text-primary bg-primary/5'
                  : 'border-outline-variant text-on-surface-variant hover:bg-surface-container'
              }`}
            >
              <span className="material-symbols-outlined text-lg" style={savedQuote ? { fontVariationSettings: "'FILL' 1" } : undefined}>bookmark</span>
              {savedQuote ? 'Сохранено' : 'Сохранить'}
            </button>
          </div>
        </div>
      </motion.section>

      {/* Horoscope Card — ZODIAC-SPECIFIC */}
      <motion.section variants={itemVariants} className="bg-white p-5 rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.02)] space-y-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-headline text-lg font-bold text-on-surface leading-snug">Гороскоп на сегодня</h2>
          <div className="flex bg-surface-container rounded-full p-1 relative flex-shrink-0">
            <motion.div
              className="absolute top-1 bottom-1 rounded-full bg-white shadow-sm"
              initial={false}
              animate={{
                left: horoscopeTab === 'short' ? '4px' : '50%',
                right: horoscopeTab === 'short' ? '50%' : '4px',
              }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
            <button onClick={() => setHoroscopeTab('short')} className={`relative z-10 px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${horoscopeTab === 'short' ? 'text-primary' : 'text-on-surface-variant'}`}>Сжато</button>
            <button onClick={() => setHoroscopeTab('detailed')} className={`relative z-10 px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${horoscopeTab === 'detailed' ? 'text-primary' : 'text-on-surface-variant'}`}>Подробнее</button>
          </div>
        </div>

        <div className="space-y-3 text-on-surface">
          <div className="flex gap-3">
            <span className="material-symbols-outlined text-primary flex-shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
            <p className="text-sm"><span className="font-bold">Главное:</span> {horoscopeTab === 'short' ? horoscope.main : horoscope.mainDetailed}</p>
          </div>
          <div className="flex gap-3">
            <span className="material-symbols-outlined text-primary flex-shrink-0">lightbulb</span>
            <p className="text-sm"><span className="font-bold">Совет:</span> {horoscope.advice}</p>
          </div>

          {horoscopeTab === 'detailed' && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-3 pt-1">
              <div className="flex items-center gap-3 opacity-80">
                <span className="material-symbols-outlined text-primary flex-shrink-0">dark_mode</span>
                <p className="text-sm"><span className="font-bold">Луна:</span> {horoscope.moon}</p>
              </div>
              <div className="flex items-center gap-3 opacity-80">
                <span className="material-symbols-outlined text-primary flex-shrink-0">balance</span>
                <p className="text-sm"><span className="font-bold">Аспект:</span> {horoscope.aspect}</p>
              </div>
            </motion.div>
          )}
        </div>

        <div className="flex justify-center pt-1">
          <button
            onClick={handleSaveHoroscope}
            disabled={savedHoroscope}
            className={`font-semibold text-sm flex items-center gap-2 transition-all active:scale-95 px-4 py-2 rounded-full ${
              savedHoroscope ? 'text-primary/50' : 'text-primary hover:opacity-80'
            }`}
          >
            <span className="material-symbols-outlined text-lg" style={savedHoroscope ? { fontVariationSettings: "'FILL' 1" } : undefined}>bookmark_add</span>
            {savedHoroscope ? 'Сохранено' : 'Сохранить в закладки'}
          </button>
        </div>
      </motion.section>

      {/* Change Mood Block */}
      <motion.section variants={itemVariants} className="pb-4">
        <button
          onClick={() => setIsMoodSheetOpen(true)}
          className="w-full bg-white border border-outline-variant/30 shadow-[0_4px_20px_rgba(0,0,0,0.02)] rounded-[24px] px-5 py-4 flex items-center gap-3 active:scale-[0.98] transition-all duration-300 hover:bg-surface-container-low"
        >
          <span className="material-symbols-outlined text-primary text-xl">tune</span>
          <span className="text-sm font-semibold text-on-surface flex-grow text-left">Сменить настроение</span>
          <div className="px-2.5 py-0.5 bg-primary/10 rounded-full text-[11px] font-bold text-primary uppercase tracking-tight">{currentMood}</div>
          <span className="material-symbols-outlined text-on-surface-variant text-xl">expand_more</span>
        </button>
      </motion.section>
      </motion.div>

      <AnimatePresence>
        <MoodSheet isOpen={isMoodSheetOpen} onClose={() => setIsMoodSheetOpen(false)} />
      </AnimatePresence>
    </>
  )
}
