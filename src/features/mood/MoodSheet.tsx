import { useEffect } from 'react'
import { motion, useDragControls } from 'framer-motion'
import { useAppStore } from '../../store'

interface MoodSheetProps {
  onClose: () => void
}

const MOODS = [
  { id: 'Воодушевлена', label: 'Воодушевлена', icon: 'sunny' },
  { id: 'Спокойна', label: 'Спокойна', icon: 'waves' },
  { id: 'Счастлива', label: 'Счастлива', icon: 'sentiment_very_satisfied' },
  { id: 'Нейтрально', label: 'Нейтрально', icon: 'fiber_manual_record' },
  { id: 'Устала', label: 'Устала', icon: 'nights_stay' },
  { id: 'Тревога', label: 'Тревога', icon: 'cloud' },
  { id: 'Грусть', label: 'Грусть', icon: 'water_drop' },
  { id: 'Злость', label: 'Злость', icon: 'local_fire_department' },
]

export function MoodSheet({ onClose }: MoodSheetProps) {
  const currentMood = useAppStore((state) => state.currentMood)
  const setCurrentMood = useAppStore((state) => state.setCurrentMood)
  const dragControls = useDragControls()

  // Body scroll lock — lock when mounted, release when unmounted
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  const handleSelect = (mood: string) => {
    setCurrentMood(mood)
    setTimeout(() => onClose(), 150)
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* Backdrop — touch-none prevents swipes from bleeding through to the page */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm cursor-pointer touch-none"
        aria-hidden="true"
      />

      {/* Sheet */}
      <motion.div
        drag="y"
        dragControls={dragControls}
        dragListener={false}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.2 }}
        onDragEnd={(_, { offset, velocity }) => {
          if (offset.y > 50 || velocity.y > 200) onClose()
        }}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative w-full max-w-[390px] mx-auto bg-surface-container-lowest rounded-t-[24px] shadow-2xl flex flex-col max-h-[85vh]"
        style={{ paddingBottom: 'max(24px, env(safe-area-inset-bottom))' }}
      >
        {/* Drag zone: pill + header — wide grab area, no scrolling inside */}
        <div
          className="px-6 pt-5 pb-0 touch-none select-none cursor-grab"
          onPointerDown={(e) => dragControls.start(e)}
        >
          {/* Handle pill */}
          <div className="w-10 h-1 bg-surface-container-highest rounded-full mx-auto mb-5" />

          {/* Header */}
          <div className="flex justify-between items-start mb-5">
            <div className="space-y-0.5">
              <h2 className="font-headline text-2xl font-bold text-on-surface">Сменить настроение</h2>
              <p className="text-on-surface-variant text-sm font-medium">Сейчас: {currentMood}</p>
            </div>
            {/* pointer-events-auto ensures the button stays tappable inside touch-none zone */}
            <button
              onClick={onClose}
              className="text-primary font-semibold text-sm py-1 hover:opacity-70 transition-opacity active:scale-95 pointer-events-auto"
            >
              Готово
            </button>
          </div>
        </div>

        {/* Scrollable mood list — outside drag zone so scroll works normally */}
        <div className="flex flex-col gap-2 overflow-y-auto px-6 pb-2">
          {MOODS.map((mood) => {
            const isSelected = currentMood === mood.id

            if (isSelected) {
              return (
                <button
                  key={mood.id}
                  onClick={() => handleSelect(mood.id)}
                  className="flex items-center justify-between p-4 rounded-2xl bg-[#2FA7A0]/[0.10] border border-[#2FA7A0]/30 transition-all text-left shadow-sm active:scale-[0.98]"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 flex-shrink-0 rounded-full bg-[#2FA7A0]/[0.18] flex items-center justify-center">
                      <span className="material-symbols-outlined text-[#006a65]" style={{ fontVariationSettings: "'FILL' 1", fontSize: '20px' }}>
                        {mood.icon}
                      </span>
                    </div>
                    <span className="font-bold text-[#006a65] font-headline">{mood.label}</span>
                  </div>
                  <span className="material-symbols-outlined text-[#006a65] text-xl font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>
                    check_circle
                  </span>
                </button>
              )
            }

            return (
              <button
                key={mood.id}
                onClick={() => handleSelect(mood.id)}
                className="flex items-center gap-4 p-4 rounded-2xl bg-transparent border border-transparent hover:bg-surface-container/50 transition-all text-left active:scale-[0.98]"
              >
                <div className="w-12 h-12 flex-shrink-0 rounded-full bg-[#2FA7A0]/[0.12] flex items-center justify-center transition-colors">
                  <span className="material-symbols-outlined text-[#2FA7A0]" style={{ fontSize: '20px' }}>
                    {mood.icon}
                  </span>
                </div>
                <span className="font-semibold text-on-surface font-headline">{mood.label}</span>
              </button>
            )
          })}
        </div>
      </motion.div>
    </div>
  )
}
