import { memo, useCallback, useMemo, useState } from 'react'
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
// Grid picker defaults: per design spec, picker always opens on 2026 / Январь when nothing is committed.
const PICKER_DEFAULT_YEAR = 2026
const PICKER_DEFAULT_MONTH = 0
const PICKER_MIN_YEAR = 1900
const PICKER_MAX_YEAR = new Date().getFullYear()

const slideVariants: Variants = {
  enter: (direction: number) => ({ x: direction > 0 ? 20 : -20, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({ x: direction < 0 ? 20 : -20, opacity: 0 }),
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

/* ─── Grid Month/Year Picker (replaces WheelColumn) ─── */

const GridMonthPicker = memo(function GridMonthPicker({
  pickerYear,
  pickerMonth,
  onYearChange,
  onMonthChange,
  onConfirm,
}: {
  pickerYear: number
  pickerMonth: number
  onYearChange: (year: number) => void
  onMonthChange: (month: number) => void
  onConfirm: () => void
}) {
  const canDecrement = pickerYear > PICKER_MIN_YEAR
  const canIncrement = pickerYear < PICKER_MAX_YEAR

  return (
    <div className="flex h-full flex-col">
      {/* Picker Header — mirrors BottomSheet's title + headerRight pattern */}
      <div className="flex items-center justify-between px-6 pt-6 pb-4">
        <h2 className="font-headline text-lg font-bold text-on-surface">Выберите месяц и год</h2>
        <button
          type="button"
          onClick={onConfirm}
          className="font-headline text-sm font-bold text-primary active:opacity-70"
        >
          Готово
        </button>
      </div>

      <div className="flex-1 px-6">
        {/* Year selector with arrows */}
        <div className="mb-6 flex items-center justify-between rounded-2xl bg-white p-2 shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-surface-variant/30">
          <button
            type="button"
            disabled={!canDecrement}
            onClick={() => canDecrement && onYearChange(pickerYear - 1)}
            className={`flex h-11 w-11 items-center justify-center rounded-full transition-colors active:scale-95 ${
              canDecrement ? 'text-primary hover:bg-surface-container' : 'text-on-surface-variant/30 cursor-not-allowed'
            }`}
            aria-label="Предыдущий год"
          >
            <span className="material-symbols-outlined text-[22px]">chevron_left</span>
          </button>

          <span className="font-headline text-xl font-bold text-primary tabular-nums select-none">
            {pickerYear}
          </span>

          <button
            type="button"
            disabled={!canIncrement}
            onClick={() => canIncrement && onYearChange(pickerYear + 1)}
            className={`flex h-11 w-11 items-center justify-center rounded-full transition-colors active:scale-95 ${
              canIncrement ? 'text-primary hover:bg-surface-container' : 'text-on-surface-variant/30 cursor-not-allowed'
            }`}
            aria-label="Следующий год"
          >
            <span className="material-symbols-outlined text-[22px]">chevron_right</span>
          </button>
        </div>

        {/* Months grid 3x4 */}
        <div className="grid grid-cols-3 gap-3">
          {MONTHS.map((label, index) => {
            const isSelected = index === pickerMonth
            return (
              <button
                key={label}
                type="button"
                onClick={() => onMonthChange(index)}
                className={`py-3.5 rounded-2xl font-body text-sm transition-colors active:scale-[0.97] ${
                  isSelected
                    ? 'bg-primary text-white font-bold shadow-md shadow-primary/20'
                    : 'bg-surface-container-low text-on-surface font-medium hover:bg-surface-container'
                }`}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Done button */}
      <div className="px-6 pt-6 pb-2">
        <button
          type="button"
          onClick={onConfirm}
          className="w-full h-14 rounded-2xl bg-gradient-to-r from-primary-container to-primary text-white font-headline font-bold text-base shadow-lg shadow-primary/20 active:scale-[0.98] transition-transform"
        >
          Готово
        </button>
      </div>
    </div>
  )
})

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
  // Block future dates — birthdates can't be in the future.
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return (
    <div className="grid grid-cols-7 auto-rows-[40px]">
      {cells.map((cell) => {
        // Days from prev/next months: transparent placeholders that preserve grid offset but render no text/button
        if (cell.monthOffset !== 0) {
          return <div key={cell.key} aria-hidden="true" />
        }

        const value = formatDate(cell.day, baseMonth, baseYear)
        const isSelected = value === selectedValue
        const cellDate = new Date(baseYear, baseMonth, cell.day)
        const isFuture = cellDate.getTime() > today.getTime()

        return (
          <div key={cell.key} className="flex min-w-0 items-center justify-center">
            <button
              type="button"
              disabled={isFuture}
              onClick={() => !isFuture && onSelectDay(cell)}
              className={`flex h-10 w-10 min-h-10 min-w-10 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                isFuture
                  ? 'text-on-surface-variant/25 cursor-not-allowed'
                  : isSelected
                    ? 'bg-primary text-white shadow-md shadow-primary/30 active:scale-95'
                    : 'text-on-surface hover:bg-surface-container active:scale-95'
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
    >
      <CalendarSheetContent
        key={currentValue || '__empty__'}
        currentValue={currentValue}
        onSelect={onSelect}
      />
    </BottomSheet>
  )
}

function CalendarSheetContent({
  currentValue,
  onSelect,
}: Pick<CalendarSheetProps, 'currentValue' | 'onSelect'>) {
  const parsedCurrentValue = useMemo(() => parseDate(currentValue), [currentValue])
  const [currentYear, setCurrentYear] = useState(parsedCurrentValue?.year ?? PICKER_DEFAULT_YEAR)
  const [currentMonth, setCurrentMonth] = useState(parsedCurrentValue?.month ?? PICKER_DEFAULT_MONTH)
  const [selectedDate, setSelectedDate] = useState<ParsedDate | null>(parsedCurrentValue)
  const [direction, setDirection] = useState(0)
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const [disableSlideAnimation, setDisableSlideAnimation] = useState(false)

  // Grid picker draft state (committed only on "Готово" click)
  const [pickerYear, setPickerYear] = useState(parsedCurrentValue?.year ?? PICKER_DEFAULT_YEAR)
  const [pickerMonth, setPickerMonth] = useState(parsedCurrentValue?.month ?? PICKER_DEFAULT_MONTH)

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
    setDisableSlideAnimation(true)
    setIsPickerOpen(false)
    updateDisplayedMonth(pickerYear, pickerMonth, 0)
  }, [pickerYear, pickerMonth, updateDisplayedMonth])

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

  return (
    <div className="relative pb-5">
      {/* ── Full-cover Grid Picker Overlay (covers BottomSheet header) ── */}
      <AnimatePresence>
        {isPickerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="fixed inset-x-0 top-0 z-[110] flex flex-col mx-auto w-full max-w-md landscape:max-w-xl"
            style={{
              // Use padding-top instead of margin-top to avoid layout shift on safe-area resolve.
              height: '100dvh',
              paddingTop: 'env(safe-area-inset-top)',
              background: '#fcf9f4',
              paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
              willChange: 'opacity',
              transform: 'translateZ(0)',
            }}
          >
            <GridMonthPicker
              pickerYear={pickerYear}
              pickerMonth={pickerMonth}
              onYearChange={setPickerYear}
              onMonthChange={setPickerMonth}
              onConfirm={handlePickerConfirm}
            />
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
          <AnimatePresence
            initial={false}
            custom={direction}
            onExitComplete={() => setDisableSlideAnimation(false)}
          >
            <motion.div
              key={`${currentYear}-${currentMonth}`}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={disableSlideAnimation ? { duration: 0 } : { duration: 0.16, ease: 'easeOut' }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.05}
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
  )
}
