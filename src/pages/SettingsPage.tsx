import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store'

export function SettingsPage() {
  const navigate = useNavigate()
  const {
    userName,
    email,
    birthDate,
    horoscopeTime,
    showHoroscope,
    showHolidays,
    showSupport,
    toggleHoroscope,
    toggleHolidays,
    toggleSupport
  } = useAppStore()

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  }

  return (
    <motion.div 
      initial="hidden"
      animate="show"
      variants={containerVariants}
      className="flex flex-col min-h-full bg-background font-body"
    >
      {/* TopAppBar */}
      <header className="sticky top-0 w-full z-50 bg-[#fcf9f4]/90 backdrop-blur-xl px-5 pt-[env(safe-area-inset-top,0px)] border-b border-primary/5">
        <div className="flex items-center gap-4 h-16">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 -ml-1 flex items-center justify-center text-on-surface-variant hover:bg-black/5 rounded-full transition-colors active:scale-95"
          >
            <span className="material-symbols-outlined text-[24px]">arrow_back</span>
          </button>
          <h1 className="font-headline font-bold text-lg tracking-tight text-[#006a65] truncate">Настройки</h1>
        </div>
      </header>

      <main className="px-6 pb-[112px] overflow-y-auto hide-scrollbar">
        {/* Profile Block */}
        <motion.section variants={itemVariants} className="flex items-center gap-6 mb-10 mt-4">
          <div className="relative">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-surface-container-high ring-4 ring-surface-container-low flex items-center justify-center text-on-surface-variant">
              <span className="material-symbols-outlined text-4xl">person</span>
            </div>
            <div className="absolute bottom-0 right-0 p-1.5 rounded-full shadow-lg border-2 border-surface" style={{ backgroundColor: '#2FA7A0' }}>
              <span className="material-symbols-outlined text-white text-sm">photo_camera</span>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <span className="font-headline text-xl font-bold text-on-surface">
              {userName || 'Профиль'}
            </span>
            <button className="text-sm font-medium hover:underline text-left" style={{ color: '#2FA7A0' }}>Сменить фото</button>
          </div>
        </motion.section>

        {/* Account Section */}
        <motion.section variants={itemVariants} className="bg-white rounded-[1.5rem] p-6 mb-6 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-on-surface-variant px-1">Электронная почта</label>
              <div className="bg-surface-container-low rounded-xl px-5 py-3.5 text-on-surface-variant border border-transparent">
                {email}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-on-surface-variant px-1">Дата рождения</label>
              <div className="flex items-center justify-between bg-surface-container-low rounded-xl px-5 py-3.5 text-on-surface border border-transparent">
                {birthDate}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-on-surface-variant px-1">Время гороскопа</label>
              <div className="flex items-center justify-between bg-surface-container-low rounded-xl px-5 py-3.5 text-on-surface border border-transparent">
                {horoscopeTime}
              </div>
            </div>
          </div>
        </motion.section>

        {/* Card 1: Уведомления (Контент) */}
        <motion.section variants={itemVariants} className="bg-white rounded-[1.5rem] p-6 mb-6 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
          <h2 className="text-sm font-bold text-on-surface mb-5 px-1 uppercase tracking-wider opacity-60">Контент</h2>
          <div className="flex flex-col gap-6">
            <ToggleItem 
              label="Гороскоп" 
              isActive={showHoroscope} 
              onToggle={toggleHoroscope} 
            />
            <ToggleItem 
              label="Праздники" 
              isActive={showHolidays} 
              onToggle={toggleHolidays} 
            />
            <ToggleItem 
              label="Поддержка на сегодня" 
              isActive={showSupport} 
              onToggle={toggleSupport} 
            />
          </div>
        </motion.section>

        <div className="h-6"></div>
      </main>
    </motion.div>
  )
}

function ToggleItem({ label, isActive, onToggle }: { label: string, isActive: boolean, onToggle: () => void }) {
  return (
    <div className="flex items-center justify-between">
      <span className="font-medium text-on-surface">{label}</span>
      <button
        onClick={onToggle}
        style={{ backgroundColor: isActive ? '#2FA7A0' : '#e5e2dd' }}
        className="w-12 h-6 rounded-full relative transition-colors duration-300"
      >
        <motion.span
          animate={{ x: isActive ? 24 : 4 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className="absolute left-0 top-1 w-4 h-4 bg-white rounded-full shadow-sm"
        />
      </button>
    </div>
  )
}
