import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useMotionValue, useTransform, animate } from 'framer-motion'

export interface BottomSheetProps {
  isOpen: boolean
  onClose: () => void
  children: ReactNode
  title?: ReactNode
  headerRight?: ReactNode
  hideDragIndicator?: boolean
  /** Duration (seconds) for the sheet to fully appear. Default 0.55 */
  openDuration?: number
  /** Duration (seconds) for the sheet to fully hide. Default 0.4 */
  closeDuration?: number
}

/**
 * Premium BottomSheet with iOS-style push-back depth effect.
 *
 * Design pillars:
 *  1. Sheet slides up with a *decelerating* cubic-bezier — fast initial response,
 *     long, silky tail.  This is the "butter" feel.
 *  2. Background dims with matched timing so both layers breathe together.
 *  3. Drag-to-dismiss uses 1:1 finger tracking (dragElastic 1) with a mild
 *     spring snap-back if the user doesn't cross the dismiss threshold.
 *  4. The #root element scales down & rounds its corners while the sheet is
 *     open, producing the iOS "stacked card" depth illusion.
 *  5. backdrop-filter: blur is intentionally omitted — it causes frame-drops
 *     on low-end Android devices. The dim + scale effect provides the same
 *     visual separation at zero GPU cost.
 */
export function BottomSheet({
  isOpen,
  onClose,
  children,
  title,
  headerRight,
  hideDragIndicator = false,
  openDuration = 0.55,
  closeDuration = 0.4,
}: BottomSheetProps) {
  const [mounted, setMounted] = useState(false)

  // ── Drag state ──
  const dragY = useMotionValue(0)
  const sheetRef = useRef<HTMLDivElement>(null)
  const dragHandleRef = useRef<HTMLDivElement>(null)

  // Overlay opacity follows drag: 1 at rest → 0 at 400px drag
  const overlayOpacity = useTransform(dragY, [0, 400], [1, 0.15])

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  // ── iOS push-back effect ──
  useEffect(() => {
    if (!isOpen) return

    const root = document.getElementById('root')
    const savedPointerEvents = root?.style.pointerEvents ?? ''
    const savedUserSelect = root?.style.userSelect ?? ''
    const savedBodyOverflow = document.body.style.overflow
    const savedHtmlOverflow = document.documentElement.style.overflow
    const savedBodyBg = document.body.style.backgroundColor
    const savedHtmlBg = document.documentElement.style.backgroundColor

    // Push the root "into the background"
    if (root) {
      root.style.pointerEvents = 'none'
      root.style.userSelect = 'none'
      root.style.transition = [
        `transform ${openDuration}s cubic-bezier(0.32, 0.72, 0, 1)`,
        `border-radius ${openDuration}s cubic-bezier(0.32, 0.72, 0, 1)`,
      ].join(', ')
      root.style.transform = 'scale(0.92) translateY(10px)'
      root.style.borderRadius = '22px'
      root.style.overflow = 'hidden'
      root.style.transformOrigin = 'center top'
    }
    document.body.style.backgroundColor = '#000'
    document.documentElement.style.backgroundColor = '#000'
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'

    return () => {
      if (root) {
        root.style.pointerEvents = savedPointerEvents
        root.style.userSelect = savedUserSelect
        root.style.transition = [
          `transform ${closeDuration}s cubic-bezier(0.32, 0.72, 0, 1)`,
          `border-radius ${closeDuration}s cubic-bezier(0.32, 0.72, 0, 1)`,
        ].join(', ')
        root.style.transform = 'scale(1) translateY(0)'
        root.style.borderRadius = '0px'

        const dur = closeDuration * 1000 + 60
        setTimeout(() => {
          // Clean up inline styles once the close transition finishes
          if (root.style.transform === 'scale(1) translateY(0)') {
            root.style.transition = ''
            root.style.overflow = ''
            root.style.transformOrigin = ''
          }
        }, dur)
      }
      document.body.style.backgroundColor = savedBodyBg
      document.documentElement.style.backgroundColor = savedHtmlBg
      document.body.style.overflow = savedBodyOverflow
      document.documentElement.style.overflow = savedHtmlOverflow
    }
  }, [isOpen, openDuration, closeDuration])

  if (!mounted) return null

  /* ── Easing curves ──
   * "Decelerate" = fast start, very long silky tail.
   * This is the single biggest thing that makes a sheet feel premium vs. cheap.
   */
  const ease: [number, number, number, number] = [0.32, 0.72, 0, 1]

  const handleDragEnd = (_: unknown, info: { offset: { y: number }; velocity: { y: number } }) => {
    if (info.offset.y > 100 || info.velocity.y > 400) {
      onClose()
    } else {
      // Snap back with a soft spring
      animate(dragY, 0, { type: 'spring', stiffness: 300, damping: 28 })
    }
  }

  const content = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex flex-col justify-end">
          {/* ── Backdrop ── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: openDuration, ease }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50 cursor-pointer touch-none"
            style={{
              opacity: overlayOpacity,
              willChange: 'opacity',
              transform: 'translateZ(0)',
            }}
            aria-hidden="true"
          />

          <motion.div
            ref={sheetRef}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 1 }}
            dragMomentum={false}
            onDragEnd={handleDragEnd}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%', transition: { duration: closeDuration, ease } }}
            transition={{ duration: openDuration, ease }}
            className="relative w-full max-w-[430px] mx-auto rounded-t-[24px] shadow-2xl flex flex-col overflow-hidden"
            style={{
              y: dragY,
              paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
              maxHeight: 'calc(100dvh - env(safe-area-inset-top) - 16px)',
              background: '#fcf9f4',
              willChange: 'transform',
              touchAction: 'none',
            }}
          >
            {/* ── Drag handle zone ── */}
            <div
              ref={dragHandleRef}
              className="px-6 pt-3 pb-4 touch-none select-none cursor-grab active:cursor-grabbing"
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
                  {headerRight && <div className="flex-shrink-0">{headerRight}</div>}
                </div>
              )}
            </div>

            {/* Inner Content Container */}
            <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )

  return createPortal(content, document.body)
}
