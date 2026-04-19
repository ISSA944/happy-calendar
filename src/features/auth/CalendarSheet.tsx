import { memo, useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { BottomSheet } from '../../components/ui/BottomSheet'
import type { PanInfo, Variants } from 'framer-motion'

interface CalendarSheetProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (dateStr: string) => void
  currentValue: string
}

type CalendarCell = {
  key: string
  day: number
  monthOffset: -1 | 0 | 1
}

type ParsedDate = {
  day: number
  month: number
  year: number
}

const WEEK_DAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
const MONTHS = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь']
const MONTHS_SHORT = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек']
const CURRENT_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: 90 }, (_, index) => CURRENT_YEAR - index)

const slideVariants: Variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 32 : -32,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 32 : -32,
    opacity: 0,
  }),
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function formatDate(day: number, month: number, year: number) {
  return `${String(day).padStart(2, '0')}.${String(month + 1).padStart(2, '0')}.${year}`
}

function parseDate(value: string): ParsedDate | null {
  const match = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(value)
  if (!match) return null

  const day = Number(match[1])
  const month = Number(match[2]) - 1
  const year = Number(match[3])

  if (month < 0 || month > 11) return null
  if (day < 1 || day > getDaysInMonth(year, month)) return null

  return { day, month, year }
}

function buildCalendarCells(year: number, month: number): CalendarCell[] {
  // Monday-first week: Sunday (getDay === 0) sits at column 6, otherwise getDay - 1
  const firstDayOfMonth = new Date(year, month, 1).getDay()
  const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1
  const currentMonthDaysCount = getDaysInMonth(year, month)

  const cells: CalendarCell[] = []

  // Leading empty placeholders — shift day 1 under its correct weekday column
  for (let index = 0; index < startOffset; index += 1) {
    cells.push({ key: `lead-${index}`, day: 0, monthOffset: -1 })
  }

  // Only days of the current month — no trailing next-month padding
  for (let day = 1; day <= currentMonthDaysCount; day += 1) {
    cells.push({ key: `current-${day}`, day, monthOffset: 0 })
  }

  return cells
}

/* ─── Wheel Picker Column (Apple-style drum picker) ─── */

const WHEEL_ITEM_HEIGHT = 44
const WHEEL_VISIBLE_ITEMS = 5
const WHEEL_SPACER_HEIGHT = WHEEL_ITEM_HEIGHT * 2

const wheelScrollStyle: CSSProperties = {
  height: WHEEL_ITEM_HEIGHT * WHEEL_VISIBLE_ITEMS,
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
      top: selectedIndex * WHEEL_ITEM_HEIGHT,
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
      const rawIndex = Math.round(element.scrollTop / WHEEL_ITEM_HEIGHT)
      const clampedIndex = Math.max(0, Math.min(items.length - 1, rawIndex))
      onChange(clampedIndex)
    }, 80)
  }, [items.length, onChange])

  return (
    <div className="relative flex-1" style={{ height: WHEEL_ITEM_HEIGHT * WHEEL_VISIBLE_ITEMS }}>
      {/* Selection highlight */}
      <div
        className="pointer-events-none absolute left-0 right-0 z-10 rounded-xl bg-primary/[0.07]"
        style={{ top: WHEEL_ITEM_HEIGHT * 2, height: WHEEL_ITEM_HEIGHT }}
      />

      {/* Top fade */}
      <div
        className="pointer-events-none absolute left-0 right-0 top-0 z-20"
        style={{
          height: WHEEL_ITEM_HEIGHT * 2,
          background: 'linear-gradient(to bottom, #fcf9f4 15%, rgba(252, 249, 244, 0) 100%)',
        }}
      />

      {/* Bottom fade */}
      <div
        className="pointer-events-none absolute bottom-0 left-0 right-0 z-20"
        style={{
          height: WHEEL_ITEM_HEIGHT * 2,
          background: 'linear-gradient(to top, #fcf9f4 15%, rgba(252, 249, 244, 0) 100%)',
        }}
      />

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="[&::-webkit-scrollbar]:hidden relative z-0"
        style={wheelScrollStyle}
      >
        <div style={{ height: WHEEL_SPACER_HEIGHT, flexShrink: 0 }} />

        {items.map((label, index) => {
          const distance = Math.abs(index - selectedIndex)
          const opacity = distance === 0 ? 1 : distance === 1 ? 0.5 : 0.15
          const scale = distance === 0 ? 1 : distance === 1 ? 0.9 : 0.75
          const color = distance === 0 ? '#006a65' : '#6d7a78'
          const fontWeight = distance === 0 ? 700 : 500
          const fontSize = distance === 0 ? 18 : distance === 1 ? 16 : 14

          return (
            <div
              key={label}
              style={{
                height: WHEEL_ITEM_HEIGHT,
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
                transition: 'opacity 0.3s ease, transform 0.3s ease, color 0.3s ease',
                willChange: 'opacity, transform',
                userSelect: 'none',
              }}
            >
              {label}
            </div>
          )
        })}

        <div style={{ height: WHEEL_SPACER_HEIGHT, flexShrink: 0 }} />
      </div>
    </div>
  )
}

/* ─── Calendar Grid ─── */

const CalendarGrid = memo(function CalendarGrid({
  cells,
  selectedValue,
  baseMonth,
  baseYear,
  onSelectDay,
}: {
  cells: CalendarCell[]
  selectedValue: string
  baseMonth: number
  baseYear: number
  onSelectDay: (cell: CalendarCell) => void
}) {
  return (
    <div className="grid grid-cols-7 auto-rows-[40px]">
      {cells.map((cell) => {
        // Days from prev/next months: transparent placeholders that preserve grid offset but render no text/button
        if (cell.monthOffset !== 0) {
          return <div key={cell.key} aria-hidden="true" />
        }

        const value = formatDate(cell.day, baseMonth, baseYear)
        const isSelected = value === selectedValue

        return (
          <div key={cell.key} className="flex min-w-0 items-center justify-center">
            <button
              type="button"
              onClick={() => onSelectDay(cell)}
              className={`flex h-10 w-10 min-h-10 min-w-10 items-center justify-center rounded-full text-sm font-medium transition-colors active:scale-95 ${isSelected
                  ? 'bg-primary text-white shadow-md shadow-primary/30'
                  : 'text-on-surface hover:bg-surface-container'
                }`}
            >
              {cell.day}
            </button>
          </div>
        )
      })}
    </div>
  )
})

/* ─── Main CalendarSheet ─── */

export function CalendarSheet({ isOpen, onClose, onSelect, currentValue }: CalendarSheetProps) {
  const parsedCurrentValue = useMemo(() => parseDate(currentValue), [currentValue])
  const [currentYear, setCurrentYear] = useState(parsedCurrentValue?.year ?? CURRENT_YEAR)
  const [currentMonth, setCurrentMonth] = useState(parsedCurrentValue?.month ?? new Date().getMonth())
  const [selectedDate, setSelectedDate] = useState<ParsedDate | null>(parsedCurrentValue)
  const [direction, setDirection] = useState(0)
  const [isPickerOpen, setIsPickerOpen] = useState(false)

  // Local wheel state (only committed when user closes the picker)
  const [pickerYear, setPickerYear] = useState(currentYear)
  const [pickerMonth, setPickerMonth] = useState(currentMonth)

  useEffect(() => {
    if (!isOpen) return

    if (parsedCurrentValue) {
      setCurrentYear(parsedCurrentValue.year)
      setCurrentMonth(parsedCurrentValue.month)
      setSelectedDate(parsedCurrentValue)
      return
    }

    const today = new Date()
    setCurrentYear(today.getFullYear())
    setCurrentMonth(today.getMonth())
    setSelectedDate(null)
  }, [isOpen, parsedCurrentValue])

  const cells = useMemo(() => buildCalendarCells(currentYear, currentMonth), [currentMonth, currentYear])
  const selectedValue = selectedDate ? formatDate(selectedDate.day, selectedDate.month, selectedDate.year) : ''

  const updateDisplayedMonth = useCallback((nextYear: number, nextMonth: number, nextDirection: number) => {
    setDirection(nextDirection)
    setCurrentYear(nextYear)
    setCurrentMonth(nextMonth)
  }, [])

  const changeMonth = useCallback((delta: number) => {
    const nextDate = new Date(currentYear, currentMonth + delta, 1)
    setIsPickerOpen(false)
    updateDisplayedMonth(nextDate.getFullYear(), nextDate.getMonth(), delta)
  }, [currentMonth, currentYear, updateDisplayedMonth])

  const handleOpenPicker = useCallback(() => {
    setPickerYear(currentYear)
    setPickerMonth(currentMonth)
    setIsPickerOpen(true)
  }, [currentMonth, currentYear])

  const handlePickerConfirm = useCallback(() => {
    const yr = YEARS[pickerYear]
    const mo = pickerMonth
    const nextDirection = yr === currentYear
      ? (mo === currentMonth ? 0 : mo > currentMonth ? 1 : -1)
      : (yr > currentYear ? 1 : -1)
    setIsPickerOpen(false)
    updateDisplayedMonth(yr, mo, nextDirection)
  }, [pickerYear, pickerMonth, currentYear, currentMonth, updateDisplayedMonth])

  const handleDaySelect = useCallback((cell: CalendarCell) => {
    const nextDate = new Date(currentYear, currentMonth + cell.monthOffset, cell.day)
    const nextValue = {
      day: nextDate.getDate(),
      month: nextDate.getMonth(),
      year: nextDate.getFullYear(),
    }

    setSelectedDate(nextValue)
    updateDisplayedMonth(nextValue.year, nextValue.month, cell.monthOffset)
    onSelect(formatDate(nextValue.day, nextValue.month, nextValue.year))
  }, [currentMonth, currentYear, onSelect, updateDisplayedMonth])

  const handleCalendarDragEnd = useCallback((_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const swipePower = Math.abs(info.offset.x) * info.velocity.x

    if (swipePower < -4000) {
      changeMonth(1)
    } else if (swipePower > 4000) {
      changeMonth(-1)
    }
  }, [changeMonth])

  const title = "Дата рождения"
  const headerRight = (
    <button
      type="button"
      onClick={onClose}
      className="text-right font-headline text-sm font-bold text-primary active:opacity-70"
    >
      Готово
    </button>
  )
  return (
    <BottomSheet 
      isOpen={isOpen} 
      onClose={onClose} 
      title={title} 
      headerRight={headerRight}
      openDuration={0.45}
      closeDuration={0.35}
    >
      <div className="relative pb-5">
        {/* ── Wheel Picker Overlay (Apple-style) ── */}
        <AnimatePresence>
          {isPickerOpen && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
              className="absolute inset-0 z-20 flex flex-col bg-surface-container-lowest"
              style={{ willChange: 'transform, opacity', transform: 'translateZ(0)' }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 pb-3 pt-2">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-on-surface-variant/60">Быстрый выбор</p>
                  <h3 className="mt-0.5 font-headline text-base font-bold text-on-surface">Год и месяц</h3>
                </div>
                <button
                  type="button"
                  onClick={handlePickerConfirm}
                  className="font-headline text-sm font-bold text-primary active:opacity-70 px-3 py-1"
                >
                  Готово
                </button>
              </div>

              {/* Dual Wheel Picker */}
              <div className="flex-1 flex items-center px-5 pb-4">
                <div className="flex w-full gap-3">
                  {/* Month Wheel */}
                  <WheelColumn
                    items={MONTHS_SHORT}
                    selectedIndex={pickerMonth}
                    onChange={setPickerMonth}
                  />
                  {/* Year Wheel */}
                  <WheelColumn
                    items={YEARS.map(String)}
                    selectedIndex={pickerYear}
                    onChange={setPickerYear}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Month Navigation ── */}
        <div className="px-5">
          <div className="mb-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() => changeMonth(-1)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container text-on-surface-variant active:scale-95"
            >
              <span className="material-symbols-outlined text-[20px]">chevron_left</span>
            </button>

            <button
              type="button"
              onClick={handleOpenPicker}
              className="flex items-center gap-1.5 rounded-full px-3 py-2 active:bg-surface-container"
            >
              <span className="font-headline text-base font-bold text-on-surface">
                {MONTHS[currentMonth]} {currentYear}
              </span>
              <span className="material-symbols-outlined text-[18px] text-primary">expand_more</span>
            </button>

            <button
              type="button"
              onClick={() => changeMonth(1)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container text-on-surface-variant active:scale-95"
            >
              <span className="material-symbols-outlined text-[20px]">chevron_right</span>
            </button>
          </div>

          {/* ── Weekday Headers ── */}
          <div className="grid grid-cols-7 pb-2">
            {WEEK_DAYS.map((day) => (
              <div
                key={day}
                className="flex h-8 items-center justify-center text-[10px] font-bold uppercase tracking-[0.16em] text-on-surface-variant/55"
              >
                {day}
              </div>
            ))}
          </div>

          {/* ── Calendar Grid with swipe ── */}
          <div className="relative h-[240px] overflow-hidden">
            <AnimatePresence initial={false} custom={direction} mode="wait">
              <motion.div
                key={`${currentYear}-${currentMonth}`}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.08}
                onDragEnd={handleCalendarDragEnd}
                className="absolute inset-0"
                style={{ willChange: 'transform, opacity', transform: 'translateZ(0)' }}
              >
                <CalendarGrid
                  cells={cells}
                  selectedValue={selectedValue}
                  baseMonth={currentMonth}
                  baseYear={currentYear}
                  onSelectDay={handleDaySelect}
                />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </BottomSheet>
  )
}
