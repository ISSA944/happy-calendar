import { useState, startTransition } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useFirebasePush } from '../hooks'
import { useAppStore } from '../store'
import { TimePickerSheet } from '../features/auth/TimePickerSheet'

function TimeCard({ time, selected, onClick }: { time: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center h-12 landscape:h-10 rounded-2xl transition-colors duration-200 active:scale-95 text-sm font-bold ${
        selected
          ? 'bg-gradient-to-r from-[#006a65] to-[#2fa7a0] text-white shadow-md shadow-[#2fa7a0]/25'
          : 'bg-[#f0ede9] text-[#6D7A78] font-medium hover:bg-[#e5e2dd]'
      }`}
    >
      {time}
    </button>
  )
}

function ToggleRow({
  label,
  checked,
  onChange,
  disabled = false,
}: {
  label: string
  checked: boolean
  onChange: () => void
  disabled?: boolean
}) {
  return (
    <div className={`flex items-center justify-between ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
      <h3 className="font-semibold text-[15px] landscape:text-[14px] text-[#1B1B1F]">{label}</h3>
      <div
        onClick={() => !disabled && onChange()}
        className={`relative inline-flex items-center w-12 h-6 shrink-0 ${disabled ? '' : 'cursor-pointer'}`}
      >
        <div className={`w-12 h-6 rounded-full transition-colors duration-200 ${checked ? 'bg-[#2FA7A0]' : 'bg-[#E1E2E4]'}`} />
        <motion.div
          initial={false}
          animate={{ x: checked ? 24 : 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          style={{ willChange: 'transform' }}
          className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full shadow-sm"
        />
      </div>
    </div>
  )
}

export function NotificationsPage() {
  const navigate = useNavigate()
  const { permission, requestPermissionAndSubscribe } = useFirebasePush()
  const setHoroscopeTime = useAppStore(s => s.setHoroscopeTime)
  const showHoroscope   = useAppStore(s => s.showHoroscope)
  const showHolidays    = useAppStore(s => s.showHolidays)
  const showSupport     = useAppStore(s => s.showSupport)
  const toggleHoroscope = useAppStore(s => s.toggleHoroscope)
  const toggleHolidays  = useAppStore(s => s.toggleHolidays)
  const toggleSupport   = useAppStore(s => s.toggleSupport)

  const [selectedTime,     setSelectedTime]     = useState('09:00')
  const [customTime,       setCustomTime]       = useState('')
  const [isCustomSelected, setIsCustomSelected] = useState(false)
  const [isTimePickerOpen, setIsTimePickerOpen] = useState(false)
  const [pushError,        setPushError]        = useState('')
  const [isRequestingPush, setIsRequestingPush] = useState(false)

  const fixedTimes = ['08:00', '09:00', '10:00']

  const handleFixedTimeSelect = (t: string) => {
    setSelectedTime(t)
    setIsCustomSelected(false)
    setHoroscopeTime(t)
  }

  const handleTimePickerSave = (time: string) => {
    setIsTimePickerOpen(false)
    startTransition(() => {
      setCustomTime(time)
      setSelectedTime(time)
      setIsCustomSelected(true)
      setHoroscopeTime(time)
    })
  }

  const handleAllow = async () => {
    if (isRequestingPush) return
    setIsRequestingPush(true)
    setPushError('')
    try {
      const result = await requestPermissionAndSubscribe()
      if (result.subscribed) { navigate('/profile-setup'); return }
      if (result.reason === 'permission-denied') {
        setPushError('Уведомления заблокированы. Открой: Настройки → YoYoJoy Day → Уведомления → Включить.')
        return
      }
      navigate('/profile-setup')
    } catch {
      setPushError('Не удалось подключить push. Попробуй ещё раз или пропусти.')
    } finally {
      setIsRequestingPush(false)
    }
  }

  const handleSkip = () => navigate('/profile-setup')

  // ── Reusable CTA block (used in both portrait bottom + landscape right col) ──
  const ctaBlock = (
    <div className="flex flex-col items-stretch gap-3">
      {permission === 'denied' && !pushError ? (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center space-y-3">
          <p className="text-sm font-semibold text-amber-800">Уведомления заблокированы</p>
          <p className="text-xs text-amber-700 leading-relaxed">
            Настройки iPhone → <strong>YoYoJoy Day</strong> → Уведомления → Включить
          </p>
          <button
            onClick={handleAllow}
            className="w-full h-11 bg-amber-500 text-white font-bold text-sm rounded-xl active:scale-[0.98] transition-transform"
          >
            Я включил — попробовать снова
          </button>
        </div>
      ) : (
        <button
          onClick={handleAllow}
          disabled={isRequestingPush}
          className="w-full h-14 landscape:h-12 bg-gradient-to-r from-[#006a65] to-[#2fa7a0] text-white font-headline font-bold text-base rounded-full shadow-lg shadow-[#2fa7a0]/20 transition-colors active:scale-[0.98]"
        >
          {isRequestingPush ? 'Подключаем...' : 'Разрешить уведомления'}
        </button>
      )}

      <button
        onClick={handleSkip}
        className="text-[#5A5A66] font-body font-medium text-sm hover:text-[#1B1B1F] transition-colors text-center py-1"
      >
        Настрою позже
      </button>

      {pushError && (
        <p className="text-center text-xs font-medium text-red-500 leading-snug">{pushError}</p>
      )}
      {permission === 'denied' && !pushError && (
        <p className="text-center text-xs font-medium text-[#5A5A66] leading-snug">
          В браузере стоит запрет. Включить можно в настройках устройства.
        </p>
      )}
    </div>
  )

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.18, ease: [0.32, 0.72, 0, 1] }}
      style={{ willChange: 'opacity' }}
      className="relative bg-background text-on-surface font-body h-[100dvh] w-full max-w-[430px] landscape:max-w-[860px] mx-auto overflow-x-hidden overflow-y-auto overscroll-none scroll-smooth"
    >
      <TimePickerSheet
        isOpen={isTimePickerOpen}
        initialTime={customTime || '07:30'}
        onSave={handleTimePickerSave}
        onCancel={() => setIsTimePickerOpen(false)}
      />

      {/* TopAppBar */}
      <header className="sticky top-0 w-full z-50 bg-background px-5 pt-[env(safe-area-inset-top,0px)] border-b border-primary/5">
        <div className="flex items-center h-14 landscape:h-11 relative">
          <button
            onClick={() => navigate(-1)}
            aria-label="Назад"
            className="w-10 h-10 -ml-1 text-primary hover:bg-black/5 rounded-full transition-colors active:scale-95 flex items-center justify-center shrink-0"
          >
            <span className="material-symbols-outlined text-[22px]">arrow_back</span>
          </button>
          <h1 className="absolute left-1/2 -translate-x-1/2 font-headline font-bold text-lg landscape:text-base text-primary tracking-tight">
            Уведомления
          </h1>
        </div>
      </header>

      {/* ── LANDSCAPE: 3-col grid (time | toggles | CTA) ──────────────────── */}
      {/* ── PORTRAIT:  flex-col (cards → bottom CTA) ─────────────────────── */}
      <div className={`
        px-5 pb-[env(safe-area-inset-bottom,16px)]
        flex flex-col gap-4 pt-6
        landscape:grid landscape:grid-cols-[1fr_1fr_1fr] landscape:gap-4 landscape:pt-4 landscape:items-start
      `}>

        {/* Card 1: Time Selection */}
        <section className="bg-white rounded-[24px] p-5 landscape:p-4 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.06)]">
          <h2 className="font-headline font-bold text-[15px] landscape:text-[14px] mb-4 text-[#1B1B1F]">
            Во сколько присылать?
          </h2>
          <div className="grid grid-cols-2 gap-2 mb-3">
            {fixedTimes.map(t => (
              <TimeCard
                key={t}
                time={t}
                selected={!isCustomSelected && selectedTime === t}
                onClick={() => handleFixedTimeSelect(t)}
              />
            ))}
            <button
              onClick={() => setIsTimePickerOpen(true)}
              className={`flex items-center justify-center w-full h-12 landscape:h-10 rounded-2xl transition-colors duration-200 active:scale-95 text-sm font-bold ${
                isCustomSelected
                  ? 'bg-gradient-to-r from-[#006a65] to-[#2fa7a0] text-white shadow-md shadow-[#2fa7a0]/25'
                  : 'bg-[#f0ede9] text-[#6D7A78] font-medium hover:bg-[#e5e2dd]'
              }`}
            >
              {isCustomSelected && customTime ? customTime : 'Своё время'}
            </button>
          </div>
          <p className="text-xs text-[#5A5A66] font-body">Можно изменить позже</p>
        </section>

        {/* Card 2: Toggles */}
        <section className="bg-white rounded-[24px] p-5 landscape:p-4 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.06)] space-y-5 landscape:space-y-4">
          <h2 className="font-headline font-bold text-[15px] landscape:text-[14px] text-[#1B1B1F]">Что присылать</h2>
          <ToggleRow label="Гороскоп"                checked={showHoroscope} onChange={toggleHoroscope} />
          <ToggleRow label="Праздники"               checked={showHolidays}  onChange={toggleHolidays} />
          <ToggleRow label="Поддержка по настроению" checked={showSupport}   onChange={toggleSupport} />
        </section>

        {/* Landscape-only: CTA in 3rd column, vertically centered */}
        <div className="hidden landscape:flex landscape:flex-col landscape:justify-center landscape:h-full">
          {ctaBlock}
        </div>
      </div>

      {/* Portrait-only: CTA at bottom */}
      {!isTimePickerOpen && (
        <div className="landscape:hidden px-5 pt-2 pb-[env(safe-area-inset-bottom,24px)]">
          {ctaBlock}
        </div>
      )}
    </motion.div>
  )
}
