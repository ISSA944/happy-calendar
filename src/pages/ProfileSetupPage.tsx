import { useState, useMemo, useRef, startTransition } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { apiClient } from '../api'
import { useFirebasePush } from '../hooks'
import { useAppStore } from '../store'
import { localTimeToUtc } from '../lib/time'
import { prepareAvatarDataUrl } from '../utils/image'

// Helper function to calculate Zodiac
function getZodiac(dateStr: string): string | null {
  if (!dateStr || dateStr.length < 5) return null
  
  // Clean input and extract DD.MM
  const clean = dateStr.replace(/[^\d]/g, '')
  if (clean.length < 4) return null
  
  const day = parseInt(clean.substring(0, 2), 10)
  const month = parseInt(clean.substring(2, 4), 10)
  
  if (isNaN(day) || isNaN(month) || month < 1 || month > 12 || day < 1 || day > 31) return null

  // Basic zodiac dates
  if ((month == 1 && day <= 20) || (month == 12 && day >= 22)) return 'Козерог ♑︎'
  if ((month == 1 && day >= 21) || (month == 2 && day <= 18)) return 'Водолей ♒︎'
  if ((month == 2 && day >= 19) || (month == 3 && day <= 20)) return 'Рыбы ♓︎'
  if ((month == 3 && day >= 21) || (month == 4 && day <= 20)) return 'Овен ♈︎'
  if ((month == 4 && day >= 21) || (month == 5 && day <= 20)) return 'Телец ♉︎'
  if ((month == 5 && day >= 21) || (month == 6 && day <= 21)) return 'Близнецы ♊︎'
  if ((month == 6 && day >= 22) || (month == 7 && day <= 22)) return 'Рак ♋︎'
  if ((month == 7 && day >= 23) || (month == 8 && day <= 23)) return 'Лев ♌︎'
  if ((month == 8 && day >= 24) || (month == 9 && day <= 23)) return 'Дева ♍︎'
  if ((month == 9 && day >= 24) || (month == 10 && day <= 23)) return 'Весы ♎︎'
  if ((month == 10 && day >= 24) || (month == 11 && day <= 22)) return 'Скорпион ♏︎'
  if ((month == 11 && day >= 23) || (month == 12 && day <= 21)) return 'Стрелец ♐︎'

  return null
}

function isValidBirthDate(dateStr: string): boolean {
  const match = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(dateStr)
  if (!match) return false

  const day = Number(match[1])
  const month = Number(match[2]) - 1
  const year = Number(match[3])
  const candidate = new Date(year, month, day)

  return (
    candidate.getFullYear() === year &&
    candidate.getMonth() === month &&
    candidate.getDate() === day
  )
}

import { CalendarSheet } from '../features/auth/CalendarSheet'

export function ProfileSetupPage() {
  const navigate = useNavigate()
  const storeBirthDate = useAppStore((s) => s.setBirthDate)
  const storeGender = useAppStore((s) => s.setGender)
  const storeZodiac = useAppStore((s) => s.setZodiacSign)
  const setHasCompletedOnboarding = useAppStore((s) => s.setHasCompletedOnboarding)
  const setShowOnboardingLoader = useAppStore((s) => s.setShowOnboardingLoader)
  const horoscopeTime = useAppStore((s) => s.horoscopeTime)
  const showHoroscope = useAppStore((s) => s.showHoroscope)
  const showHolidays = useAppStore((s) => s.showHolidays)
  const showSupport = useAppStore((s) => s.showSupport)
  const profilePhoto = useAppStore((s) => s.profilePhoto)
  const setProfilePhoto = useAppStore((s) => s.setProfilePhoto)
  const { syncPushSubscription } = useFirebasePush()

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [birthDate, setBirthDate] = useState('')
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const [gender, setGender] = useState<'F' | 'M' | 'UNKNOWN'>('UNKNOWN')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const handlePhotoClick = () => fileInputRef.current?.click()

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      setProfilePhoto(await prepareAvatarDataUrl(file))
    } finally {
      e.target.value = ''
    }
  }

  const zodiacSign = useMemo(() => getZodiac(birthDate), [birthDate])
  const hasSelectedBirthDate = useMemo(() => isValidBirthDate(birthDate), [birthDate])
  const isValid = hasSelectedBirthDate && !!zodiacSign

  const handleSubmit = async () => {
    if (!isValid || isSubmitting) return

    setIsSubmitting(true)
    setSubmitError('')

    try {
      await apiClient.patch('profile', {
        birthdate: birthDate,
        zodiacSign: zodiacSign ?? '',
        gender,
        pushTime: localTimeToUtc(horoscopeTime),
        horoscopeEnabled: showHoroscope,
        holidaysEnabled: showHolidays,
        supportEnabled: showSupport,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      })

      await syncPushSubscription()

      storeBirthDate(birthDate)
      storeGender(gender)
      storeZodiac(zodiacSign ?? '')
      setHasCompletedOnboarding(true)
      setShowOnboardingLoader(true)  // включить прелоадер перед переходом на Home
      navigate('/home')
    } catch {
      setSubmitError('Не удалось сохранить профиль. Проверь соединение и попробуй ещё раз.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.18, ease: [0.32, 0.72, 0, 1] }}
      style={{ willChange: 'opacity' }}
      className="relative bg-background text-on-surface font-body selection:bg-primary/20 selection:text-primary h-[100dvh] w-full max-w-[430px] landscape:max-w-[860px] mx-auto overflow-x-hidden overflow-y-auto overscroll-none scroll-smooth"
    >
      {/* TopAppBar */}
      <header className="sticky top-0 w-full z-50 bg-background px-5 pt-[env(safe-area-inset-top,0px)] border-b border-primary/5">
        <div className="flex items-center h-16 relative">
          <button
            onClick={() => navigate(-1)}
            aria-label="Назад"
            className="w-10 h-10 -ml-1 text-primary hover:bg-black/5 rounded-full transition-colors active:scale-95 flex items-center justify-center shrink-0"
          >
            <span className="material-symbols-outlined text-[24px]">arrow_back</span>
          </button>
          <h1 className="absolute left-1/2 -translate-x-1/2 font-headline font-bold text-lg text-primary tracking-tight">Дата рождения</h1>
        </div>
      </header>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Portrait: single column. Landscape: 2-column grid */}
      <main className="flex-1 flex flex-col landscape:grid landscape:grid-cols-2 landscape:gap-6 landscape:items-stretch px-5 pb-8 landscape:pb-6 pt-6 landscape:pt-4">

        {/* Portrait: above form. Landscape: right column with avatar + CTA */}
        <div className="order-1 flex flex-col items-center mb-8 landscape:order-none landscape:col-start-2 landscape:row-start-1 landscape:mb-0 landscape:min-h-[320px] landscape:justify-center landscape:rounded-[28px] landscape:border landscape:border-outline-variant/30 landscape:bg-white/60 landscape:p-5 landscape:shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
          <button
            onClick={handlePhotoClick}
            className="relative w-28 h-28 landscape:w-24 landscape:h-24 active:scale-95 transition-transform outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
            aria-label="Сменить фото профиля"
          >
            <div className="w-full h-full rounded-full bg-surface shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-outline-variant/20 flex items-center justify-center overflow-hidden text-outline-variant">
              {profilePhoto
                ? <img src={profilePhoto} className="w-full h-full object-cover" alt="Фото профиля" />
                : <span className="material-symbols-outlined text-[48px]" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
              }
            </div>
            <div className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center shadow-lg border-2 border-background pointer-events-none">
              <span className="material-symbols-outlined text-[16px]">add_a_photo</span>
            </div>
          </button>
          <button onClick={handlePhotoClick} className="mt-3 text-sm font-semibold text-primary outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 rounded-full">Добавить фото</button>

          {/* Zodiac — shows in right col on landscape */}
          <div className="hidden landscape:flex mt-6 w-full bg-surface-container-lowest border border-outline-variant/30 rounded-[24px] p-4 items-center justify-between shadow-sm">
            <span className="text-[15px] font-medium text-on-surface-variant">Твой знак</span>
            <span className="text-lg font-bold text-on-surface">{zodiacSign || '—'}</span>
          </div>

          <button
            onClick={handleSubmit}
            disabled={!isValid || isSubmitting}
            className={`hidden landscape:flex w-full h-12 rounded-full font-headline font-bold text-lg items-center justify-center transition-colors mt-5 outline-none ring-0 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 active:outline-none active:ring-0 ${
              isValid && !isSubmitting
                ? 'bg-gradient-to-r from-[#006a65] to-[#2fa7a0] text-white shadow-lg shadow-[#2fa7a0]/30 active:scale-[0.98] cursor-pointer'
                : 'bg-[#e5e2dd] text-[#9ca3af] cursor-not-allowed'
            }`}
          >
            {isSubmitting ? 'Сохраняем...' : 'Продолжить'}
          </button>

          {submitError && <p className="hidden landscape:block mt-3 text-center text-sm font-medium text-red-500">{submitError}</p>}
        </div>

        {/* Portrait: full width. Landscape: left column with date + gender */}
        <div className="order-2 flex flex-col gap-5 landscape:order-none landscape:col-start-1 landscape:row-start-1 landscape:min-h-[320px] landscape:justify-center landscape:rounded-[28px] landscape:border landscape:border-outline-variant/30 landscape:bg-white/60 landscape:p-5 landscape:shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
          {/* Date Field */}
          <div className="space-y-2">
            <label className="block text-[15px] font-semibold text-on-surface-variant ml-1">Когда вы родились?</label>
            <div className="relative cursor-pointer" onClick={() => setIsCalendarOpen(true)}>
              <input
                className="w-full h-[60px] px-5 rounded-2xl border-none bg-white shadow-[0_4px_20px_rgba(0,0,0,0.05)] text-lg font-medium focus:ring-2 focus:ring-primary/20 text-on-surface placeholder:text-outline-variant transition-colors outline-none cursor-pointer"
                placeholder="ДД.ММ.ГГГГ"
                value={birthDate}
                readOnly
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-primary pointer-events-none">
                <span className="material-symbols-outlined text-[22px]">calendar_month</span>
              </div>
            </div>
            <p className="text-[13px] text-on-surface-variant/80 ml-1">Нужна только для знака зодиака.</p>
          </div>

          {/* Zodiac — shows inline on portrait */}
          <div className="landscape:hidden bg-white/50 border border-outline-variant/30 rounded-3xl p-4 flex items-center justify-between shadow-[0_4px_20px_rgba(0,0,0,0.05)]">
            <span className="text-[15px] font-medium text-on-surface-variant">Твой знак</span>
            <span className="text-lg font-bold text-on-surface">{zodiacSign || '—'}</span>
          </div>

          {/* Gender */}
          <div className="space-y-3">
            <p className="text-[15px] font-semibold text-on-surface-variant ml-1">Пол (необязательно)</p>
            <div className="relative flex p-1 bg-surface-container rounded-full h-[56px] shadow-sm gap-1">
              {[
                { id: 'F', label: 'Ж' },
                { id: 'M', label: 'М' },
                { id: 'UNKNOWN', label: 'Не указывать', extraClass: 'text-[13px]' },
              ].map((g) => {
                const isSelected = gender === g.id
                return (
                  <button
                    key={g.id}
                    onClick={() => setGender(g.id as 'F' | 'M' | 'UNKNOWN')}
                    className={`relative flex-1 rounded-full font-semibold transition-colors duration-200 z-10 select-none touch-manipulation active:scale-95 ${
                      g.extraClass || 'text-[15px]'
                    } ${isSelected ? 'bg-white text-on-surface shadow-sm' : 'text-on-surface-variant hover:text-on-surface/80'}`}
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                  >
                    {g.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={handleSubmit}
            disabled={!isValid || isSubmitting}
            style={{ paddingBottom: 'max(0px, env(safe-area-inset-bottom))' }}
            className={`w-full h-14 rounded-full font-headline font-bold text-lg flex items-center justify-center transition-colors mt-4 landscape:hidden outline-none ring-0 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 active:outline-none active:ring-0 ${
              isValid && !isSubmitting
                ? 'bg-gradient-to-r from-[#006a65] to-[#2fa7a0] text-white shadow-lg shadow-[#2fa7a0]/30 active:scale-[0.98] cursor-pointer'
                : 'bg-[#e5e2dd] text-[#9ca3af] cursor-not-allowed'
            }`}
          >
            {isSubmitting ? 'Сохраняем...' : 'Продолжить'}
          </button>
          {submitError && <p className="text-center text-sm font-medium text-red-500 landscape:hidden">{submitError}</p>}
        </div>
      </main>

      <CalendarSheet
        isOpen={isCalendarOpen}
        onClose={() => setIsCalendarOpen(false)}
        onSelect={(dateStr) => {
          setIsCalendarOpen(false)
          startTransition(() => setBirthDate(dateStr))
        }}
        currentValue={birthDate}
      />
    </motion.div>
  )
}
