import { useCallback, useEffect, useRef } from 'react'
import { useAppStore } from '../../store'
import { getMoodLabel } from '../../services/content.service'
import { BottomSheet } from '../../components/ui/BottomSheet'

interface MoodSheetProps {
  isOpen: boolean
  onClose: () => void
}

const MOODS = [
  { id: 'Спокойна',     icon: 'waves' },
  { id: 'Нормально',    icon: 'fiber_manual_record' },
  { id: 'Устала',       icon: 'nights_stay' },
  { id: 'Тревожна',     icon: 'cloud' },
  { id: 'Грустна',      icon: 'water_drop' },
  { id: 'Воодушевлена', icon: 'sunny' },
]

export function MoodSheet({ isOpen, onClose }: MoodSheetProps) {
  const currentMood = useAppStore((state) => state.currentMood)
  const setMood = useAppStore((state) => state.setMood)
  const gender = useAppStore((state) => state.gender)
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current)
    }
  }, [])

  const handleSelect = useCallback((mood: string) => {
    void setMood(mood)
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current)
    closeTimerRef.current = setTimeout(onClose, 150)
  }, [setMood, onClose])

  const title = (
    <div className="space-y-0.5">
      <h2 className="font-headline text-2xl font-bold text-on-surface">Сменить настроение</h2>
      <p className="text-on-surface-variant text-sm font-medium">Сейчас: {getMoodLabel(currentMood, gender)}</p>
    </div>
  )

  const headerRight = (
    <button
      onClick={onClose}
      className="text-primary font-semibold text-sm py-1 hover:opacity-70 transition-opacity active:scale-95 pointer-events-auto"
    >
      Готово
    </button>
  )

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={title} headerRight={headerRight}>
      <div className="flex flex-col gap-2 px-4 pb-6 overflow-y-auto">
        {MOODS.map((mood) => {
          const isSelected = currentMood === mood.id
          return (
            <button
              key={mood.id}
              onClick={() => handleSelect(mood.id)}
              className={`flex items-center justify-between p-4 rounded-2xl text-left active:scale-[0.98] transition-all ${
                isSelected
                  ? 'bg-[#2FA7A0]/10 border border-[#2FA7A0]/30'
                  : 'bg-transparent border border-transparent hover:bg-surface-container/50'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 flex-shrink-0 rounded-full flex items-center justify-center ${
                  isSelected ? 'bg-[#2FA7A0]/20' : 'bg-[#2FA7A0]/12'
                }`}
                  style={{ backgroundColor: isSelected ? 'rgba(47,167,160,0.18)' : 'rgba(47,167,160,0.12)' }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{
                      fontSize: '20px',
                      color: isSelected ? '#006a65' : '#2FA7A0',
                      fontVariationSettings: isSelected ? "'FILL' 1" : "'FILL' 0",
                    }}
                  >
                    {mood.icon}
                  </span>
                </div>
                <span className={`font-semibold font-headline text-base ${isSelected ? 'text-primary' : 'text-on-surface'}`}>
                  {getMoodLabel(mood.id, gender)}
                </span>
              </div>
              {isSelected && (
                <span
                  className="material-symbols-outlined text-primary text-xl"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  check_circle
                </span>
              )}
            </button>
          )
        })}
      </div>
    </BottomSheet>
  )
}
