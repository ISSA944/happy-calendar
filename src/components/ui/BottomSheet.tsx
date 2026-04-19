import { useEffect, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useDragControls } from 'framer-motion'

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
  const dragControls = useDragControls()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  useEffect(() => {
    if (!isOpen) return

    const root = document.getElementById('root')
    const originalRootPointerEvents = root ? root.style.pointerEvents : ''
    const originalRootUserSelect = root ? root.style.userSelect : ''
    const originalBodyOverflow = document.body.style.overflow
    const originalHtmlOverflow = document.documentElement.style.overflow

    // Hard lock background
    if (root) {
      root.style.pointerEvents = 'none'
      root.style.userSelect = 'none'
    }
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'

    return () => {
      if (root) {
        root.style.pointerEvents = originalRootPointerEvents
        root.style.userSelect = originalRootUserSelect
      }
      document.body.style.overflow = originalBodyOverflow
      document.documentElement.style.overflow = originalHtmlOverflow
    }
  }, [isOpen])

  if (!mounted) return null

  const content = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex flex-col justify-end">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.35, ease: [0.32, 0.72, 0, 1] } }}
            transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
            onClick={onClose}
            className="absolute inset-0 bg-black/55 cursor-pointer touch-none"
            style={{
              willChange: 'opacity',
              transform: 'translateZ(0)',
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
            }}
            aria-hidden="true"
          />

          <motion.div
            drag="y"
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.15 }}
            onDragEnd={(_, { offset, velocity }) => {
              if (offset.y > 60 || velocity.y > 250) onClose()
            }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%', transition: { type: 'tween', duration: 0.35, ease: [0.32, 0.72, 0, 1] } }}
            transition={{ type: 'tween', duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
            className="relative w-full max-w-[430px] mx-auto rounded-t-[28px] shadow-2xl flex flex-col overflow-hidden"
            style={{
              paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
              maxHeight: 'calc(100dvh - env(safe-area-inset-top) - 12px)',
              background: '#fcf9f4',
              willChange: 'transform, opacity',
              transform: 'translateZ(0)',
              touchAction: 'none',
            }}
          >
            <div
              className="px-6 pt-4 pb-3 touch-none select-none cursor-grab"
              onPointerDown={(e) => dragControls.start(e)}
            >
              {!hideDragIndicator && (
                <div className="w-10 h-1 bg-on-surface/15 rounded-full mx-auto mb-4" />
              )}
              {(title || headerRight) && (
                <div className="flex justify-between items-center mt-2">
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
            <div className="flex flex-col flex-1 overflow-y-auto">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )

  return createPortal(content, document.body)
}
