import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useDragControls } from 'framer-motion'
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
              className={`flex h-10 w-10 min-h-10 min-w-10 items-center justify-center rounded-full text-sm font-medium transition-colors active:scale-95 ${
                isSelected
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

export function CalendarSheet({ isOpen, onClose, onSelect, currentValue }: CalendarSheetProps) {
  const dragControls = useDragControls()
  const parsedCurrentValue = useMemo(() => parseDate(currentValue), [currentValue])
  const [currentYear, setCurrentYear] = useState(parsedCurrentValue?.year ?? CURRENT_YEAR)
  const [currentMonth, setCurrentMonth] = useState(parsedCurrentValue?.month ?? new Date().getMonth())
  const [selectedDate, setSelectedDate] = useState<ParsedDate | null>(parsedCurrentValue)
  const [direction, setDirection] = useState(0)
  const [isPickerOpen, setIsPickerOpen] = useState(false)

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

  useEffect(() => {
    if (!isOpen) return

    const previousBodyOverflow = document.body.style.overflow
    const previousHtmlOverflow = document.documentElement.style.overflow
    const previousBodyOverscroll = document.body.style.overscrollBehavior
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'
    document.body.style.overscrollBehavior = 'none'

    return () => {
      document.body.style.overflow = previousBodyOverflow
      document.documentElement.style.overflow = previousHtmlOverflow
      document.body.style.overscrollBehavior = previousBodyOverscroll
    }
  }, [isOpen])

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

  const handleMonthSelect = useCallback((month: number) => {
    const nextDirection = month === currentMonth ? 0 : month > currentMonth ? 1 : -1
    setIsPickerOpen(false)
    updateDisplayedMonth(currentYear, month, nextDirection)
  }, [currentMonth, currentYear, updateDisplayedMonth])

  const handleYearSelect = useCallback((year: number) => {
    const nextDirection = year === currentYear ? 0 : year > currentYear ? 1 : -1
    updateDisplayedMonth(year, currentMonth, nextDirection)
  }, [currentMonth, currentYear, updateDisplayedMonth])

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

  const content = (
    <div className="fixed inset-0 z-[100]">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/55 backdrop-blur-sm"
        aria-hidden="true"
      />

      <motion.div
        drag="y"
        dragControls={dragControls}
        dragListener={false}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.18 }}
        onDragEnd={(_, info) => {
          if (info.offset.y > 72 || info.velocity.y > 320) onClose()
        }}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'tween', duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
        className="absolute bottom-0 left-0 right-0 mx-auto w-full max-w-[430px] overflow-hidden rounded-t-[28px] shadow-[0_-8px_32px_rgba(0,0,0,0.12)]"
        style={{
          paddingBottom: 'max(20px, env(safe-area-inset-bottom))',
          maxHeight: 'calc(100dvh - env(safe-area-inset-top) - 12px)',
          background: '#fcf9f4',
          willChange: 'transform',
          transform: 'translateZ(0)',
        }}
      >
        <AnimatePresence>
          {isPickerOpen && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              transition={{ duration: 0.18 }}
              className="absolute inset-0 z-20 flex flex-col rounded-t-[28px] bg-surface-container-lowest"
            >
              <div className="flex items-center justify-between border-b border-outline-variant/25 px-5 pb-4 pt-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-on-surface-variant/60">Быстрый выбор</p>
                  <h3 className="mt-1 font-headline text-lg font-bold text-on-surface">Год и месяц</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPickerOpen(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container text-primary active:scale-95"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-5 pb-5 pt-4">
                <section>
                  <p className="text-sm font-semibold text-on-surface-variant">Год</p>
                  <div className="mt-3 grid grid-cols-4 gap-2">
                    {YEARS.map((year) => (
                      <button
                        key={year}
                        type="button"
                        onClick={() => handleYearSelect(year)}
                        className={`min-h-11 rounded-2xl px-2 text-sm font-semibold transition-colors active:scale-95 ${
                          currentYear === year
                            ? 'bg-primary text-white'
                            : 'bg-surface text-on-surface-variant'
                        }`}
                      >
                        {year}
                      </button>
                    ))}
                  </div>
                </section>

                <section className="mt-5">
                  <p className="text-sm font-semibold text-on-surface-variant">Месяц</p>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {MONTHS.map((month, index) => (
                      <button
                        key={month}
                        type="button"
                        onClick={() => handleMonthSelect(index)}
                        className={`min-h-12 rounded-2xl px-3 text-sm font-semibold transition-colors active:scale-95 ${
                          currentMonth === index
                            ? 'border border-primary/30 bg-primary/10 text-primary'
                            : 'border border-outline-variant/25 bg-surface text-on-surface-variant'
                        }`}
                      >
                        {month}
                      </button>
                    ))}
                  </div>
                </section>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div
          className="touch-none select-none px-5 pb-4 pt-3"
          onPointerDown={(event) => dragControls.start(event)}
        >
          <div className="mx-auto h-1 w-10 rounded-full bg-on-surface/15" />
          <div className="mt-4 flex items-center justify-between">
            <div className="w-14" />
            <h2 className="font-headline text-lg font-bold text-on-surface">Дата рождения</h2>
            <button
              type="button"
              onClick={onClose}
              className="w-14 text-right font-headline text-sm font-bold text-primary active:opacity-70"
            >
              Готово
            </button>
          </div>
        </div>

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
              onClick={() => setIsPickerOpen(true)}
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

          <div className="relative h-[240px] overflow-hidden">
            <AnimatePresence initial={false} custom={direction} mode="wait">
              <motion.div
                key={`${currentYear}-${currentMonth}`}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.18, ease: [0.32, 0.72, 0, 1] }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.08}
                onDragEnd={handleCalendarDragEnd}
                className="absolute inset-0"
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
      </motion.div>
    </div>
  )

  return createPortal(content, document.body)
}
