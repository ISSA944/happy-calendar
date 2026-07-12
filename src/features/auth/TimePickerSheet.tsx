import {
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from 'react'
import { BottomSheet } from '../../components/ui/BottomSheet'

interface TimePickerSheetProps {
  isOpen: boolean
  initialTime: string
  onSave: (time: string) => void
  onCancel: () => void
  /** Название категории/события, для которого выбирается время (напр. "Гороскоп").
      Если не передано — используется нейтральный дефолт (обратная совместимость). */
  categoryLabel?: string
}

const HOURS = Array.from({ length: 24 }, (_, index) => String(index).padStart(2, '0'))
const MINUTES = Array.from({ length: 12 }, (_, index) => String(index * 5).padStart(2, '0'))

const ITEM_HEIGHT = 76
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

interface WheelColumnHandle {
  getSelectedIndex: () => number
}

const WheelColumn = memo(
  forwardRef<WheelColumnHandle, { items: string[]; selectedIndex: number; onChange: (index: number) => void }>(
    function WheelColumn({ items, selectedIndex, onChange }, ref) {
      const scrollRef = useRef<HTMLDivElement>(null)
      const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
      const isTouchingRef = useRef(false)
      const isScrollingRef = useRef(false)
      const [displayIndex, setDisplayIndex] = useState(selectedIndex)

      // Expose a method to get the CURRENT physical scroll index, 
      // bypassing any debounce delays.
      useImperativeHandle(ref, () => ({
        getSelectedIndex: () => {
          if (!scrollRef.current) return selectedIndex
          return Math.max(
            0,
            Math.min(items.length - 1, Math.round(scrollRef.current.scrollTop / ITEM_HEIGHT)),
          )
        },
      }))

      useLayoutEffect(() => {
        const element = scrollRef.current
        if (!element || isTouchingRef.current || isScrollingRef.current) return
        if (Math.round(element.scrollTop / ITEM_HEIGHT) === selectedIndex) {
          return
        }
        element.scrollTop = selectedIndex * ITEM_HEIGHT
      }, [selectedIndex])

      useEffect(() => {
        return () => {
          if (timerRef.current) clearTimeout(timerRef.current)
        }
      }, [])

      const handleTouchStart = useCallback(() => {
        isTouchingRef.current = true
      }, [])
      const handleTouchEnd = useCallback(() => {
        isTouchingRef.current = false
      }, [])

      const handleScroll = useCallback(() => {
        const element = scrollRef.current
        if (!element) return

        isScrollingRef.current = true

        const immediate = Math.max(0, Math.min(items.length - 1, Math.round(element.scrollTop / ITEM_HEIGHT)))
        setDisplayIndex(immediate)

        if (timerRef.current) clearTimeout(timerRef.current)
        timerRef.current = setTimeout(() => {
          if (!scrollRef.current) return
          isScrollingRef.current = false
          isTouchingRef.current = false
          const final = Math.max(0, Math.min(items.length - 1, Math.round(scrollRef.current.scrollTop / ITEM_HEIGHT)))
          setDisplayIndex(final)
          onChange(final)
        }, 150)
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
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
            onMouseDown={handleTouchStart}
            onMouseUp={handleTouchEnd}
            className="[&::-webkit-scrollbar]:hidden relative z-0"
            style={scrollStyle}
          >
            <div style={{ height: SPACER_HEIGHT, flexShrink: 0 }} />

            {items.map((label, index) => {
              const distance = Math.abs(index - displayIndex)
              const opacity = distance === 0 ? 1 : distance === 1 ? 0.4 : 0.2
              const color = distance === 0 ? '#006a65' : '#3d4948'
              const fontSize = distance === 0 ? 72 : distance === 1 ? 48 : 36

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
                    color,
                    fontWeight: 600,
                    fontSize,
                    lineHeight: 1,
                    transition: 'opacity 0.1s ease, color 0.1s ease, font-size 0.1s ease, font-weight 0.1s ease',
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
    },
  ),
)

export function TimePickerSheet({ isOpen, initialTime, onSave, onCancel, categoryLabel }: TimePickerSheetProps) {
  const headerRight = (
    <button
      type="button"
      onClick={onCancel}
      className="flex h-10 w-10 items-center justify-center rounded-full text-primary active:scale-95 -mr-2"
    >
      <span className="material-symbols-outlined text-[22px]">close</span>
    </button>
  )

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onCancel}
      title={categoryLabel ? `Время: ${categoryLabel}` : 'Установить время'}
      headerRight={headerRight}
      draggable={false}
    >
      <TimePickerContent key={initialTime} initialTime={initialTime} onSave={onSave} onCancel={onCancel} categoryLabel={categoryLabel} />
    </BottomSheet>
  )
}

function TimePickerContent({
  initialTime,
  onSave,
  onCancel,
  categoryLabel,
}: Pick<TimePickerSheetProps, 'initialTime' | 'onSave' | 'onCancel' | 'categoryLabel'>) {
  const [initialHours, initialMinutes] = initialTime.split(':')
  const nextHourIndex = HOURS.indexOf(initialHours)
  const nextMinuteIndex = Math.round(Number(initialMinutes) / 5)
  const [hourIndex, setHourIndex] = useState(nextHourIndex >= 0 ? nextHourIndex : 7)
  const [minuteIndex, setMinuteIndex] = useState(
    Math.max(0, Math.min(MINUTES.length - 1, Number.isFinite(nextMinuteIndex) ? nextMinuteIndex : 6)),
  )

  const hourWheelRef = useRef<WheelColumnHandle>(null)
  const minuteWheelRef = useRef<WheelColumnHandle>(null)

  const handleFinalSave = () => {
    // Read the LIVE index from the wheels to avoid debounce race conditions
    const hIdx = hourWheelRef.current?.getSelectedIndex() ?? hourIndex
    const mIdx = minuteWheelRef.current?.getSelectedIndex() ?? minuteIndex
    onSave(`${HOURS[hIdx]}:${MINUTES[mIdx]}`)
  }

  return (
    <>
      <div className="relative px-6 pb-2 pt-1">
        <div className="relative z-10 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-on-surface-variant/65">
            {categoryLabel ? categoryLabel.toUpperCase() : 'ВРЕМЯ ПРАКТИКИ'}
          </p>
        </div>

        <div className="relative z-10 mt-6 flex items-center justify-center">
          <div className="pointer-events-none absolute left-0 right-0 h-[76px] rounded-2xl bg-primary/[0.04]" />

          <div className="flex items-center justify-center gap-2">
            <WheelColumn ref={hourWheelRef} items={HOURS} selectedIndex={hourIndex} onChange={setHourIndex} />
            <div
              className="select-none font-headline font-semibold text-primary"
              style={{ fontSize: 72, lineHeight: 1, marginBottom: 4 }}
            >
              :
            </div>
            <WheelColumn ref={minuteWheelRef} items={MINUTES} selectedIndex={minuteIndex} onChange={setMinuteIndex} />
          </div>
        </div>

        <div className="relative z-10 mt-8 px-4 text-center">
          <p className="text-[13px] font-medium italic leading-relaxed text-on-surface-variant/70">
            {categoryLabel
              ? 'Выбери время, когда тебе удобно получать это уведомление.'
              : 'Выберите спокойное время для ежедневного напоминания об осознанности.'}
          </p>
        </div>
      </div>

      <footer className="px-6 pt-5 pb-5 mt-auto">
        <button
          type="button"
          onClick={handleFinalSave}
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
    </>
  )
}
