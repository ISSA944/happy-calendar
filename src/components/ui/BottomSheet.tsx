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
  openDuration?: number
  closeDuration?: number
}

export function BottomSheet({
  isOpen,
  onClose,
  children,
  title,
  headerRight,
  hideDragIndicator = false,
  openDuration = 0.4,
  closeDuration = 0.35,
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
    const originalBodyBg = document.body.style.backgroundColor
    const originalHtmlBg = document.documentElement.style.backgroundColor

    // Hard lock background and apply Apple iOS 3D Push-Back effect
    if (root) {
      root.style.pointerEvents = 'none'
      root.style.userSelect = 'none'
      root.style.transition = `transform ${openDuration}s cubic-bezier(0.32, 0.72, 0, 1), border-radius ${openDuration}s cubic-bezier(0.32, 0.72, 0, 1)`
      root.style.transform = 'scale(0.93) translateY(8px)'
      root.style.borderRadius = '24px'
      root.style.overflow = 'hidden'
      root.style.transformOrigin = 'center top'
    }
    document.body.style.backgroundColor = '#000'
    document.documentElement.style.backgroundColor = '#000'
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'

    return () => {
      if (root) {
        root.style.pointerEvents = originalRootPointerEvents
        root.style.userSelect = originalRootUserSelect
        root.style.transition = `transform ${closeDuration}s cubic-bezier(0.32, 0.72, 0, 1), border-radius ${closeDuration}s cubic-bezier(0.32, 0.72, 0, 1)`
        root.style.transform = 'scale(1) translateY(0)'
        root.style.borderRadius = '0px'
        
        setTimeout(() => {
          if (root.style.transform === 'scale(1) translateY(0)') {
            root.style.transition = ''
            root.style.overflow = ''
            root.style.transformOrigin = ''
          }
        }, closeDuration * 1000 + 50)
      }
      document.body.style.backgroundColor = originalBodyBg
      document.documentElement.style.backgroundColor = originalHtmlBg
      document.body.style.overflow = originalBodyOverflow
      document.documentElement.style.overflow = originalHtmlOverflow
    }
  }, [isOpen, openDuration, closeDuration])

  if (!mounted) return null

  const content = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex flex-col justify-end">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { type: 'spring', bounce: 0, duration: closeDuration } }}
            transition={{ type: 'spring', bounce: 0, duration: openDuration }}
            onClick={onClose}
            className="absolute inset-0 bg-black/55 cursor-pointer touch-none"
            style={{
              willChange: 'opacity',
              transform: 'translateZ(0)',
            }}
            aria-hidden="true"
          />

          <motion.div
            drag="y"
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 1 }}
            dragTransition={{ bounceStiffness: 250, bounceDamping: 25 }}
            onDragEnd={(_, { offset, velocity }) => {
              if (offset.y > 120 || velocity.y > 350) {
                onClose()
              }
            }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%', transition: { type: 'spring', bounce: 0, duration: closeDuration } }}
            transition={{ type: 'spring', bounce: 0, duration: openDuration }}
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
              className="px-6 pt-2 pb-5 touch-none select-none cursor-grab active:cursor-grabbing"
              onPointerDown={(e) => dragControls.start(e)}
              style={{ paddingBottom: title || headerRight ? '12px' : '20px' }}
            >
              {!hideDragIndicator && (
                <div className="w-[36px] h-[5px] bg-on-surface-variant/30 rounded-full mx-auto mb-4" />
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
