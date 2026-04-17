import { useState, useRef, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'

interface TimePickerSheetProps {
  isOpen: boolean
  initialTime: string
  onSave: (time: string) => void
  onCancel: () => void
}

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
const MINUTES = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'))

const ITEM_H = 60
const VISIBLE_ITEMS = 5
const SPACER = ITEM_H * 2  // 2 spacer items top/bottom so first/last reach center

// ──────────────────────────────────────────
// WheelColumn — native CSS scroll-snap
// ──────────────────────────────────────────
function WheelColumn({
  items,
  selectedIndex,
  onChange,
}: {
  items: string[]
  selectedIndex: number
  onChange: (index: number) => void
}) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const isScrollingRef = useRef(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const programmaticRef = useRef(false)

  // Scroll to selectedIndex on mount and on external change (e.g. initialTime parsed)
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    if (isScrollingRef.current) return  // don't interfere while user is swiping

    programmaticRef.current = true
    el.scrollTo({ top: selectedIndex * ITEM_H, behavior: 'instant' })

    // Clear programmatic flag after a short delay
    const t = setTimeout(() => { programmaticRef.current = false }, 50)
    return () => clearTimeout(t)
  }, [selectedIndex])

  const handleScroll = useCallback(() => {
    isScrollingRef.current = true

    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      isScrollingRef.current = false
      const el = scrollRef.current
      if (!el) return
      const idx = Math.round(el.scrollTop / ITEM_H)
      const clamped = Math.max(0, Math.min(items.length - 1, idx))
      onChange(clamped)
    }, 80)
  }, [items.length, onChange])

  return (
    <div className="relative" style={{ width: 110, height: ITEM_H * VISIBLE_ITEMS }}>
      {/* Highlight band — dead center */}
      <div
        className="absolute left-0 right-0 bg-[#006a65]/[0.07] rounded-2xl pointer-events-none z-10"
        style={{ top: ITEM_H * 2, height: ITEM_H }}
      />

      {/* Gradient mask top */}
      <div
        className="absolute top-0 left-0 right-0 pointer-events-none z-20"
        style={{
          height: ITEM_H * 2 + 10,
          background: 'linear-gradient(to bottom, #fcf9f4 20%, rgba(252,249,244,0) 100%)',
        }}
      />

      {/* Gradient mask bottom */}
      <div
        className="absolute bottom-0 left-0 right-0 pointer-events-none z-20"
        style={{
          height: ITEM_H * 2 + 10,
          background: 'linear-gradient(to top, #fcf9f4 20%, rgba(252,249,244,0) 100%)',
        }}
      />

      {/* Scroll container */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="[&::-webkit-scrollbar]:hidden relative z-0"
        style={{
          height: ITEM_H * VISIBLE_ITEMS,
          overflowY: 'scroll',
          scrollSnapType: 'y mandatory',
          overscrollBehaviorY: 'contain',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        } as React.CSSProperties}
      >
        {/* Top spacer */}
        <div style={{ height: SPACER, flexShrink: 0 }} />

        {items.map((label, i) => {
          const dist = Math.abs(i - selectedIndex)
          const opacity = dist === 0 ? 1 : dist === 1 ? 0.45 : 0.12
          const scale = dist === 0 ? 1 : dist === 1 ? 0.82 : 0.62
          const color = dist === 0 ? '#006a65' : '#6d7a78'
          const fontWeight = dist === 0 ? 800 : dist === 1 ? 500 : 400
          const fontSize = dist === 0 ? 56 : dist === 1 ? 40 : 30

          return (
            <div
              key={i}
              style={{
                height: ITEM_H,
                scrollSnapAlign: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity,
                transform: `scale(${scale})`,
                color,
                fontWeight,
                fontSize,
                fontFamily: 'inherit',
                lineHeight: 1,
                transition: 'opacity 0.15s ease, transform 0.15s ease, color 0.15s ease',
                userSelect: 'none',
              }}
            >
              {label}
            </div>
          )
        })}

        {/* Bottom spacer */}
        <div style={{ height: SPACER, flexShrink: 0 }} />
      </div>
    </div>
  )
}

// ──────────────────────────────────────────
// Main sheet
// ──────────────────────────────────────────

export function TimePickerSheet({ isOpen, initialTime, onSave, onCancel }: TimePickerSheetProps) {
  const [hIdx, setHIdx] = useState(7)
  const [mIdx, setMIdx] = useState(6)

  useEffect(() => {
    if (isOpen && initialTime) {
      const [h, m] = initialTime.split(':')
      const hi = HOURS.indexOf(h)
      if (hi >= 0) setHIdx(hi)
      const mi = Math.round(parseInt(m, 10) / 5)
      setMIdx(Math.min(mi, MINUTES.length - 1))
    }
  }, [isOpen, initialTime])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[60]">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, transition: { duration: 0.32, ease: [0.32, 0.72, 0, 1] } }}
        className="absolute inset-0 bg-background"
        style={{ willChange: 'opacity', transform: 'translateZ(0)' }}
      />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0, transition: { type: 'spring', damping: 25, stiffness: 200 } }}
        exit={{ opacity: 0, y: 40, transition: { duration: 0.32, ease: [0.32, 0.72, 0, 1] } }}
        style={{ willChange: 'transform, opacity', transform: 'translateZ(0)' }}
        className="relative w-full max-w-[390px] mx-auto h-full max-h-[844px] bg-background flex flex-col overflow-hidden"
      >
        {/* Soft background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 w-full relative z-10">
          <button
            onClick={onCancel}
            className="p-2 -ml-2 text-[#006a65] hover:bg-stone-100 transition-colors rounded-full active:scale-95 duration-200"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
          <h1 className="font-headline font-semibold text-lg text-[#006a65] absolute left-1/2 -translate-x-1/2">
            Установить время
          </h1>
          <div className="w-10" />
        </header>

        {/* Body */}
        <div className="flex-1 flex flex-col items-center justify-center px-8 relative">
          <div className="text-center mb-12">
            <p className="text-on-surface-variant font-medium text-xs tracking-[0.2em] uppercase opacity-70">
              ВРЕМЯ ПРАКТИКИ
            </p>
          </div>

          {/* Wheels */}
          <div className="relative flex items-center justify-center">
            {/* Cross-wheel highlight band */}
            <div className="absolute left-0 right-0 h-[60px] bg-[#006a65]/[0.04] rounded-2xl pointer-events-none z-0" />

            <div className="flex items-center justify-center z-10 gap-2">
              <WheelColumn items={HOURS} selectedIndex={hIdx} onChange={setHIdx} />
              <div
                className="text-[#006a65] font-headline font-bold select-none opacity-90"
                style={{ fontSize: 64, lineHeight: 1, marginBottom: 4 }}
              >
                :
              </div>
              <WheelColumn items={MINUTES} selectedIndex={mIdx} onChange={setMIdx} />
            </div>
          </div>

          <div className="mt-14 text-center max-w-[280px]">
            <p className="text-on-surface-variant/60 text-[13.5px] font-medium italic leading-relaxed">
              Выберите удобное время для ваших ежедневных напоминаний об осознанности.
            </p>
          </div>
        </div>

        {/* Actions */}
        <footer className="p-8 space-y-4">
          <button
            onClick={() => onSave(`${HOURS[hIdx]}:${MINUTES[mIdx]}`)}
            className="w-full bg-[#006a65] hover:opacity-90 active:scale-[0.98] transition-all text-white font-headline font-bold py-5 rounded-xl shadow-lg shadow-primary/10"
          >
            Сохранить
          </button>
          <button
            onClick={onCancel}
            className="w-full text-[#914946] hover:bg-secondary-container/10 active:scale-[0.98] transition-all font-headline font-semibold py-4 rounded-xl"
          >
            Отмена
          </button>
        </footer>

        {/* Decorative glow */}
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-tertiary-container/5 rounded-full blur-[100px] pointer-events-none" />
      </motion.div>
    </div>
  )
}
