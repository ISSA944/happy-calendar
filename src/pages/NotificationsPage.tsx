import { useState, startTransition } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useWebPush } from '../hooks'
import { useAppStore } from '../store'
import { TimePickerSheet } from '../features/auth/TimePickerSheet'

function TimeCard({ time, selected, onClick }: { time: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center h-12 rounded-2xl transition-all active:scale-95 text-sm font-bold ${
        selected
          ? 'bg-primary/10 border border-primary text-primary shadow-sm'
          : 'bg-surface-container-low text-on-surface-variant font-medium hover:bg-surface-container-high'
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
      <h3 className="font-semibold text-[15px] text-[#1B1B1F]">{label}</h3>
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
  const { subscribe } = useWebPush()
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
  const [showIosInstruction, setShowIosInstruction] = useState(false)

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
  const isStandalone = (window.navigator as any).standalone || window.matchMedia('(display-mode: standalone)').matches

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
    
    // Logic for iOS browser users
    if (isIOS && !isStandalone) {
      setShowIosInstruction(true)
      return
    }

    setIsRequestingPush(true)
    setPushError('')
    try {
      const success = await subscribe()
      if (success) {
        navigate('/profile-setup')
        return
      }
      
      if (Notification.permission === 'denied') {
        setPushError('Уведомления заблокированы. Включите их в настройках браузера.')
      } else {
        setPushError('Не удалось подключить push. Попробуйте ещё раз.')
      }
    } catch {
      setPushError('Не удалось подключить push. Попробуйте ещё раз.')
    } finally {
      setIsRequestingPush(false)
    }
  }

  const handleSkip = () => navigate('/profile-setup')

  // ── Action Buttons Block ──
  const actionButtons = (
    <div className="flex flex-col items-stretch gap-3 w-full">
      <button
        onClick={handleAllow}
        disabled={isRequestingPush}
        className="w-full h-14 bg-gradient-to-r from-primary to-primary-container text-on-primary font-headline font-bold text-base rounded-full shadow-lg shadow-primary/20 active:scale-[0.98] transition-all"
      >
        {isRequestingPush ? 'Подключаем...' : 'Разрешить уведомления'}
      </button>

      <button
        onClick={handleSkip}
        className="text-on-surface-variant font-body font-medium text-sm hover:text-on-surface transition-colors text-center py-1"
      >
        Настрою позже
      </button>

      {pushError && (
        <p className="text-center text-xs font-medium text-error leading-snug">{pushError}</p>
      )}
    </div>
  )

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.18, ease: [0.32, 0.72, 0, 1] }}
      className="relative bg-background text-on-surface font-body h-[100dvh] w-full max-w-[430px] landscape:max-w-[860px] mx-auto overflow-hidden flex flex-col"
    >
      <TimePickerSheet
        isOpen={isTimePickerOpen}
        initialTime={customTime || '07:30'}
        onSave={handleTimePickerSave}
        onCancel={() => setIsTimePickerOpen(false)}
      />

      {/* Header */}
      <header className="sticky top-0 w-full z-50 bg-background/80 backdrop-blur-[24px] px-5 pt-[env(safe-area-inset-top,0px)]">
        <div className="flex items-center h-14 relative">
          <button
            onClick={() => showIosInstruction ? setShowIosInstruction(false) : navigate(-1)}
            className="w-10 h-10 -ml-1 text-primary hover:bg-black/5 rounded-full transition-colors active:scale-95 flex items-center justify-center"
          >
            <span className="material-symbols-outlined text-[24px]">arrow_back</span>
          </button>
          <h1 className="absolute left-1/2 -translate-x-1/2 font-headline font-bold text-lg text-on-surface tracking-tight">
            {showIosInstruction ? 'Инструкция' : 'Уведомления'}
          </h1>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-5 pb-10 landscape:pb-20 pt-4">
        <AnimatePresence mode="wait">
          {showIosInstruction ? (
            <motion.div
              key="instruction"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col gap-8 text-center max-w-xl mx-auto"
            >
              <div className="space-y-4">
                <h2 className="font-headline font-bold text-2xl leading-tight text-on-surface">
                  Добавьте приложение на главный экран
                </h2>
                <p className="font-body text-base text-on-surface-variant leading-relaxed px-4">
                  Пуш-уведомления доступны только в PWA-версии. Это позволит вам получать гороскоп и поддержку вовремя.
                </p>
              </div>

              <div className="flex flex-col gap-4 text-left">
                {/* Steps with grid for landscape */}
                <div className="grid grid-cols-1 landscape:grid-cols-3 gap-4">
                  {/* Step 1 */}
                  <div className="flex items-center gap-4 bg-surface-container-lowest p-4 rounded-[20px] shadow-soft">
                    <div className="w-12 h-12 shrink-0 rounded-xl bg-surface-container-high flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined">ios_share</span>
                    </div>
                    <div>
                      <span className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant/60 mb-0.5">Шаг 1</span>
                      <p className="font-body text-[14px] font-semibold text-on-surface">Нажмите «Поделиться»</p>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="flex items-center gap-4 bg-surface-container-lowest p-4 rounded-[20px] shadow-soft">
                    <div className="w-12 h-12 shrink-0 rounded-xl bg-surface-container-high flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined">add_to_home_screen</span>
                    </div>
                    <div>
                      <span className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant/60 mb-0.5">Шаг 2</span>
                      <p className="font-body text-[14px] font-semibold text-on-surface">«На экран Домой»</p>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="flex items-center gap-4 bg-surface-container-lowest p-4 rounded-[20px] shadow-soft">
                    <div className="w-12 h-12 shrink-0 rounded-xl bg-surface-container-high flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined">done</span>
                    </div>
                    <div>
                      <span className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant/60 mb-0.5">Шаг 3</span>
                      <p className="font-body text-[14px] font-semibold text-on-surface">Нажмите «Добавить»</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Landscape-only action button inside scroll */}
              <div className="hidden landscape:block mt-4">
                <button
                  onClick={() => navigate('/profile-setup')}
                  className="w-full h-14 bg-gradient-to-r from-primary to-primary-container text-on-primary rounded-2xl font-headline font-bold text-lg shadow-lg shadow-primary/20 active:scale-[0.98] transition-transform"
                >
                  Понятно, спасибо
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="settings"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex flex-col gap-5 landscape:grid landscape:grid-cols-2 landscape:items-start"
            >
              {/* Card 1: Time Selection */}
              <section className="bg-white rounded-[24px] p-6 shadow-soft">
                <h2 className="font-headline font-bold text-[17px] mb-5 text-on-surface">
                  Во сколько присылать?
                </h2>
                <div className="grid grid-cols-2 gap-3 mb-4">
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
                    className={`flex items-center justify-center h-12 rounded-2xl transition-all active:scale-95 text-sm font-bold ${
                      isCustomSelected
                        ? 'bg-primary/10 border border-primary text-primary'
                        : 'bg-surface-container-low text-on-surface-variant font-medium hover:bg-surface-container-high'
                    }`}
                  >
                    {isCustomSelected && customTime ? customTime : 'Своё время'}
                  </button>
                </div>
                <p className="text-xs text-on-surface-variant font-body">Можно изменить в любой момент</p>
              </section>

              {/* Card 2: Content Selection */}
              <section className="bg-white rounded-[24px] p-6 shadow-soft space-y-7">
                <h2 className="font-headline font-bold text-[17px] text-on-surface">Что присылать</h2>
                <ToggleRow label="Гороскоп"                checked={showHoroscope} onChange={toggleHoroscope} />
                <ToggleRow label="Праздники"               checked={showHolidays}  onChange={toggleHolidays} />
                <ToggleRow label="Поддержка по настроению" checked={showSupport}   onChange={toggleSupport} />
              </section>

              {/* Landscape-only action area */}
              <div className="hidden landscape:grid landscape:grid-cols-2 landscape:gap-4 landscape:col-span-2 mt-4">
                {actionButtons}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Action Panel - PORTRAIT ONLY */}
      <div className="landscape:hidden fixed bottom-0 left-0 right-0 p-5 pb-10 bg-background/95 backdrop-blur-xl z-[60] flex flex-col items-center">
        <div className="w-full max-w-[390px]">
          {showIosInstruction ? (
            <button
              onClick={() => navigate('/profile-setup')}
              className="w-full h-14 bg-gradient-to-r from-primary to-primary-container text-on-primary rounded-2xl font-headline font-bold text-lg shadow-lg shadow-primary/20 active:scale-[0.98] transition-transform"
            >
              Понятно, спасибо
            </button>
          ) : (
            actionButtons
          )}
        </div>
      </div>
    </motion.div>
  )
}
