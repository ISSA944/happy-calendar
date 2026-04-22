import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useMotionValue, useTransform, animate, useDragControls } from 'framer-motion'

const SHEET_SPRING = { type: 'spring' as const, stiffness: 300, damping: 30 }
const SHEET_WILL_CHANGE = { willChange: 'transform, opacity' as const }

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
  const [mounted, setMounted] = useState(false)
  const dragY = useMotionValue(0)
  // Lifecycle progress: 0 = closed, 1 = fully open. Composed with drag fade for backdrop opacity.
  const openProgress = useMotionValue(0)
  const dragControls = useDragControls()
  const sheetRef = useRef<HTMLDivElement>(null)

  // Backdrop opacity = entry/exit progress * live drag fade — single source of truth,
  // so style.opacity smoothly lands on 0 right as AnimatePresence unmounts (no black flash).
  const backdropOpacity = useTransform(() => {
    const dragFade = Math.max(0, 1 - dragY.get() / 320)
    return openProgress.get() * dragFade
  })

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  // Body scroll lock
  useEffect(() => {
    if (!isOpen) return

    const root = document.getElementById('root')
    const savedRootPE = root?.style.pointerEvents ?? ''
    const savedBodyOverflow = document.body.style.overflow
    const savedHtmlOverflow = document.documentElement.style.overflow

    if (root) root.style.pointerEvents = 'none'
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'

    return () => {
      if (root) root.style.pointerEvents = savedRootPE
      document.body.style.overflow = savedBodyOverflow
      document.documentElement.style.overflow = savedHtmlOverflow
    }
  }, [isOpen])

  // Drive openProgress in/out synchronously with the sheet lifecycle
  useEffect(() => {
    if (isOpen) {
      dragY.set(0)
      const ctrl = animate(openProgress, 1, { duration: 0.22, ease: [0, 0, 0.2, 1] })
      return () => ctrl.stop()
    }
    const ctrl = animate(openProgress, 0, { duration: 0.4, ease: [0.32, 0.72, 0, 1] })
    return () => ctrl.stop()
  }, [isOpen, openProgress, dragY])

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
          {/*
            Overlay and sheet live inside a SINGLE AnimatePresence so React holds the DOM
            until both animations finish — no orphan black flash on unmount.
            The style.opacity is a derived motion value; exit prop sets AnimatePresence's
            unmount delay (0.4s) and openProgress drives the actual pixel fade.
          */}
          <motion.div
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40"
            style={{ opacity: backdropOpacity, willChange: 'opacity' }}
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
            exit={{ y: '100%', transition: SHEET_SPRING }}
            transition={SHEET_SPRING}
            className="relative w-full max-w-md mx-auto rounded-t-[24px] shadow-2xl flex flex-col overflow-hidden"
            style={{
              y: dragY,
              paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
              maxHeight: 'calc(100dvh - env(safe-area-inset-top) - 16px)',
              background: '#fcf9f4',
              ...SHEET_WILL_CHANGE,
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

            {/* Content pane scrolls freely — dragListener=false on sheet keeps scroll from triggering close */}
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
