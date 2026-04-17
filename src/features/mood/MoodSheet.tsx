import { useEffect } from 'react'
import { motion, useDragControls } from 'framer-motion'
import { useAppStore } from '../../store'
import { getMoodLabel } from '../../services/content.service'

interface MoodSheetProps {
  onClose: () => void
}

const MOODS = [
  { id: 'Воодушевлена', icon: 'sunny' },
  { id: 'Спокойна',     icon: 'waves' },
  { id: 'Счастлива',    icon: 'sentiment_very_satisfied' },
  { id: 'Нейтрально',   icon: 'fiber_manual_record' },
  { id: 'Устала',       icon: 'nights_stay' },
  { id: 'Тревога',      icon: 'cloud' },
  { id: 'Грусть',       icon: 'water_drop' },
  { id: 'Злость',       icon: 'local_fire_department' },
]

export function MoodSheet({ onClose }: MoodSheetProps) {
  const currentMood = useAppStore((state) => state.currentMood)
  const setMood = useAppStore((state) => state.setMood)
  const gender = useAppStore((state) => state.gender)
  const dragControls = useDragControls()

  // Body scroll lock — lock when mounted, release when unmounted
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  const handleSelect = (mood: string) => {
    setMood(mood)
    setTimeout(() => onClose(), 150)
  }

  return (
    <div className="fixed inset-0 z-[100] flex flex-col justify-end">
      {/* Backdrop — touch-none prevents swipes from bleeding through to the page */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, transition: { duration: 0.32, ease: [0.32, 0.72, 0, 1] } }}
        transition={{ duration: 0.3 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/50 cursor-pointer touch-none"
        style={{ willChange: 'opacity', transform: 'translateZ(0)' }}
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
        animate={{ y: 0, transition: { type: 'spring', damping: 25, stiffness: 200 } }}
        exit={{ y: '100%', transition: { duration: 0.32, ease: [0.32, 0.72, 0, 1] } }}
        className="relative w-full max-w-[390px] mx-auto bg-surface-container-lowest rounded-t-[24px] shadow-2xl flex flex-col"
        style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))', willChange: 'transform', transform: 'translateZ(0)' }}
      >
        {/* Drag zone: pill + header — wide grab area, no scrolling inside */}
        <div
          className="px-6 pt-4 pb-3 touch-none select-none cursor-grab"
          onPointerDown={(e) => dragControls.start(e)}
        >
          <div className="w-10 h-1 bg-surface-container-highest rounded-full mx-auto mb-4" />
          <div className="flex justify-between items-center">
            <div>
              <h2 className="font-headline text-xl font-bold text-on-surface">Сменить настроение</h2>
              <p className="text-on-surface-variant text-sm font-medium mt-0.5">Сейчас: {getMoodLabel(currentMood, gender)}</p>
            </div>
            <button
              onClick={onClose}
              className="text-primary font-semibold text-sm py-1 hover:opacity-70 transition-opacity active:scale-95 pointer-events-auto"
            >
              Готово
            </button>
          </div>
        </div>

        {/* Mood list — compact, fits all 8 without scrolling */}
        <div className="flex flex-col px-5 pb-2">
          {MOODS.map((mood) => {
            const isSelected = currentMood === mood.id
            return (
              <button
                key={mood.id}
                onClick={() => handleSelect(mood.id)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-2xl text-left active:scale-[0.98] transition-colors ${
                  isSelected ? 'bg-accent/10' : 'hover:bg-surface-container/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center ${
                    isSelected ? 'bg-accent/20' : 'bg-accent/10'
                  }`}>
                    <span
                      className="material-symbols-outlined"
                      style={{ fontSize: '18px', color: isSelected ? '#006a65' : '#2FA7A0', fontVariationSettings: isSelected ? "'FILL' 1" : "'FILL' 0" }}
                    >
                      {mood.icon}
                    </span>
                  </div>
                  <span className={`font-semibold font-headline text-[15px] ${isSelected ? 'text-primary' : 'text-on-surface'}`}>
                    {getMoodLabel(mood.id, gender)}
                  </span>
                </div>
                {isSelected && (
                  <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                    check_circle
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </motion.div>
    </div>
  )
}
