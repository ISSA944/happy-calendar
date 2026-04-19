import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useMotionValue, animate } from 'framer-motion'

export interface BottomSheetProps {
  isOpen: boolean
  onClose: () => void
  children: ReactNode
  title?: ReactNode
  headerRight?: ReactNode
  hideDragIndicator?: boolean
}

/**
 * Lightweight BottomSheet optimised for 60 fps on low-end mobile.
 *
 * Performance rules applied:
 *  - NO scale transforms on #root (kills compositing on weak GPUs)
 *  - NO backdrop-filter blur (Chrome Android drops to 20 fps)
 *  - Only opacity + translateY are animated (cheapest GPU ops)
 *  - Drag uses useMotionValue for zero-React-render finger tracking
 *  - will-change is scoped to only the two animated properties
 */
export function BottomSheet({
  isOpen,
  onClose,
  children,
  title,
  headerRight,
  hideDragIndicator = false,
}: BottomSheetProps) {
  const [mounted, setMounted] = useState(false)
  const dragY = useMotionValue(0)
  const sheetRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  // Lock body scroll while sheet is open
  useEffect(() => {
    if (!isOpen) return

    const root = document.getElementById('root')
    const savedRootPE = root?.style.pointerEvents ?? ''
    const savedBodyOverflow = document.body.style.overflow
    const savedHtmlOverflow = document.documentElement.style.overflow

    if (root) {
      root.style.pointerEvents = 'none'
    }
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'

    return () => {
      if (root) root.style.pointerEvents = savedRootPE
      document.body.style.overflow = savedBodyOverflow
      document.documentElement.style.overflow = savedHtmlOverflow
    }
  }, [isOpen])

  if (!mounted) return null

  // Decelerate curve: fast response, long silky tail
  const ease: [number, number, number, number] = [0.32, 0.72, 0, 1]

  const handleDragEnd = (_: unknown, info: { offset: { y: number }; velocity: { y: number } }) => {
    if (info.offset.y > 100 || info.velocity.y > 400) {
      onClose()
    } else {
      animate(dragY, 0, { type: 'spring', stiffness: 300, damping: 30 })
    }
  }

  const content = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex flex-col justify-end">
          {/* Backdrop — opacity only, no blur, no scale */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 touch-none"
            style={{ willChange: 'opacity' }}
            aria-hidden="true"
          />

          {/* Sheet panel */}
          <motion.div
            ref={sheetRef}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 1 }}
            dragMomentum={false}
            onDragEnd={handleDragEnd}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%', transition: { duration: 0.3, ease } }}
            transition={{ duration: 0.45, ease }}
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
            {/* Drag handle */}
            <div
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
