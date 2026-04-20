import { useState, useMemo, useRef, startTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store'

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
  const profilePhoto = useAppStore((s) => s.profilePhoto)
  const setProfilePhoto = useAppStore((s) => s.setProfilePhoto)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [birthDate, setBirthDate] = useState('')
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const [gender, setGender] = useState<'F' | 'M' | 'UNKNOWN'>('UNKNOWN')

  const handlePhotoClick = () => fileInputRef.current?.click()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setProfilePhoto(reader.result as string)
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const zodiacSign = useMemo(() => getZodiac(birthDate), [birthDate])
  const hasSelectedBirthDate = useMemo(() => isValidBirthDate(birthDate), [birthDate])
  const isValid = hasSelectedBirthDate && !!zodiacSign

  const handleSubmit = () => {
    if (!isValid) return
    storeBirthDate(birthDate)
    storeGender(gender)
    storeZodiac(zodiacSign ?? '')
    setHasCompletedOnboarding(true)
    navigate('/home')
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.18, ease: [0.32, 0.72, 0, 1] }}
      style={{ willChange: 'opacity' }}
      className="relative bg-background text-on-surface font-body selection:bg-primary/20 selection:text-primary h-[100dvh] w-full max-w-[430px] mx-auto overflow-x-hidden overflow-y-auto overscroll-none scroll-smooth"
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

      <main className="flex-1 flex flex-col pt-24 px-5">

        {/* Avatar Section */}
        <div className="flex flex-col items-center mb-10">
          <button
            onClick={handlePhotoClick}
            className="relative w-28 h-28 active:scale-95 transition-transform"
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
          <button onClick={handlePhotoClick} className="mt-3 text-sm font-semibold text-primary">Добавить фото</button>
        </div>

        {/* Input Section */}
        <div className="space-y-6">
          {/* Date Field */}
          <div className="space-y-2">
            <label className="block text-[15px] font-semibold text-on-surface-variant ml-1">Когда вы родились?</label>
            <div 
              className="relative cursor-pointer"
              onClick={() => setIsCalendarOpen(true)}
            >
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

          {/* Zodiac Result */}
          <div className="bg-white/50 border border-outline-variant/30 rounded-3xl p-4 flex items-center justify-between shadow-[0_4px_20px_rgba(0,0,0,0.05)] min-h-[60px]">
            <span className="text-[15px] font-medium text-on-surface-variant">Твой знак</span>
            <span className="text-lg font-bold text-on-surface flex items-center gap-2">
              {zodiacSign || ''}
            </span>
          </div>

          {/* Gender Section */}
          <div className="space-y-3 pt-2">
            <p className="text-[15px] font-semibold text-on-surface-variant ml-1">Пол (необязательно)</p>
            <div className="relative flex p-1 bg-surface-container rounded-full h-[56px] shadow-sm gap-1">
              {[
                { id: 'F', label: 'Ж' },
                { id: 'M', label: 'М' },
                { id: 'UNKNOWN', label: 'Не указывать', extraClass: 'text-[13px]' }
              ].map((g) => {
                const isSelected = gender === g.id;
                return (
                  <button
                    key={g.id}
                    onClick={() => setGender(g.id as "F" | "M" | "UNKNOWN")}
                    className={`relative flex-1 rounded-full font-semibold transition-colors duration-200 z-10 select-none touch-manipulation active:scale-95 ${
                      g.extraClass || 'text-[15px]'
                    } ${isSelected ? 'bg-white text-on-surface shadow-sm' : 'text-on-surface-variant hover:text-on-surface/80'}`}
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                  >
                    {g.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </main>

      {/* Footer CTA */}
      <footer
        className="px-5 pt-5 mt-auto"
        style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}
      >
        <button
          onClick={handleSubmit}
          disabled={!isValid}
          className={`w-full h-16 rounded-full font-headline font-bold text-lg flex items-center justify-center transition-colors ${
            isValid
              ? 'bg-gradient-to-r from-[#006a65] to-[#2fa7a0] text-white shadow-lg shadow-[#2fa7a0]/30 active:scale-[0.98] cursor-pointer'
              : 'bg-[#e5e2dd] text-[#9ca3af] cursor-not-allowed'
          }`}
        >
          Продолжить
        </button>
      </footer>

      {/* Glassmorphism Background Elements */}


      <AnimatePresence>
        {isCalendarOpen && (
          <CalendarSheet
            isOpen={isCalendarOpen}
            onClose={() => setIsCalendarOpen(false)}
            onSelect={(dateStr) => {
              setIsCalendarOpen(false)
              startTransition(() => setBirthDate(dateStr))
            }}
            currentValue={birthDate}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}

