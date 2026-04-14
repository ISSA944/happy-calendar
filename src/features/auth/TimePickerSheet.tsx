import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { motion, useMotionValue, useTransform, animate, useMotionValueEvent } from 'framer-motion'

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
const CONTAINER_H = ITEM_H * VISIBLE_ITEMS
const CENTER_Y = CONTAINER_H / 2
const BASE_OFFSET = CENTER_Y - ITEM_H / 2

function WheelItem({ label, index, yPos, activeFontSize }: {
  label: string
  index: number
  yPos: any
  activeFontSize: number
}) {
  // Widened range (±2 items) for smoother visual transitions
  const range = [
    (index + 2) * -ITEM_H,
    (index + 1) * -ITEM_H,
    index * -ITEM_H,
    (index - 1) * -ITEM_H,
    (index - 2) * -ITEM_H
  ]

  const opacity = useTransform(yPos, range, [0.08, 0.45, 1, 0.45, 0.08])
  const scale = useTransform(yPos, range, [0.4, 0.8, 1, 0.8, 0.4])
  const color = useTransform(yPos, range, ['#6d7a78', '#6d7a78', '#006a65', '#6d7a78', '#6d7a78'])
  const fontWeight = useTransform(yPos, range, [400, 600, 800, 600, 400])

  return (
    <motion.div
      className="flex items-center justify-center font-headline absolute left-0 right-0"
      style={{
        height: ITEM_H,
        top: index * ITEM_H,
        opacity,
        scale,
        color,
        fontWeight,
        fontSize: activeFontSize,
        lineHeight: 1,
      }}
    >
      {label}
    </motion.div>
  )
}

function WheelColumn({ items, selectedIndex, onChange, activeFontSize = 56 }: {
  items: string[]
  selectedIndex: number
  onChange: (index: number) => void
  activeFontSize?: number
}) {
  const yPos = useMotionValue(-selectedIndex * ITEM_H)
  const isDragging = useRef(false)

  // Sync when parent changes selectedIndex
  useEffect(() => {
    if (!isDragging.current) {
      animate(yPos, -selectedIndex * ITEM_H, {
        type: 'spring',
        stiffness: 400,
        damping: 40
      })
    }
  }, [selectedIndex, yPos])

  const minScroll = -(items.length - 1) * ITEM_H
  const maxScroll = 0

  return (
    <div className="relative overflow-hidden select-none touch-none"
      style={{ height: CONTAINER_H, width: 110 }}
    >
      {/* --- Highlight band (exactly ITEM_H tall, dead-center) --- */}
      <div
        className="absolute left-0 right-0 bg-[#006a65]/[0.06] rounded-2xl pointer-events-none z-0"
        style={{ top: CENTER_Y - ITEM_H / 2, height: ITEM_H }}
      />

      {/* --- Gradient masks --- */}
      <div className="absolute top-0 left-0 right-0 pointer-events-none z-20"
        style={{ height: CENTER_Y - ITEM_H / 2 + 10, background: 'linear-gradient(to bottom, #fcf9f4 20%, rgba(252,249,244,0) 100%)' }}
      />
      <div className="absolute bottom-0 left-0 right-0 pointer-events-none z-20"
        style={{ height: CENTER_Y - ITEM_H / 2 + 10, background: 'linear-gradient(to top, #fcf9f4 20%, rgba(252,249,244,0) 100%)' }}
      />

      {/* --- Main Drag Track --- */}
      <div 
        className="absolute inset-x-0 z-10"
        style={{ top: BASE_OFFSET, bottom: BASE_OFFSET }}
      >
        <motion.div
          drag="y"
          dragConstraints={{ top: minScroll, bottom: maxScroll }}
          dragElastic={0.15}
          dragTransition={{
            power: 0.35,
            timeConstant: 250,
            modifyTarget: (target) => Math.round(target / ITEM_H) * ITEM_H
          }}
          onDragStart={() => { isDragging.current = true }}
          onDragEnd={() => {
            isDragging.current = false
            const finalY = yPos.get()
            const finalIdx = Math.max(0, Math.min(items.length - 1, Math.round(-finalY / ITEM_H)))
            onChange(finalIdx)
          }}
          style={{ y: yPos }}
          className="relative h-full cursor-grab active:cursor-grabbing"
        >
          {items.map((label, i) => (
            <WheelItem
              key={i}
              index={i}
              label={label}
              yPos={yPos}
              activeFontSize={activeFontSize}
            />
          ))}
        </motion.div>
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
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-background"
      />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 30 }}
        transition={{ type: 'spring', damping: 26, stiffness: 240 }}
        className="relative w-full max-w-[390px] mx-auto h-full max-h-[844px] bg-background flex flex-col overflow-hidden"
      >
        {/* Abstract background shape for premium feel */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

        {/* Header — Absolute Centered Title as per HTML */}
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
          <div className="w-10"></div>
        </header>

        {/* Body */}
        <div className="flex-1 flex flex-col items-center justify-center px-8 relative">
          <div className="text-center mb-12">
            <p className="text-on-surface-variant font-medium text-xs tracking-[0.2em] uppercase opacity-70">ВРЕМЯ ПРАКТИКИ</p>
          </div>

          {/* Wheels — text-7xl for center element */}
          <div className="relative flex items-center justify-center">
            {/* Background highlight band that spans across wheels */}
            <div className="absolute left-0 right-0 h-20 bg-[#006a65]/[0.04] rounded-2xl pointer-events-none z-0" />
            
            <div className="flex items-center justify-center z-10 gap-2">
              <WheelColumn 
                items={HOURS} 
                selectedIndex={hIdx} 
                onChange={setHIdx} 
                activeFontSize={84} // text-7xl/8xl feel
              />
              <div className="text-[#006a65] font-headline font-bold select-none mb-1 opacity-90" style={{ fontSize: 64, lineHeight: 1 }}>:</div>
              <WheelColumn 
                items={MINUTES} 
                selectedIndex={mIdx} 
                onChange={setMIdx} 
                activeFontSize={84} // text-7xl/8xl feel
              />
            </div>

            {/* Gradient Overlays for Scrolling Effect */}
            <div className="absolute inset-0 pointer-events-none z-20" 
                 style={{ 
                   background: 'linear-gradient(to bottom, #fcf9f4 0%, rgba(252,249,244,0) 25%, rgba(252,249,244,0) 75%, #fcf9f4 100%)' 
                 }} 
            />
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

        {/* Visual Decor: Soft abstract organic shape */}
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-tertiary-container/5 rounded-full blur-[100px] pointer-events-none" />
      </motion.div>
    </div>
  )
}
