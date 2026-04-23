import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useMotionValue, animate, useDragControls } from 'framer-motion'

/**
 * Unified bottom-sheet wrapper used by every modal in the app
 * (MoodSheet, TimePickerSheet, CalendarSheet).
 *
 * Rules enforced here so every sheet behaves identically:
 *  - Enters from the bottom: initial y:"100%" → animate y:0
 *  - Exits to the bottom:    exit y:"100%"
 *  - iOS-style spring:       stiffness 300, damping 30
 *  - Backdrop fades in/out:  initial 0 → animate 1 → exit 0 (no black flash)
 *  - Drag-to-close only via the top pill (dragListener=false on the sheet body).
 */

const SHEET_SPRING = { type: 'spring' as const, stiffness: 300, damping: 30 }
const BACKDROP_FADE = { duration: 0.22, ease: [0.32, 0.72, 0, 1] as const }

export interface BottomSheetProps {
  isOpen: boolean
  onClose: () => void
  children: ReactNode
  title?: ReactNode
  headerRight?: ReactNode
  hideDragIndicator?: boolean
}

export function BottomSheet({
  isOpen,
  onClose,
  children,
  title,
  headerRight,
  hideDragIndicator = false,
}: BottomSheetProps) {
  const [mounted] = useState(() => typeof document !== 'undefined')
  const dragY = useMotionValue(0)
  const dragControls = useDragControls()
  const sheetRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return

    const savedBodyOverflow = document.body.style.overflow
    const savedHtmlOverflow = document.documentElement.style.overflow
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'
    dragY.set(0)

    return () => {
      document.body.style.overflow = savedBodyOverflow
      document.documentElement.style.overflow = savedHtmlOverflow
    }
  }, [isOpen, dragY])

  if (!mounted) return null

  const handleDragEnd = (_: unknown, info: { offset: { y: number }; velocity: { y: number } }) => {
    if (info.offset.y > 100 || info.velocity.y > 400) {
      onClose()
    } else {
      animate(dragY, 0, SHEET_SPRING)
    }
  }

  const content = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex flex-col justify-end">
          {/* Backdrop — fade in/out inside the same AnimatePresence as the sheet so it
              never yanks off-screen mid-frame (kills the "black flash" on close). */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={BACKDROP_FADE}
            onClick={onClose}
            className="absolute inset-0 bg-black/40"
            style={{ willChange: 'opacity' }}
            aria-hidden="true"
          />

          <motion.div
            ref={sheetRef}
            drag="y"
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 1 }}
            dragMomentum={false}
            onDragEnd={handleDragEnd}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={SHEET_SPRING}
            className="relative w-full max-w-md mx-auto rounded-t-[24px] shadow-2xl flex flex-col overflow-hidden"
            style={{
              y: dragY,
              paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
              maxHeight: 'calc(100dvh - env(safe-area-inset-top) - 16px)',
              background: '#fcf9f4',
              willChange: 'transform, opacity',
            }}
          >
            {/* Drag handle zone — ONLY this area can initiate drag-to-close */}
            <div
              onPointerDown={(e) => dragControls.start(e)}
              className="px-6 pt-3 pb-4 select-none cursor-grab active:cursor-grabbing touch-none"
              style={{ paddingBottom: title || headerRight ? '10px' : '16px' }}
            >
              {!hideDragIndicator && (
                <div className="w-9 h-[5px] bg-on-surface-variant/25 rounded-full mx-auto mb-3" />
              )}
              {(title || headerRight) && (
                <div className="flex justify-between items-center mt-1">
                  <div className="flex-1">
                    {typeof title === 'string' ? (
                      <h2 className="font-headline text-lg font-bold text-on-surface">{title}</h2>
                    ) : (
                      title
                    )}
                  </div>
                  {headerRight && (
                    <div className="flex-shrink-0" onPointerDown={(e) => e.stopPropagation()}>
                      {headerRight}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Content scrolls freely; dragListener=false on the sheet keeps scroll from triggering close. */}
            <div
              className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden"
              style={{ touchAction: 'pan-y', WebkitOverflowScrolling: 'touch' }}
            >
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )

  return createPortal(content, document.body)
}
