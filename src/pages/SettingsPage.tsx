import { useRef, useState, startTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Variants } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store'
import { CalendarSheet } from '../features/auth/CalendarSheet'
import { TimePickerSheet } from '../features/auth/TimePickerSheet'

export function SettingsPage() {
  const navigate = useNavigate()
  const {
    userName,
    email, setEmail,
    birthDate, setBirthDate,
    horoscopeTime, setHoroscopeTime,
    profilePhoto, setProfilePhoto,
    showHoroscope, showHolidays, showSupport,
    toggleHoroscope, toggleHolidays, toggleSupport,
  } = useAppStore()

  const fileInputRef = useRef<HTMLInputElement>(null)

  const [editingEmail, setEditingEmail] = useState(false)
  const [emailDraft, setEmailDraft] = useState(email)
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const [isTimePickerOpen, setIsTimePickerOpen] = useState(false)

  const handlePhotoClick = () => fileInputRef.current?.click()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setProfilePhoto(reader.result as string)
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const handleSaveEmail = () => {
    setEmail(emailDraft.trim())
    setEditingEmail(false)
  }

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.02 } }
  }

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 380, damping: 28 } }
  }

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={containerVariants}
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
            onClick={() => navigate(-1)}
            aria-label="Назад"
            className="w-10 h-10 -ml-1 text-primary hover:bg-black/5 rounded-full transition-colors active:scale-95 flex items-center justify-center shrink-0"
          >
            <span className="material-symbols-outlined text-[24px]">arrow_back</span>
          </button>
          <h1 className="absolute left-1/2 -translate-x-1/2 font-headline font-bold text-lg tracking-tight text-primary">Настройки</h1>
        </div>
      </header>

      <main className="px-6 pb-28 hide-scrollbar">
        {/* Profile Block */}
        <motion.section variants={itemVariants} className="flex items-center gap-6 mb-10 mt-4">
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
        </motion.section>

        {/* Account Section */}
        <motion.section variants={itemVariants} className="bg-white rounded-[1.5rem] p-6 mb-6 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
          <div className="flex flex-col gap-5">

            {/* Email */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-on-surface-variant px-1">Электронная почта</label>
              {editingEmail ? (
                <div className="flex gap-2 items-center">
                  <input
                    autoFocus
                    type="email"
                    value={emailDraft}
                    onChange={(e) => setEmailDraft(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSaveEmail() }}
                    style={{ fontSize: '16px' }}
                    className="flex-1 bg-surface-container-low rounded-xl px-5 py-3.5 text-on-surface border border-primary/40 outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                  />
                  <button
                    onClick={handleSaveEmail}
                    className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center flex-shrink-0 active:scale-95 transition-transform"
                  >
                    <span className="material-symbols-outlined text-white text-[18px]">check</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between bg-surface-container-low rounded-xl px-5 py-3.5">
                  <span className="text-on-surface-variant text-sm">{email || '—'}</span>
                  <button
                    onClick={() => { setEmailDraft(email); setEditingEmail(true) }}
                    className="text-on-surface-variant/50 active:text-primary active:scale-90 transition-all ml-3 flex-shrink-0"
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
                  onClick={() => setIsCalendarOpen(true)}
                  className="text-on-surface-variant/50 active:text-primary active:scale-90 transition-all ml-3 flex-shrink-0"
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
                  onClick={() => setIsTimePickerOpen(true)}
                  className="text-on-surface-variant/50 active:text-primary active:scale-90 transition-all ml-3 flex-shrink-0"
                >
                  <span className="material-symbols-outlined text-[18px]">edit</span>
                </button>
              </div>
            </div>

          </div>
        </motion.section>

        {/* Контент */}
        <motion.section variants={itemVariants} className="bg-white rounded-[1.5rem] p-6 mb-6 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
          <h2 className="text-sm font-bold text-on-surface mb-5 px-1 uppercase tracking-wider opacity-60">Контент</h2>
          <div className="flex flex-col gap-6">
            <ToggleItem label="Гороскоп" isActive={showHoroscope} onToggle={toggleHoroscope} />
            <ToggleItem label="Праздники" isActive={showHolidays} onToggle={toggleHolidays} />
            <ToggleItem label="Поддержка на сегодня" isActive={showSupport} onToggle={toggleSupport} />
          </div>
        </motion.section>

        <div className="h-6" />
      </main>

      {/* CalendarSheet */}
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

      {/* TimePickerSheet */}
      <AnimatePresence>
        {isTimePickerOpen && (
          <TimePickerSheet
            isOpen={isTimePickerOpen}
            initialTime={horoscopeTime || '09:00'}
            onSave={(time) => {
              setIsTimePickerOpen(false)
              startTransition(() => setHoroscopeTime(time))
            }}
            onCancel={() => setIsTimePickerOpen(false)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function ToggleItem({ label, isActive, onToggle }: { label: string; isActive: boolean; onToggle: () => void }) {
  return (
    <div className="flex items-center justify-between">
      <span className="font-medium text-on-surface">{label}</span>
      <button
        onClick={onToggle}
        className={`w-12 h-6 rounded-full relative transition-colors duration-300 ${isActive ? 'bg-accent' : 'bg-surface-container-highest'}`}
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
