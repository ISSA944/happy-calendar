import { useState, useMemo } from 'react'
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

import { CalendarSheet } from '../features/auth/CalendarSheet'

export function ProfileSetupPage() {
  const navigate = useNavigate()
  const storeBirthDate = useAppStore((s) => s.setBirthDate)
  const storeGender = useAppStore((s) => s.setGender)
  const storeZodiac = useAppStore((s) => s.setZodiacSign)
  const setHasCompletedOnboarding = useAppStore((s) => s.setHasCompletedOnboarding)

  const [birthDate, setBirthDate] = useState('15.08.1995')
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const [gender, setGender] = useState<'F' | 'M' | 'UNKNOWN'>('UNKNOWN')

  const zodiacSign = useMemo(() => getZodiac(birthDate), [birthDate])

  const handleSubmit = () => {
    storeBirthDate(birthDate)
    storeGender(gender)
    storeZodiac(zodiacSign ?? '')
    setHasCompletedOnboarding(true)
    navigate('/home')
  }

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="relative bg-background text-on-surface font-body selection:bg-primary/20 selection:text-primary h-[100dvh] w-full max-w-[390px] mx-auto overflow-x-hidden overflow-y-auto overscroll-none scroll-smooth"
    >
      {/* TopAppBar */}
      <header className="sticky top-0 w-full z-50 bg-background px-5 pt-[env(safe-area-inset-top,0px)] border-b border-primary/5">
        <div className="flex items-center gap-4 h-16">
          <button
            onClick={() => navigate(-1)}
            aria-label="Назад"
            className="w-10 h-10 -ml-1 text-primary hover:bg-black/5 rounded-full transition-colors active:scale-95 flex items-center justify-center shrink-0"
          >
            <span className="material-symbols-outlined text-[24px]">arrow_back</span>
          </button>
          <h1 className="font-headline font-bold text-lg text-primary tracking-tight truncate">Профиль</h1>
        </div>
      </header>

      <main className="flex-1 flex flex-col pt-24 px-5">
        
        {/* Avatar Section */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex flex-col items-center mb-10"
        >
          <div className="relative w-28 h-28">
            <div className="w-full h-full rounded-full bg-surface shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-outline-variant/20 flex items-center justify-center overflow-hidden text-outline-variant">
              <span className="material-symbols-outlined text-[48px]" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
            </div>
            <button className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center shadow-lg border-2 border-background active:scale-90 transition-transform">
              <span className="material-symbols-outlined text-[16px]">add_a_photo</span>
            </button>
          </div>
          <button className="mt-3 text-sm font-semibold text-primary">Добавить фото</button>
        </motion.div>

        {/* Input Section */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="space-y-6"
        >
          {/* Date Field */}
          <div className="space-y-2">
            <label className="block text-[15px] font-semibold text-on-surface-variant ml-1">Когда вы родились?</label>
            <div 
              className="relative cursor-pointer"
              onClick={() => setIsCalendarOpen(true)}
            >
              <input 
                className="w-full h-[60px] px-5 rounded-2xl border-none bg-white shadow-[0_4px_20px_rgba(0,0,0,0.05)] text-lg font-medium focus:ring-2 focus:ring-primary/20 text-on-surface placeholder:text-outline-variant transition-all outline-none cursor-pointer" 
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
            <div className="relative flex p-1 bg-surface-container rounded-full h-[56px] shadow-sm overflow-hidden box-border">
              {/* Background animate pill */}
              <motion.div 
                layout
                className="absolute top-1 bottom-1 bg-white rounded-full shadow-sm shadow-black/5"
                initial={false}
                animate={{
                  left: gender === 'F' ? '4px' : gender === 'M' ? 'calc(33.33% + 2px)' : 'calc(66.66% + 2px)',
                  width: 'calc(33.33% - 6px)'
                }}
                transition={{ type: "spring", stiffness: 450, damping: 35 }}
              />

              <button 
                onClick={() => setGender('F')}
                className={`relative flex-1 rounded-full text-[15px] font-semibold transition-colors z-10 ${gender === 'F' ? 'text-on-surface' : 'text-on-surface-variant'}`}
              >
                Ж
              </button>
              <button 
                onClick={() => setGender('M')}
                className={`relative flex-1 rounded-full text-[15px] font-semibold transition-colors z-10 ${gender === 'M' ? 'text-on-surface' : 'text-on-surface-variant'}`}
              >
                М
              </button>
              <button 
                onClick={() => setGender('UNKNOWN')}
                className={`relative flex-1 rounded-full text-[13px] font-semibold transition-colors z-10 px-2 ${gender === 'UNKNOWN' ? 'text-on-surface' : 'text-on-surface-variant'}`}
              >
                Не указывать
              </button>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Footer CTA */}
      <motion.footer 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="p-5 pb-10 mt-auto"
      >
        <button 
          onClick={handleSubmit}
          className="w-full h-16 bg-gradient-to-r from-[#006a65] to-[#2fa7a0] text-white rounded-full font-headline font-bold text-lg shadow-lg shadow-[#2fa7a0]/30 active:scale-[0.98] transition-all flex items-center justify-center cursor-pointer"
        >
          Продолжить
        </button>
      </motion.footer>

      {/* Glassmorphism Background Elements */}
      <div className="fixed top-[-5%] right-[-5%] w-[300px] h-[300px] bg-primary/5 rounded-full blur-[80px] -z-10 pointer-events-none"></div>
      <div className="fixed bottom-[-5%] left-[-5%] w-[250px] h-[250px] bg-primary/5 rounded-full blur-[60px] -z-10 pointer-events-none"></div>

      <AnimatePresence>
        <CalendarSheet 
          isOpen={isCalendarOpen} 
          onClose={() => setIsCalendarOpen(false)} 
          onSelect={(dateStr) => {
            setBirthDate(dateStr)
            setTimeout(() => setIsCalendarOpen(false), 200) // slight delay to show selection
          }} 
          currentValue={birthDate} 
        />
      </AnimatePresence>
    </motion.div>
  )
}
