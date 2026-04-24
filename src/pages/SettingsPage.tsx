import { memo, useCallback, useEffect, useRef, useState, startTransition } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store'
import { useFirebasePush } from '../hooks'
import { CalendarSheet } from '../features/auth/CalendarSheet'
import { TimePickerSheet } from '../features/auth/TimePickerSheet'
import { isValidEmail } from '../utils/validation'

// Module-level flag — first tab visit fades in once, subsequent visits are instant.
let settingsPageDidMount = false

const FIRST_VISIT_TRANSITION = { duration: 0.25, ease: [0.22, 1, 0.36, 1] as const }

export function SettingsPage() {
  const isFirstVisit = useRef(!settingsPageDidMount)
  const navigate = useNavigate()
  const { permission, requestPermissionAndSubscribe, syncPushSubscription } = useFirebasePush()

  useEffect(() => {
    settingsPageDidMount = true
  }, [])
  const {
    userName,
    email, setEmail,
    birthDate, setBirthDate,
    horoscopeTime, setHoroscopeTime,
    profilePhoto, setProfilePhoto,
    showHoroscope, showHolidays, showSupport,
    toggleHoroscope, toggleHolidays, toggleSupport,
    resetApp,
  } = useAppStore()

  const handleReset = useCallback(() => {
    resetApp()
    navigate('/', { replace: true })
  }, [resetApp, navigate])

  const fileInputRef = useRef<HTMLInputElement>(null)

  const [editingEmail, setEditingEmail] = useState(false)
  const [emailDraft, setEmailDraft] = useState(email)
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const [isTimePickerOpen, setIsTimePickerOpen] = useState(false)

  const handlePhotoClick = useCallback(() => fileInputRef.current?.click(), [])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setProfilePhoto(reader.result as string)
    reader.readAsDataURL(file)
    e.target.value = ''
  }, [setProfilePhoto])

  const handleSaveEmail = useCallback(() => {
    if (!isValidEmail(emailDraft)) return
    setEmail(emailDraft.trim())
    setEditingEmail(false)
  }, [emailDraft, setEmail])

  const isDraftValid = isValidEmail(emailDraft)
  const showEmailError = emailDraft.length > 0 && !isDraftValid

  const handleBack = useCallback(() => navigate(-1), [navigate])
  const openCalendar = useCallback(() => setIsCalendarOpen(true), [])
  const closeCalendar = useCallback(() => setIsCalendarOpen(false), [])
  const openTimePicker = useCallback(() => setIsTimePickerOpen(true), [])
  const closeTimePicker = useCallback(() => setIsTimePickerOpen(false), [])

  const handleSaveBirthDate = useCallback((dateStr: string) => {
    setIsCalendarOpen(false)
    startTransition(() => setBirthDate(dateStr))
  }, [setBirthDate])

  const handleSaveTime = useCallback((time: string) => {
    setIsTimePickerOpen(false)
    startTransition(() => setHoroscopeTime(time))
    // If the user never granted notification permission during onboarding,
    // ask now. Otherwise, refresh the FCM token just in case it rotated.
    if (permission === 'default') {
      void requestPermissionAndSubscribe()
    } else if (permission === 'granted') {
      void syncPushSubscription()
    }
  }, [setHoroscopeTime, permission, requestPermissionAndSubscribe, syncPushSubscription])

  return (
    <motion.div
      initial={isFirstVisit.current ? { opacity: 0 } : false}
      animate={{ opacity: 1 }}
      transition={isFirstVisit.current ? FIRST_VISIT_TRANSITION : undefined}
      style={isFirstVisit.current ? { willChange: 'opacity' } : undefined}
      className="flex flex-col min-h-full bg-background font-body"
    >
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
        <section className="bg-white rounded-[1.5rem] p-6 mb-6 shadow-[0_4px_20px_rgba(0,0,0,0.02)] landscape:mb-0 landscape:col-start-1 landscape:row-start-2">
          <div className="flex flex-col gap-5">

            {/* Email */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-on-surface-variant px-1">Электронная почта</label>
              {editingEmail ? (
                <div className="flex flex-col gap-1">
                  <div className="flex gap-2 items-center">
                    <input
                      autoFocus
                      type="email"
                      value={emailDraft}
                      onChange={(e) => setEmailDraft(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleSaveEmail() }}
                      style={{ fontSize: '16px' }}
                      className={`flex-1 bg-surface-container-low rounded-xl px-5 py-3.5 text-on-surface border outline-none focus:ring-2 text-sm transition-colors ${showEmailError ? 'border-red-300 focus:ring-red-200' : 'border-primary/40 focus:ring-primary/20'}`}
                    />
                    <button
                      onClick={handleSaveEmail}
                      disabled={!isDraftValid}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform ${isDraftValid ? 'bg-primary active:scale-95' : 'bg-primary/30 opacity-40 cursor-not-allowed'}`}
                    >
                      <span className="material-symbols-outlined text-white text-[18px]">check</span>
                    </button>
                  </div>
                  {showEmailError && (
                    <p className="text-xs text-red-500 mt-1 pl-1">Введите корректный email</p>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-between bg-surface-container-low rounded-xl px-5 py-3.5">
                  <span className="text-on-surface-variant text-sm">{email || '—'}</span>
                  <button
                    onClick={() => { setEmailDraft(email); setEditingEmail(true) }}
                    className="text-on-surface-variant/50 active:text-primary active:scale-90 transition-colors ml-3 flex-shrink-0"
                  >
                    <span className="material-symbols-outlined text-[18px]">edit</span>
                  </button>
                </div>
              )}
            </div>

            {/* Birth Date */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-on-surface-variant px-1">Дата рождения</label>
              <div className="flex items-center justify-between bg-surface-container-low rounded-xl px-5 py-3.5">
                <span className="text-on-surface text-sm">{birthDate || '—'}</span>
                <button
                  onClick={openCalendar}
                  className="text-on-surface-variant/50 active:text-primary active:scale-90 transition-colors ml-3 flex-shrink-0"
                >
                  <span className="material-symbols-outlined text-[18px]">edit</span>
                </button>
              </div>
            </div>

            {/* Horoscope Time */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-on-surface-variant px-1">Время гороскопа</label>
              <div className="flex items-center justify-between bg-surface-container-low rounded-xl px-5 py-3.5">
                <span className="text-on-surface text-sm">{horoscopeTime || '—'}</span>
                <button
                  onClick={openTimePicker}
                  className="text-on-surface-variant/50 active:text-primary active:scale-90 transition-colors ml-3 flex-shrink-0"
                >
                  <span className="material-symbols-outlined text-[18px]">edit</span>
                </button>
              </div>
            </div>

          </div>
        </section>

        {/* Контент */}
        <section className="bg-white rounded-[1.5rem] p-6 mb-6 shadow-[0_4px_20px_rgba(0,0,0,0.02)] landscape:mb-0 landscape:col-start-2 landscape:row-start-1">
          <h2 className="text-sm font-bold text-on-surface mb-5 px-1 uppercase tracking-wider opacity-60">Контент</h2>
          <div className="flex flex-col gap-6">
            <ToggleItem label="Гороскоп" isActive={showHoroscope} onToggle={toggleHoroscope} />
            <ToggleItem label="Праздники" isActive={showHolidays} onToggle={toggleHolidays} />
            <ToggleItem label="Поддержка на сегодня" isActive={showSupport} onToggle={toggleSupport} />
          </div>
        </section>

        {/* Reset */}
        <section className="mb-6 landscape:mb-0 landscape:col-start-2 landscape:row-start-2">
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

      {/* TimePickerSheet */}
      <TimePickerSheet
        isOpen={isTimePickerOpen}
        initialTime={horoscopeTime || '09:00'}
        onSave={handleSaveTime}
        onCancel={closeTimePicker}
      />
    </motion.div>
  )
}

const ToggleItem = memo(function ToggleItem({ label, isActive, onToggle }: { label: string; isActive: boolean; onToggle: () => void }) {
  return (
    <div className="flex items-center justify-between">
      <span className="font-medium text-on-surface">{label}</span>
      <button
        onClick={onToggle}
        className={`w-12 h-6 rounded-full relative transition-colors duration-300 ${isActive ? 'bg-accent' : 'bg-surface-container-highest'}`}
      >
        <motion.span
          animate={{ x: isActive ? 24 : 4 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          style={{ willChange: 'transform' }}
          className="absolute left-0 top-1 w-4 h-4 bg-white rounded-full shadow-sm"
        />
      </button>
    </div>
  )
})

