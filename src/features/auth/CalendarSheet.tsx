import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence, useDragControls } from 'framer-motion'
import type { Variants } from 'framer-motion'

interface CalendarSheetProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (dateStr: string) => void
  currentValue: string
}

const MONTHS = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь']

function isLeapYear(year: number) {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
}

function getDaysInMonth(year: number, monthIndex: number) {
  const days = [31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
  return days[monthIndex]
}

export function CalendarSheet({ isOpen, onClose, onSelect, currentValue }: CalendarSheetProps) {
  const sheetDragControls = useDragControls()

  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear())
  const [currentMonth, setCurrentMonth] = useState(() => new Date().getMonth())
  const [direction, setDirection] = useState(0)
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null)
  const [selectedYear, setSelectedYear] = useState<number | null>(null)

  // Body scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const [isQuickPickerOpen, setIsQuickPickerOpen] = useState(false)

  // Sync state to parsed currentValue string "15.08.1995"
  useEffect(() => {
    if (isOpen && currentValue && currentValue.length === 10) {
      const parts = currentValue.split('.')
      if (parts.length === 3) {
        const d = parseInt(parts[0], 10)
        const m = parseInt(parts[1], 10) - 1
        const y = parseInt(parts[2], 10)
        if (!isNaN(d) && !isNaN(m) && !isNaN(y)) {
          setSelectedDay(d)
          setSelectedMonth(m)
          setSelectedYear(y)
          setCurrentMonth(m)
          setCurrentYear(y)
        }
      }
    }
  }, [isOpen, currentValue])

  const { days, prevMonthDays } = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1).getDay()
    const startOffset = firstDay === 0 ? 6 : firstDay - 1

    let prevYear = currentYear
    let prevMonth = currentMonth - 1
    if (prevMonth < 0) {
      prevMonth = 11
      prevYear -= 1
    }
    const daysInPrevMonth = getDaysInMonth(prevYear, prevMonth)
    const trailingPrevDays = Array.from({ length: startOffset }, (_, i) => daysInPrevMonth - startOffset + i + 1)
    const totalDays = getDaysInMonth(currentYear, currentMonth)
    const currentDaysObj = Array.from({ length: totalDays }, (_, i) => i + 1)

    return { days: currentDaysObj, prevMonthDays: trailingPrevDays }
  }, [currentYear, currentMonth])

  const handlePrevMonth = () => {
    setDirection(-1)
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear(y => y - 1)
    } else {
      setCurrentMonth(m => m - 1)
    }
  }

  const handleNextMonth = () => {
    setDirection(1)
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear(y => y + 1)
    } else {
      setCurrentMonth(m => m + 1)
    }
  }

  const swipeConfidenceThreshold = 10000
  const swipePower = (offset: number, velocity: number) => Math.abs(offset) * velocity

  const handleCalendarDragEnd = (_e: any, { offset, velocity }: any) => {
    const swipe = swipePower(offset.x, velocity.x)
    if (swipe < -swipeConfidenceThreshold) handleNextMonth()
    else if (swipe > swipeConfidenceThreshold) handlePrevMonth()
  }

  const handleDaySelect = (d: number) => {
    setSelectedDay(d)
    setSelectedMonth(currentMonth)
    setSelectedYear(currentYear)
    const dd = String(d).padStart(2, '0')
    const mm = String(currentMonth + 1).padStart(2, '0')
    onSelect(`${dd}.${mm}.${currentYear}`)
  }

  const leadingNextDays = Array.from({ length: 42 - (prevMonthDays.length + days.length) }, (_, i) => i + 1)

  const slideVariants: Variants = {
    enter: (direction: number) => ({ x: direction > 0 ? 300 : -300, opacity: 0 }),
    center: { zIndex: 1, x: 0, opacity: 1 },
    exit: (direction: number) => ({ zIndex: 0, x: direction < 0 ? 300 : -300, opacity: 0 }),
  }

  const years = Array.from({ length: 110 }, (_, i) => 2026 - i)

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* Dark Overlay — touch-none prevents background scroll bleed */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, transition: { duration: 0.15, ease: 'easeIn' } }}
        transition={{ duration: 0.3 }}
        className="absolute inset-0 bg-black/50 cursor-pointer touch-none"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Bottom Sheet */}
      <motion.div
        drag="y"
        dragControls={sheetDragControls}
        dragListener={false}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.2 }}
        onDragEnd={(_, { offset, velocity }) => {
          if (offset.y > 50 || velocity.y > 200) onClose()
        }}
        initial={{ y: '100%' }}
        animate={{ y: 0, transition: { type: 'spring', damping: 25, stiffness: 200 } }}
        exit={{ y: '100%', transition: { duration: 0.15, ease: 'easeIn' } }}
        className="relative bg-surface-container-lowest rounded-t-[24px] shadow-[0_-8px_40px_rgba(0,0,0,0.12)] flex flex-col w-full max-w-[390px] mx-auto z-20 min-h-[520px]"
        style={{ paddingBottom: 'max(24px, env(safe-area-inset-bottom))', willChange: 'transform' }}
      >
        {/* Quick Picker Overlay */}
        <AnimatePresence>
          {isQuickPickerOpen && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute inset-0 z-30 bg-surface-container-lowest rounded-t-[24px] flex flex-col p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-headline font-bold text-xl text-on-surface">Выберите год и месяц</h3>
                <button 
                  onClick={() => setIsQuickPickerOpen(false)}
                  className="w-10 h-10 flex items-center justify-center bg-surface-container rounded-full text-primary"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="flex-1 flex flex-col gap-6 overflow-hidden">
                {/* Year List */}
                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar px-1 shrink-0">
                  {years.map(y => (
                    <button
                      key={y}
                      onClick={() => setCurrentYear(y)}
                      className={`flex-shrink-0 px-5 py-2.5 rounded-2xl text-[15px] font-bold transition-all ${
                        currentYear === y 
                        ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                        : 'bg-surface-container text-on-surface-variant'
                      }`}
                    >
                      {y}
                    </button>
                  ))}
                </div>

                {/* Month Grid */}
                <div className="grid grid-cols-3 gap-3 overflow-y-auto pr-1 flex-1">
                  {MONTHS.map((m, i) => (
                    <button
                      key={m}
                      onClick={() => {
                        setCurrentMonth(i)
                        setIsQuickPickerOpen(false)
                      }}
                      className={`h-14 rounded-2xl text-sm font-bold transition-all ${
                        currentMonth === i 
                        ? 'bg-primary/10 text-primary border-2 border-primary/20' 
                        : 'bg-surface text-on-surface-variant border border-outline-variant/30'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Drag zone: pill + header — wide grab area */}
        <div
          className="touch-none select-none cursor-grab"
          onPointerDown={(e) => sheetDragControls.start(e)}
        >
          {/* Handle pill */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-12 h-1.5 bg-surface-variant rounded-full" />
          </div>

          {/* Title Header */}
          <div className="flex items-center justify-between px-6 py-3">
            <div className="w-16" />
            <h2 className="text-on-surface font-headline font-bold text-xl">Выберите дату</h2>
            <button
              onClick={onClose}
              className="w-16 text-primary font-headline font-bold text-right text-base hover:opacity-80 transition-opacity pointer-events-auto"
            >
              Готово
            </button>
          </div>
        </div>

        {/* Calendar Body — outside drag zone so inner x-drag works */}
        <div className="px-6 pb-6 pt-2">
          {/* Month/Year Selector */}
          <div className="flex items-center justify-between mb-6 px-2">
            <button
              onClick={handlePrevMonth}
              className="w-10 h-10 flex items-center justify-center bg-surface-container rounded-full text-on-surface-variant hover:bg-surface-variant transition-colors active:scale-95"
            >
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            <button 
              onClick={() => setIsQuickPickerOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-surface-container transition-colors active:scale-95"
            >
              <span className="text-on-surface font-headline font-bold text-lg">{MONTHS[currentMonth]} {currentYear}</span>
              <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>expand_more</span>
            </button>
            <button
              onClick={handleNextMonth}
              className="w-10 h-10 flex items-center justify-center bg-surface-container rounded-full text-on-surface-variant hover:bg-surface-variant transition-colors active:scale-95"
            >
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>

          {/* Day-of-week headers */}
          <div className="grid grid-cols-7 text-center mb-4 border-b border-outline-variant/10 pb-2">
            {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(dayName => (
              <div key={dayName} className="text-on-surface-variant text-[11px] font-bold uppercase tracking-widest py-1">
                {dayName}
              </div>
            ))}
          </div>

          {/* Calendar grid with horizontal swipe for month navigation */}
          <div className="relative overflow-hidden min-h-[224px]">
            <AnimatePresence initial={false} custom={direction} mode="popLayout">
              <motion.div
                key={`${currentYear}-${currentMonth}`}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ x: { type: 'spring', stiffness: 300, damping: 30 }, opacity: { duration: 0.2 } }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={1}
                onDragEnd={handleCalendarDragEnd}
                className="grid grid-cols-7 gap-y-2 text-center absolute top-0 w-full"
              >
                {prevMonthDays.map((d, i) => (
                  <div key={`prev-${i}`} className="py-2 text-surface-variant text-sm font-medium flex items-center justify-center">
                    {d}
                  </div>
                ))}

                {days.map(d => {
                  const isSelected = selectedDay === d && selectedMonth === currentMonth && selectedYear === currentYear
                  if (isSelected) {
                    return (
                      <button
                        key={`cur-${d}`}
                        className="bg-primary text-on-primary font-bold text-sm rounded-full aspect-square flex items-center justify-center shadow-[0_4px_12px_rgba(47,167,160,0.3)] transform scale-110 relative z-10"
                      >
                        {d}
                      </button>
                    )
                  }
                  return (
                    <button
                      key={`cur-${d}`}
                      onClick={() => handleDaySelect(d)}
                      className="py-2 text-on-surface text-sm font-medium hover:bg-surface-container active:scale-95 transition-all rounded-full aspect-square flex items-center justify-center relative z-10"
                    >
                      {d}
                    </button>
                  )
                })}

                {leadingNextDays.map((d, i) => (
                  <div key={`next-${i}`} className="py-2 text-surface-variant text-sm font-medium flex items-center justify-center">
                    {d}
                  </div>
                ))}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
