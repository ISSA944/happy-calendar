import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useDragControls } from 'framer-motion'

const SHEET_TRANSITION = { duration: 0.35, ease: [0.32, 0.72, 0, 1] as const }
const BACKDROP_FADE    = { duration: 0.22, ease: [0.32, 0.72, 0, 1] as const }

export interface BottomSheetProps {
  isOpen: boolean
  onClose: () => void
  children: ReactNode
  title?: ReactNode
  headerRight?: ReactNode
  hideDragIndicator?: boolean
  /** When false, disables swipe-to-close — sheet closes only via buttons. Default: true */
  draggable?: boolean
}

export function BottomSheet({
  isOpen,
  onClose,
  children,
  title,
  headerRight,
  hideDragIndicator = false,
  draggable = true,
}: BottomSheetProps) {
  const [mounted] = useState(() => typeof document !== 'undefined')
  const dragControls = useDragControls()
  const sheetRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return
    const savedBodyOverflow = document.body.style.overflow
    const savedHtmlOverflow = document.documentElement.style.overflow
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = savedBodyOverflow
      document.documentElement.style.overflow = savedHtmlOverflow
    }
  }, [isOpen])

  if (!mounted) return null

  const handleDragEnd = (_: unknown, info: { offset: { y: number }; velocity: { y: number } }) => {
    if (info.offset.y > 100 || info.velocity.y > 400) {
      onClose()
    }
  }

  const dragProps = draggable
    ? {
        drag: 'y' as const,
        dragControls,
        dragListener: false,
        dragConstraints: { top: 0, bottom: 0 },
        dragElastic: { top: 0, bottom: 0.6 },
        dragMomentum: false,
        dragTransition: { bounceStiffness: 300, bounceDamping: 40 },
        onDragEnd: handleDragEnd,
      }
    : {}

  const content = (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="hc-backdrop"
            className="fixed inset-0 bg-black/40"
            style={{ zIndex: 100, willChange: 'opacity' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={BACKDROP_FADE}
            onClick={onClose}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="hc-sheet"
            ref={sheetRef}
            {...dragProps}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={SHEET_TRANSITION}
            className="fixed inset-x-0 bottom-0 mx-auto w-full max-w-md rounded-t-[24px] shadow-2xl flex flex-col overflow-hidden max-h-[calc(100dvh-env(safe-area-inset-top)-1rem)] landscape:max-h-[85vh]"
            style={{
              zIndex: 101,
              paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
              background: '#fcf9f4',
              willChange: 'transform',
            }}
          >
            {/* Header zone — drag handle + title/actions */}
            <div
              onPointerDown={draggable ? (e) => dragControls.start(e) : undefined}
              className={`px-6 pt-3 pb-4 select-none touch-none ${draggable ? 'cursor-grab active:cursor-grabbing' : ''}`}
              style={{ paddingBottom: title || headerRight ? '10px' : '16px' }}
            >
              {!hideDragIndicator && draggable && (
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

            <div
              className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden"
              style={{ touchAction: 'pan-y', WebkitOverflowScrolling: 'touch' }}
            >
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )

  return createPortal(content, document.body)
}
