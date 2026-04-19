import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { motion, useDragControls } from 'framer-motion'

interface TimePickerSheetProps {
  isOpen: boolean
  initialTime: string
  onSave: (time: string) => void
  onCancel: () => void
}

const HOURS = Array.from({ length: 24 }, (_, index) => String(index).padStart(2, '0'))
const MINUTES = Array.from({ length: 12 }, (_, index) => String(index * 5).padStart(2, '0'))

const ITEM_HEIGHT = 60
const VISIBLE_ITEMS = 5
const SPACER_HEIGHT = ITEM_HEIGHT * 2

const scrollStyle: CSSProperties = {
  height: ITEM_HEIGHT * VISIBLE_ITEMS,
  overflowY: 'scroll',
  scrollSnapType: 'y mandatory',
  overscrollBehaviorY: 'contain',
  scrollbarWidth: 'none',
  msOverflowStyle: 'none',
  WebkitOverflowScrolling: 'touch',
}

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
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const userScrollingRef = useRef(false)

  useEffect(() => {
    const element = scrollRef.current
    if (!element || userScrollingRef.current) return

    element.scrollTo({
      top: selectedIndex * ITEM_HEIGHT,
      behavior: 'auto',
    })
  }, [selectedIndex])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  const handleScroll = useCallback(() => {
    userScrollingRef.current = true

    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      const element = scrollRef.current
      if (!element) return

      userScrollingRef.current = false
      const rawIndex = Math.round(element.scrollTop / ITEM_HEIGHT)
      const clampedIndex = Math.max(0, Math.min(items.length - 1, rawIndex))
      onChange(clampedIndex)
    }, 80)
  }, [items.length, onChange])

  return (
    <div className="relative" style={{ width: 108, height: ITEM_HEIGHT * VISIBLE_ITEMS }}>
      <div
        className="pointer-events-none absolute left-0 right-0 z-10 rounded-2xl bg-primary/[0.07]"
        style={{ top: ITEM_HEIGHT * 2, height: ITEM_HEIGHT }}
      />

      <div
        className="pointer-events-none absolute left-0 right-0 top-0 z-20"
        style={{
          height: ITEM_HEIGHT * 2 + 8,
          background: 'linear-gradient(to bottom, #fcf9f4 20%, rgba(252, 249, 244, 0) 100%)',
        }}
      />

      <div
        className="pointer-events-none absolute bottom-0 left-0 right-0 z-20"
        style={{
          height: ITEM_HEIGHT * 2 + 8,
          background: 'linear-gradient(to top, #fcf9f4 20%, rgba(252, 249, 244, 0) 100%)',
        }}
      />

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="[&::-webkit-scrollbar]:hidden relative z-0"
        style={scrollStyle}
      >
        <div style={{ height: SPACER_HEIGHT, flexShrink: 0 }} />

        {items.map((label, index) => {
          const distance = Math.abs(index - selectedIndex)
          const opacity = distance === 0 ? 1 : distance === 1 ? 0.45 : 0.12
          const scale = distance === 0 ? 1 : distance === 1 ? 0.82 : 0.62
          const color = distance === 0 ? '#006a65' : '#6d7a78'
          const fontWeight = distance === 0 ? 800 : distance === 1 ? 600 : 400
          const fontSize = distance === 0 ? 54 : distance === 1 ? 40 : 30

          return (
            <div
              key={label}
              style={{
                height: ITEM_HEIGHT,
                scrollSnapAlign: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity,
                transform: `scale(${scale})`,
                color,
                fontWeight,
                fontSize,
                lineHeight: 1,
                transition: 'opacity 0.15s ease, transform 0.15s ease, color 0.15s ease',
                willChange: 'opacity, transform',
                userSelect: 'none',
              }}
            >
              {label}
            </div>
          )
        })}

        <div style={{ height: SPACER_HEIGHT, flexShrink: 0 }} />
      </div>
    </div>
  )
}

export function TimePickerSheet({ isOpen, initialTime, onSave, onCancel }: TimePickerSheetProps) {
  const dragControls = useDragControls()
  const [hourIndex, setHourIndex] = useState(7)
  const [minuteIndex, setMinuteIndex] = useState(6)

  useEffect(() => {
    if (!isOpen || !initialTime) return

    const [hours, minutes] = initialTime.split(':')
    const nextHourIndex = HOURS.indexOf(hours)
    if (nextHourIndex >= 0) setHourIndex(nextHourIndex)

    const nextMinuteIndex = Math.round(Number(minutes) / 5)
    setMinuteIndex(Math.max(0, Math.min(MINUTES.length - 1, nextMinuteIndex)))
  }, [initialTime, isOpen])

  useEffect(() => {
    if (!isOpen) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isOpen])

  if (!isOpen) return null

  const content = (
    <div className="fixed inset-0 z-[70]">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onCancel}
        className="absolute inset-0 bg-black/45"
        aria-hidden="true"
      />

      <motion.div
        drag="y"
        dragControls={dragControls}
        dragListener={false}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.18 }}
        onDragEnd={(_, info) => {
          if (info.offset.y > 72 || info.velocity.y > 320) onCancel()
        }}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 340, damping: 32 }}
        className="absolute bottom-0 left-0 right-0 mx-auto flex w-full max-w-[430px] flex-col overflow-hidden rounded-t-[28px] bg-background shadow-[0_-8px_32px_rgba(0,0,0,0.12)]"
        style={{
          paddingBottom: 'max(20px, env(safe-area-inset-bottom))',
          maxHeight: 'calc(100dvh - env(safe-area-inset-top) - 12px)',
        }}
      >
        <div
          className="touch-none select-none px-6 pb-4 pt-3"
          onPointerDown={(event) => dragControls.start(event)}
        >
          <div className="mx-auto h-1 w-10 rounded-full bg-on-surface/15" />
          <div className="mt-4 flex items-center justify-between">
            <button
              type="button"
              onClick={onCancel}
              className="flex h-10 w-10 items-center justify-center rounded-full text-primary active:scale-95"
            >
              <span className="material-symbols-outlined text-[22px]">close</span>
            </button>
            <h2 className="font-headline text-lg font-bold text-on-surface">Установить время</h2>
            <div className="w-10" />
          </div>
        </div>

        <div className="relative px-6 pb-2 pt-1">
          <div className="pointer-events-none absolute left-1/2 top-16 h-56 w-56 -translate-x-1/2 rounded-full bg-primary/5 blur-[90px]" />

          <div className="relative z-10 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-on-surface-variant/65">
              ВРЕМЯ ПРАКТИКИ
            </p>
          </div>

          <div className="relative z-10 mt-6 flex items-center justify-center">
            <div className="pointer-events-none absolute left-0 right-0 h-[60px] rounded-2xl bg-primary/[0.04]" />

            <div className="flex items-center justify-center gap-2">
              <WheelColumn items={HOURS} selectedIndex={hourIndex} onChange={setHourIndex} />
              <div
                className="select-none font-headline font-bold text-primary"
                style={{ fontSize: 60, lineHeight: 1, marginBottom: 4 }}
              >
                :
              </div>
              <WheelColumn items={MINUTES} selectedIndex={minuteIndex} onChange={setMinuteIndex} />
            </div>
          </div>

          <div className="relative z-10 mt-8 px-4 text-center">
            <p className="text-[13px] font-medium italic leading-relaxed text-on-surface-variant/70">
              Выберите спокойное время для ежедневного напоминания об осознанности.
            </p>
          </div>
        </div>

        <footer className="px-6 pt-5">
          <button
            type="button"
            onClick={() => onSave(`${HOURS[hourIndex]}:${MINUTES[minuteIndex]}`)}
            className="w-full rounded-2xl bg-primary py-4 font-headline text-base font-bold text-white shadow-lg shadow-primary/20 transition-transform active:scale-[0.98]"
          >
            Сохранить
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="mt-3 w-full rounded-2xl py-4 font-headline text-base font-semibold text-[#914946] transition-colors active:scale-[0.98]"
          >
            Отмена
          </button>
        </footer>
      </motion.div>
    </div>
  )

  return createPortal(content, document.body)
}
