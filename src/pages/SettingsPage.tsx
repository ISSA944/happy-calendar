import { useCallback, useEffect, useRef, useState, startTransition } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAppStore } from '../store'
import { CalendarSheet } from '../features/auth/CalendarSheet'
import { BottomSheet } from '../components/ui/BottomSheet'
import { GoalsSelector } from '../features/goals/GoalsSelector'
import { GoalsProgress } from '../features/goals/GoalsProgress'
import { useGoalsEditor } from '../features/goals/useGoalsEditor'
import { NotificationCategoriesEditor } from '../features/notifications/NotificationCategoriesEditor'
import { useNotificationCategories } from '../features/notifications/useNotificationCategories'
import { prepareAvatarDataUrl } from '../utils/image'

export function SettingsPage() {
  const navigate = useNavigate()
  const location = useLocation()

  const {
    userName,
    email,
    birthDate, setBirthDate,
    profilePhoto, setProfilePhoto,
    goals, fetchGoals, setGoals,
    resetApp,
  } = useAppStore()
  const notificationCategories = useNotificationCategories()

  const handleReset = useCallback(async () => {
    await resetApp()
    navigate('/', { replace: true })
  }, [resetApp, navigate])

  const fileInputRef = useRef<HTMLInputElement>(null)

  const [isEmailConfirmOpen, setIsEmailConfirmOpen] = useState(false)
  const [showEmailSuccess, setShowEmailSuccess] = useState(false)
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const goalsEditor = useGoalsEditor(goals, setGoals)

  useEffect(() => {
    void fetchGoals()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if ((location.state as { emailChanged?: boolean } | null)?.emailChanged) {
      setShowEmailSuccess(true)
      window.history.replaceState({}, document.title)
    }
  }, [location.state])

  const handlePhotoClick = useCallback(() => fileInputRef.current?.click(), [])

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      setProfilePhoto(await prepareAvatarDataUrl(file))
    } finally {
      e.target.value = ''
    }
  }, [setProfilePhoto])

  const handleBack = useCallback(() => navigate(-1), [navigate])
  const openCalendar = useCallback(() => setIsCalendarOpen(true), [])
  const closeCalendar = useCallback(() => setIsCalendarOpen(false), [])

  const handleSaveBirthDate = useCallback((dateStr: string) => {
    setIsCalendarOpen(false)
    startTransition(() => setBirthDate(dateStr))
  }, [setBirthDate])

  return (
    <div className="flex flex-col min-h-full bg-background font-body">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* TopAppBar */}
      <header className="sticky top-0 w-full z-50 bg-background px-5 pt-[env(safe-area-inset-top,0px)] border-b border-primary/5">
        <div className="flex items-center h-16 relative">
          <button
            onClick={handleBack}
            aria-label="Назад"
            className="w-10 h-10 -ml-1 text-primary hover:bg-black/5 rounded-full transition-colors active:scale-95 flex items-center justify-center shrink-0"
          >
            <span className="material-symbols-outlined text-[24px]">arrow_back</span>
          </button>
          <h1 className="absolute left-1/2 -translate-x-1/2 font-headline font-bold text-lg tracking-tight text-primary">Настройки</h1>
        </div>
      </header>

      <main className="w-full max-w-[430px] landscape:max-w-[860px] mx-auto px-6 pb-28 hide-scrollbar landscape:grid landscape:grid-cols-2 landscape:gap-x-6 landscape:gap-y-6 landscape:items-start">
        {/* Profile Block */}
        <section className="flex items-center gap-6 mb-10 mt-4 landscape:mb-0 landscape:mt-0 landscape:col-start-1 landscape:row-start-1">
          <button
            onClick={handlePhotoClick}
            className="relative flex-shrink-0 active:scale-95 transition-transform"
            aria-label="Сменить фото профиля"
          >
            <div className="w-20 h-20 rounded-full overflow-hidden bg-surface-container-high ring-4 ring-surface-container-low flex items-center justify-center text-on-surface-variant">
              {profilePhoto
                ? <img src={profilePhoto} className="w-full h-full object-cover" alt="Фото профиля" />
                : <span className="material-symbols-outlined text-4xl">person</span>
              }
            </div>
            <div className="absolute bottom-0 right-0 p-1.5 rounded-full shadow-lg border-2 border-surface bg-accent pointer-events-none">
              <span className="material-symbols-outlined text-white text-sm">photo_camera</span>
            </div>
          </button>
          <div className="flex flex-col gap-1">
            <span className="font-headline text-xl font-bold text-on-surface">
              {userName || 'Профиль'}
            </span>
            <button
              onClick={handlePhotoClick}
              className="text-sm font-medium text-left text-accent active:opacity-60 transition-opacity"
            >
              Сменить фото
            </button>
          </div>
        </section>

        {/* Account Section */}
        <section className="bg-white rounded-[1.5rem] p-6 mb-6 shadow-[0_4px_20px_rgba(0,0,0,0.02)] landscape:mb-0 landscape:col-span-2 landscape:row-start-2">
          <div className="flex flex-col gap-5">
            {/* Email */}
            <div className="flex flex-col gap-2 min-w-0">
              <label className="text-xs font-semibold text-on-surface-variant px-1">Электронная почта</label>
              <div className="flex items-center justify-between gap-3 bg-surface-container-low rounded-xl px-5 py-3.5">
                <span className="text-on-surface-variant text-sm min-w-0 flex-1 truncate">{email || '—'}</span>
                <button
                  onClick={() => setIsEmailConfirmOpen(true)}
                  className="text-on-surface-variant/50 active:text-primary active:scale-90 transition-colors flex-shrink-0"
                  aria-label="Поменять электронную почту"
                >
                  <span className="material-symbols-outlined text-[18px]">edit</span>
                </button>
              </div>
            </div>

            {/* Birth Date */}
            <div className="flex flex-col gap-2 min-w-0">
              <label className="text-xs font-semibold text-on-surface-variant px-1">Дата рождения</label>
              <div className="flex items-center justify-between gap-3 bg-surface-container-low rounded-xl px-5 py-3.5">
                <span className="text-on-surface text-sm min-w-0 flex-1 truncate">{birthDate || '—'}</span>
                <button
                  onClick={openCalendar}
                  className="text-on-surface-variant/50 active:text-primary active:scale-90 transition-colors flex-shrink-0"
                >
                  <span className="material-symbols-outlined text-[18px]">edit</span>
                </button>
              </div>
            </div>

          </div>
        </section>

        {/* 🆕 Мои цели за год (ТЗ п. 4.5) */}
        <section className="bg-white rounded-[1.5rem] p-6 mb-6 shadow-[0_4px_20px_rgba(0,0,0,0.02)] landscape:mb-0 landscape:col-span-2 landscape:row-start-3">
          <div className="flex items-baseline justify-between mb-4 px-1">
            <h2 className="text-sm font-bold text-on-surface uppercase tracking-wider opacity-60">Мои цели за год</h2>
            <button
              onClick={goalsEditor.open}
              className="text-xs font-semibold text-primary bg-primary/10 px-3 py-1.5 rounded-full flex-shrink-0 active:scale-95 transition-transform"
            >
              Изменить цели →
            </button>
          </div>
          <GoalsProgress goals={goals} onReactivate={goalsEditor.handleReactivateGoal} />
        </section>

        {/* Уведомления — время и категории */}
        <section className="bg-white rounded-[1.5rem] p-6 mb-6 shadow-[0_4px_20px_rgba(0,0,0,0.02)] landscape:mb-0 landscape:col-start-2 landscape:row-start-1">
          <h2 className="text-sm font-bold text-on-surface mb-1 px-1 uppercase tracking-wider opacity-60">Уведомления</h2>
          <p className="text-xs text-on-surface-variant/70 mb-2 px-1">Когда и что тебе присылать</p>
          <NotificationCategoriesEditor categories={notificationCategories} />
        </section>

        {/* Reset */}
        <section className="mb-6 landscape:mb-0 landscape:col-span-2 landscape:row-start-4">
          <button
            onClick={handleReset}
            className="w-full py-4 rounded-[1.5rem] border border-red-200 text-red-500 font-semibold text-sm active:scale-[0.98] transition-colors hover:bg-red-50"
          >
            Сбросить профиль и начать заново
          </button>
        </section>

        <div className="h-6 landscape:hidden" />
      </main>

      {/* CalendarSheet */}
      <CalendarSheet
        isOpen={isCalendarOpen}
        onClose={closeCalendar}
        onSelect={handleSaveBirthDate}
        currentValue={birthDate}
      />

      {/* Goals editor — тот же GoalsSelector, что в онбординге (ТЗ п. 4.5 «Изменить цели») */}
      <BottomSheet isOpen={goalsEditor.isOpen} onClose={goalsEditor.close} title="Твои цели">
        <div className="px-5 pb-6 flex flex-col gap-4">
          <GoalsSelector selected={goalsEditor.editingGoals} onToggle={goalsEditor.toggle} />
          <button
            onClick={goalsEditor.save}
            className="w-full h-12 rounded-full bg-primary-container text-white font-headline font-bold text-sm"
          >
            Сохранить
          </button>
        </div>
      </BottomSheet>

      <AnimatePresence>
        {isEmailConfirmOpen && (
          <motion.div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-inverse-surface/60 p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsEmailConfirmOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="bg-surface-container-lowest w-full max-w-sm rounded-[2rem] p-8 shadow-[0_20px_40px_rgba(0,0,0,0.08)] flex flex-col items-center text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-16 h-16 rounded-full bg-error-container/30 text-error flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
              </div>
              <h2 className="font-headline text-xl font-bold text-on-surface mb-8 leading-snug">
                Вы точно хотите поменять свою электронную почту?
              </h2>
              <div className="flex flex-col w-full gap-3">
                <button
                  onClick={() => {
                    setIsEmailConfirmOpen(false)
                    navigate('/change-email')
                  }}
                  className="w-full min-h-[44px] rounded-full bg-primary text-on-primary font-body font-medium text-base hover:opacity-90 transition-opacity shadow-[0_4px_14px_rgba(0,106,101,0.2)]"
                >
                  Да
                </button>
                <button
                  onClick={() => setIsEmailConfirmOpen(false)}
                  className="w-full min-h-[44px] rounded-full bg-transparent text-on-surface-variant font-body font-medium text-base hover:bg-surface-container-low transition-colors"
                >
                  Отмена
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showEmailSuccess && (
          <>
            <style>{`
              nav { display: none !important; }
            `}</style>
            <motion.div
              className="fixed inset-0 z-[10000] flex items-end justify-center bg-on-background/50 p-0 sm:items-center sm:p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ opacity: 0, y: 32, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.96 }}
              transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
              className="relative w-full max-w-md overflow-hidden rounded-t-[2.5rem] bg-surface-container-lowest px-8 pt-8 text-center shadow-[0_32px_64px_-12px_rgba(28,28,25,0.15)] sm:rounded-[2.5rem] pb-[max(3rem,calc(env(safe-area-inset-bottom)+1.5rem))]"
            >
              {/* Handle for Bottom Sheet (Mobile Only) */}
              <div className="mx-auto mb-8 h-1.5 w-12 rounded-full bg-surface-dim sm:hidden" />
              
              {/* Soft Glow Background Effect */}
              <div className="pointer-events-none absolute left-1/2 top-0 h-48 w-48 -translate-x-1/2 rounded-full bg-primary-container opacity-30 blur-[80px]" />
              
              {/* Icon Container */}
              <div className="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary-container/20 text-primary">
                <div className="absolute inset-0 rounded-full bg-primary-container/10 blur-md" />
                <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  check_circle
                </span>
              </div>

              {/* Content */}
              <h2 className="font-headline text-2xl font-bold tracking-tight text-on-surface mb-3">
                Почта успешно изменена
              </h2>
              <p className="mx-auto mb-10 max-w-[280px] font-body text-base leading-relaxed text-on-surface-variant">
                Ваш профиль обновлен. Теперь вы можете использовать новый адрес для входа.
              </p>

              {/* Action Button */}
              <button
                type="button"
                onClick={() => setShowEmailSuccess(false)}
                className="w-full bg-primary text-on-primary font-headline font-semibold text-[17px] py-4 px-6 rounded-full shadow-[0_8px_24px_-8px_rgba(0,106,101,0.4)] hover:shadow-[0_12px_32px_-8px_rgba(0,106,101,0.5)] active:scale-[0.98] transition-all duration-200"
              >
                Готово
              </button>
            </motion.div>
          </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
