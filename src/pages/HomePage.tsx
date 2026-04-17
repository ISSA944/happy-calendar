import { useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence, useDragControls } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import type { Variants } from 'framer-motion'
import { useAppStore } from '../store'
import { MoodSheet } from '../features/mood/MoodSheet'
import { usePWAInstall } from '../hooks'
import { useState } from 'react'
import {
  getGreeting,
  getTodayFormatted,
  getTodayHoliday,
  getRandomQuote,
  getHoroscope,
  getMoodImage,
  getMoodLabel,
  getFullDateStr,
} from '../services/content.service'

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.05 } }
}
const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } }
}

export function HomePage() {
  const navigate = useNavigate()

  const currentMood = useAppStore(s => s.currentMood)
  const gender = useAppStore(s => s.gender)
  const zodiacSign = useAppStore(s => s.zodiacSign)
  const dailyPack = useAppStore(s => s.dailyPack)
  const initDailyPack = useAppStore(s => s.initDailyPack)
  const setSupportPhrase = useAppStore(s => s.setSupportPhrase)
  const addBookmark = useAppStore(s => s.addBookmark)
  const bookmarks = useAppStore(s => s.bookmarks)
  const profilePhoto = useAppStore(s => s.profilePhoto)

  const installBannerDismissed = useAppStore(s => s.installBannerDismissed)
  const dismissInstallBanner = useAppStore(s => s.dismissInstallBanner)

  const [horoscopeTab, setHoroscopeTab] = useState<'short' | 'detailed'>('short')
  const [isMoodSheetOpen, setIsMoodSheetOpen] = useState(false)
  const [showIOSModal, setShowIOSModal] = useState(false)
  const iosDragControls = useDragControls()

  const quoteIdxRef = useRef<number>(-1)

  useEffect(() => {
    initDailyPack(zodiacSign, currentMood)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const supportPhrase = dailyPack?.supportPhrase ?? ''
  const holiday = getTodayHoliday()
  const horoscope = getHoroscope(zodiacSign)
  const moodImage = getMoodImage(currentMood)
  const todayStr = getFullDateStr()

  const savedQuote = bookmarks.some(b => b.type === 'поддержка' && b.text === supportPhrase)
  const savedHoroscope = bookmarks.some(b => b.type === 'гороскоп' && b.date === todayStr)

  const handleNewQuote = useCallback(() => {
    const { text, index } = getRandomQuote(currentMood, quoteIdxRef.current, gender)
    quoteIdxRef.current = index
    setSupportPhrase(text)
  }, [currentMood, gender, setSupportPhrase])

  const handleSaveQuote = useCallback(() => {
    if (!supportPhrase || savedQuote) return
    addBookmark({ id: `q-${Date.now()}`, type: 'поддержка', date: todayStr, text: supportPhrase, icon: 'favorite' })
  }, [addBookmark, supportPhrase, savedQuote, todayStr])

  const handleSaveHoroscope = useCallback(() => {
    if (savedHoroscope) return
    const text = horoscopeTab === 'short' ? horoscope.main : horoscope.mainDetailed
    addBookmark({ id: `h-${Date.now()}`, type: 'гороскоп', date: todayStr, text: `${zodiacSign}: ${text}`, icon: 'auto_awesome' })
  }, [addBookmark, horoscope, horoscopeTab, savedHoroscope, zodiacSign, todayStr])

  const { isInstallable, isInstalled, isIOS, triggerInstall } = usePWAInstall()
  const showInstallBanner = isInstallable && !isInstalled && !installBannerDismissed

  const handleInstallClick = () => {
    if (isIOS) {
      setShowIOSModal(true)
    } else {
      triggerInstall()
    }
  }

  return (
    <>
      <motion.div
        initial="hidden"
        animate="show"
        variants={containerVariants}
        className="max-w-[430px] mx-auto px-5 space-y-8 pt-2 pb-8"
      >

      {/* PWA Install Banner */}
      <AnimatePresence>
        {showInstallBanner && (
          <motion.div
            key="pwa-banner"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="bg-surface-container-low rounded-[24px] p-4 border border-white/40 flex items-center gap-4 relative shadow-[0_4px_20px_rgba(0,0,0,0.03)]"
          >
            <button
              onClick={() => dismissInstallBanner()}
              className="absolute top-3 right-3 text-on-surface-variant/30 hover:text-on-surface-variant transition-colors active:scale-90"
              aria-label="Закрыть"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
            <div className="w-12 h-12 flex-shrink-0 bg-white rounded-2xl flex items-center justify-center shadow-sm">
              <span className="material-symbols-outlined text-primary-container text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>calendar_today</span>
            </div>
            <div className="flex-1 min-w-0 pr-2">
              <p className="font-headline font-bold text-on-surface text-sm tracking-tight">Установить приложение</p>
              <p className="text-[12px] text-on-surface-variant/80 font-medium leading-tight">Работает офлайн · Как родное</p>
            </div>
            <button
              onClick={handleInstallClick}
              className="flex-shrink-0 bg-primary-container text-white px-5 py-2 rounded-full font-bold text-xs shadow-sm active:scale-95 transition-all"
            >
              Установить
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.header variants={itemVariants} className="flex justify-between items-center py-2">
        <div className="w-10 h-10 rounded-full overflow-hidden bg-surface-container-high border-2 border-surface-container-lowest flex items-center justify-center">
          {profilePhoto
            ? <img src={profilePhoto} className="w-full h-full object-cover" alt="avatar" />
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
      </motion.header>

      {/* Welcome */}
      <motion.section variants={itemVariants} className="space-y-1">
        <h1 className="font-headline text-4xl font-extrabold tracking-tight text-on-surface leading-tight">{getGreeting()}</h1>
        <div className="inline-flex items-center px-3 py-1 bg-surface-container rounded-full text-xs font-medium text-on-surface-variant gap-1.5">
          <span>Твой знак: {zodiacSign || '—'}</span>
        </div>
      </motion.section>

      {/* Holiday Card */}
      {holiday && (
        <motion.section variants={itemVariants} className="bg-surface-container-lowest p-5 rounded-lg flex items-center gap-5 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
          <div className="w-16 h-16 flex-shrink-0 bg-secondary-fixed/30 rounded-full flex items-center justify-center">
            <span className="material-symbols-outlined text-[32px] text-secondary/70" style={{ fontVariationSettings: "'FILL' 1" }}>{holiday.icon}</span>
          </div>
          <div className="space-y-1 min-w-0">
            <h2 className="font-headline text-base font-bold text-on-surface leading-snug">Сегодня праздник: {holiday.name}</h2>
            <p className="text-sm text-on-surface-variant leading-tight">{holiday.description}</p>
          </div>
        </motion.section>
      )}

      {/* Mood Banner */}
      <motion.section variants={itemVariants} className="w-full h-[200px] rounded-lg overflow-hidden relative">
        <img
          src={moodImage}
          alt={currentMood}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
        <div className="absolute top-4 right-4 z-10 bg-white/90 text-primary px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm">
          {getMoodLabel(currentMood, gender)}
        </div>
      </motion.section>

      {/* Support Card */}
      <motion.section variants={itemVariants} className="bg-surface-container-low p-6 rounded-lg shadow-[0_4px_20px_rgba(0,0,0,0.02)] space-y-4">
        <div className="flex justify-between items-start gap-3">
          <h2 className="font-headline text-xl font-bold text-on-surface">Поддержка на сегодня</h2>
          <span className="flex-shrink-0 bg-primary-container/20 text-on-primary-container px-3 py-1 rounded-full text-xs font-semibold tracking-wide">{getMoodLabel(currentMood, gender)}</span>
        </div>

        <AnimatePresence mode="wait">
          <motion.p
            key={supportPhrase}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="font-body text-on-surface leading-relaxed italic text-[15px] min-h-[60px]"
          >
            {supportPhrase}
          </motion.p>
        </AnimatePresence>

        <div className="flex gap-3 pt-2">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleNewQuote}
            className="flex-1 h-12 bg-primary-container text-white rounded-xl font-semibold text-sm"
          >
            Другая фраза
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleSaveQuote}
            disabled={savedQuote}
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
      </motion.section>

      {/* Horoscope */}
      <motion.section variants={itemVariants} className="bg-surface-container-lowest p-6 rounded-lg shadow-[0_4px_20px_rgba(0,0,0,0.02)] space-y-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-headline text-xl font-bold text-on-surface">Гороскоп на сегодня</h2>
          <div className="flex bg-surface-container rounded-full p-1 flex-shrink-0">
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => setHoroscopeTab('short')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors duration-200 ${horoscopeTab === 'short' ? 'bg-white text-primary shadow-sm' : 'text-on-surface-variant'}`}
            >
              Сжато
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => setHoroscopeTab('detailed')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors duration-200 ${horoscopeTab === 'detailed' ? 'bg-white text-primary shadow-sm' : 'text-on-surface-variant'}`}
            >
              Подробнее
            </motion.button>
          </div>
        </div>

        <div className="space-y-4 text-on-surface">
          <div className="flex gap-3">
            <span className="material-symbols-outlined text-primary-container flex-shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
            <p className="text-sm"><span className="font-bold">Главное:</span> {horoscopeTab === 'short' ? horoscope.main : horoscope.mainDetailed}</p>
          </div>
          <div className="flex gap-3">
            <span className="material-symbols-outlined text-primary-container flex-shrink-0">lightbulb</span>
            <p className="text-sm"><span className="font-bold">Совет:</span> {horoscope.advice}</p>
          </div>

          {horoscopeTab === 'detailed' && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-4 pt-1"
            >
              <div className="flex items-center gap-3 opacity-80">
                <span className="material-symbols-outlined text-primary-container flex-shrink-0">dark_mode</span>
                <p className="text-sm"><span className="font-bold">Луна:</span> {horoscope.moon}</p>
              </div>
              <div className="flex items-center gap-3 opacity-80">
                <span className="material-symbols-outlined text-primary-container flex-shrink-0">balance</span>
                <p className="text-sm"><span className="font-bold">Аспект:</span> {horoscope.aspect}</p>
              </div>
            </motion.div>
          )}
        </div>

        <div className="flex justify-center pt-2">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleSaveHoroscope}
            disabled={savedHoroscope}
            className={`font-semibold text-sm flex items-center gap-2 transition-colors px-4 py-2 rounded-full ${
              savedHoroscope ? 'text-primary/50' : 'text-primary hover:opacity-80'
            }`}
          >
            <span className="material-symbols-outlined text-lg" style={savedHoroscope ? { fontVariationSettings: "'FILL' 1" } : undefined}>bookmark_add</span>
            {savedHoroscope ? 'Сохранено' : 'Сохранить в закладки'}
          </motion.button>
        </div>
      </motion.section>

      {/* Change Mood */}
      <motion.section variants={itemVariants} className="pb-4">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => setIsMoodSheetOpen(true)}
          className="w-full bg-surface-container-lowest border border-outline-variant/30 shadow-sm rounded-[24px] px-5 py-4 flex items-center gap-3 transition-colors duration-300 hover:bg-surface-container-low"
        >
          <span className="material-symbols-outlined text-primary text-xl">tune</span>
          <span className="text-sm font-semibold text-on-surface flex-grow text-left">Сменить настроение</span>
          <div className="px-2.5 py-0.5 bg-primary-container/10 rounded-full text-[11px] font-bold text-primary uppercase tracking-tight">{getMoodLabel(currentMood, gender)}</div>
          <span className="material-symbols-outlined text-on-surface-variant text-xl">expand_more</span>
        </motion.button>
      </motion.section>
      </motion.div>

      {/* iOS Install Modal — rendered via portal to escape AppLayout stacking context */}
      {createPortal(
      <AnimatePresence>
        {showIOSModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.32, ease: [0.32, 0.72, 0, 1] } }}
              transition={{ duration: 0.2 }}
              onClick={() => setShowIOSModal(false)}
              className="fixed inset-0 z-[100] bg-black/40"
              style={{ willChange: 'opacity', transform: 'translateZ(0)' }}
            />
            <motion.div
              drag="y"
              dragControls={iosDragControls}
              dragListener={false}
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.25 }}
              onDragEnd={(_, { offset, velocity }) => {
                if (offset.y > 60 || velocity.y > 200) {
                  setShowIOSModal(false)
                  dismissInstallBanner()
                }
              }}
              initial={{ y: '100%' }}
              animate={{ y: 0, transition: { type: 'spring', damping: 25, stiffness: 200 } }}
              exit={{ y: '100%', transition: { duration: 0.32, ease: [0.32, 0.72, 0, 1] } }}
              className="fixed bottom-0 left-0 right-0 z-[100] max-w-[430px] mx-auto bg-surface-container-lowest rounded-t-[28px] shadow-2xl"
              style={{ paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))', willChange: 'transform', transform: 'translateZ(0)' }}
            >
              {/* Drag zone — pill + top area for easy grab */}
              <div
                className="pt-4 pb-4 touch-none select-none cursor-grab flex justify-center"
                onPointerDown={(e) => iosDragControls.start(e)}
              >
                <div className="w-10 h-1 bg-surface-container-highest rounded-full" />
              </div>
              <div className="px-6 pb-2 flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-primary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>calendar_today</span>
                </div>
                <div>
                  <p className="font-headline font-bold text-on-surface text-base">Установить на iPhone</p>
                  <p className="text-xs text-on-surface-variant mt-0.5">3 простых шага в Safari</p>
                </div>
              </div>
              <div className="px-6">
                <div className="space-y-4 mb-8">
                  {[
                    { icon: 'ios_share', text: 'Нажмите иконку "Поделиться" внизу Safari' },
                    { icon: 'add_box', text: 'Выберите "На экран «Домой»"' },
                    { icon: 'check_circle', text: 'Нажмите "Добавить" — готово!' },
                  ].map((step, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="material-symbols-outlined text-primary text-lg">{step.icon}</span>
                      </div>
                      <p className="text-sm text-on-surface font-medium">{step.text}</p>
                    </div>
                  ))}
                </div>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => { setShowIOSModal(false); dismissInstallBanner() }}
                  className="w-full py-4 bg-primary-container text-white rounded-full font-headline font-bold text-sm"
                >
                  Понятно
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>,
      document.body
      )}

      {/* MoodSheet — also portaled for z-index consistency */}
      {createPortal(
      <AnimatePresence>
        {isMoodSheetOpen && (
          <MoodSheet onClose={() => setIsMoodSheetOpen(false)} />
        )}
      </AnimatePresence>,
      document.body
      )}
    </>
  )
}
