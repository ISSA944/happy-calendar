import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store'
import { TimePickerSheet } from '../features/auth/TimePickerSheet'

// Time Card component based on exact HTML
function TimeCard({ time, selected, onClick }: { time: string, selected: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center h-14 rounded-2xl transition-all duration-200 active:scale-95 text-sm font-bold ${
        selected
          ? 'bg-gradient-to-r from-[#006a65] to-[#2fa7a0] text-white shadow-md shadow-[#2fa7a0]/25'
          : 'bg-[#f0ede9] text-[#6D7A78] font-medium hover:bg-[#e5e2dd]'
      }`}
    >
      {time}
    </button>
  )
}

// Toggle row component based on exact HTML
function ToggleRow({
  label,
  checked,
  onChange,
  disabled = false
}: {
  label: string;
  checked: boolean;
  onChange: (val: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
      <h3 className="font-semibold text-[15px] text-[#1B1B1F]">{label}</h3>
      <div
        onClick={() => !disabled && onChange(!checked)}
        className={`relative inline-flex items-center w-12 h-6 ${disabled ? '' : 'cursor-pointer'}`}
      >
        <div className={`w-12 h-6 rounded-full transition-colors duration-200 ${checked ? 'bg-[#2FA7A0]' : 'bg-[#E1E2E4]'}`}></div>
        <motion.div
          initial={false}
          animate={{ x: checked ? 24 : 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full shadow-sm"
        ></motion.div>
      </div>
    </div>
  )
}

export function NotificationsPage() {
  const navigate = useNavigate()
  const setHoroscopeTime = useAppStore(state => state.setHoroscopeTime)

  const [selectedTime, setSelectedTime] = useState<string>('09:00')
  const [customTime, setCustomTime] = useState('')
  const [isCustomSelected, setIsCustomSelected] = useState(false)
  const [isTimePickerOpen, setIsTimePickerOpen] = useState(false)
  const [horoscopeToggle, setHoroscopeToggle] = useState(true)
  const [holidayToggle, setHolidayToggle] = useState(true)
  const [moodToggle, setMoodToggle] = useState(false)

  const fixedTimes = ['08:00', '09:00', '10:00']

  const handleFixedTimeSelect = (t: string) => {
    setSelectedTime(t)
    setIsCustomSelected(false)
    setHoroscopeTime(t)
  }

  const handleTimePickerSave = (time: string) => {
    setCustomTime(time)
    setSelectedTime(time)
    setIsCustomSelected(true)
    setHoroscopeTime(time)
    setIsTimePickerOpen(false)
  }

  const handleAllow = () => {
    navigate('/profile-setup')
  }

  const handleSkip = () => {
    navigate('/profile-setup')
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="relative bg-background text-on-surface font-body selection:bg-primary/20 selection:text-primary h-[100dvh] w-full max-w-[390px] mx-auto overflow-x-hidden overflow-y-auto overscroll-none scroll-smooth"
    >
      <AnimatePresence>
        {isTimePickerOpen && (
          <TimePickerSheet
            isOpen={isTimePickerOpen}
            initialTime={customTime || '07:30'}
            onSave={handleTimePickerSave}
            onCancel={() => setIsTimePickerOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* TopAppBar */}
      <header className="sticky top-0 w-full z-50 bg-background/90 backdrop-blur-xl px-5 pt-[env(safe-area-inset-top,0px)] border-b border-primary/5">
        <div className="flex items-center gap-4 h-16">
          <button
            onClick={() => navigate(-1)}
            aria-label="Назад"
            className="w-10 h-10 -ml-1 text-primary hover:bg-black/5 rounded-full transition-colors active:scale-95 flex items-center justify-center shrink-0"
          >
            <span className="material-symbols-outlined text-[24px]">arrow_back</span>
          </button>
          <h1 className="font-headline font-bold text-lg text-primary tracking-tight truncate">Уведомления</h1>
        </div>
      </header>

      <main className="flex-1 flex flex-col pt-10 pb-8 w-full px-5 space-y-6">
        {/* Card 1: Time Selection */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white rounded-[24px] p-6 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.04)]"
        >
          <h2 className="font-headline font-bold text-lg mb-5 text-[#1B1B1F]">Во сколько присылать гороскоп?</h2>
          <div className="grid grid-cols-2 gap-3 mb-4">
            {fixedTimes.map((t) => (
              <TimeCard
                key={t}
                time={t}
                selected={!isCustomSelected && selectedTime === t}
                onClick={() => handleFixedTimeSelect(t)}
              />
            ))}

            <button
              onClick={() => setIsTimePickerOpen(true)}
              className={`flex items-center justify-center w-full h-14 rounded-2xl transition-all duration-200 active:scale-95 text-sm font-bold ${
                isCustomSelected
                  ? 'bg-gradient-to-r from-[#006a65] to-[#2fa7a0] text-white shadow-md shadow-[#2fa7a0]/25'
                  : 'bg-[#f0ede9] text-[#6D7A78] font-medium hover:bg-[#e5e2dd]'
              }`}
            >
              {isCustomSelected && customTime ? customTime : 'Своё время'}
            </button>
          </div>
          <p className="text-sm text-[#5A5A66] font-body">Можно изменить в любой момент</p>
        </motion.section>

        {/* Card 2: Notification Content */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white rounded-[24px] p-6 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.04)] space-y-8"
        >
          <h2 className="font-headline font-bold text-lg text-[#1B1B1F]">Что присылать</h2>

          <ToggleRow
            label="Гороскоп"
            checked={horoscopeToggle}
            onChange={setHoroscopeToggle}
          />

          <ToggleRow
            label="Праздники"
            checked={holidayToggle}
            onChange={setHolidayToggle}
          />

          <ToggleRow
            label="Поддержка по настроению"
            checked={moodToggle}
            onChange={setMoodToggle}
          />
        </motion.section>
      </main>

      {/* Bottom Action Area — in flow at the end of content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="w-full max-w-[390px] mx-auto px-5 pb-[env(safe-area-inset-bottom,24px)] pt-4 flex flex-col items-center space-y-4"
      >
        <button
          onClick={handleAllow}
          className="w-full h-14 bg-[#2FA7A0] hover:bg-[#006a65] text-white font-headline font-bold text-base rounded-full shadow-lg shadow-[#2FA7A0]/20 transition-all active:scale-[0.98]"
        >
          Разрешить уведомления
        </button>
        <button
          onClick={handleSkip}
          className="text-[#5A5A66] font-body font-medium text-sm hover:text-[#1B1B1F] transition-colors"
        >
          Настрою позже
        </button>
      </motion.div>
    </motion.div>
  )
}
