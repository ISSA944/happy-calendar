import { createPortal } from 'react-dom'
import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

const LOADER_PHRASES = [
  'Дышите медленно',
  'Создаём вашу личную красоту',
  'Составляем ваш идеальный гороскоп',
]

export function PageLoader({ show }: { show: boolean }) {
  const [phraseIndex, setPhraseIndex] = useState(0)

  useEffect(() => {
    if (!show) return

    const resetFrame = window.requestAnimationFrame(() => setPhraseIndex(0))
    const interval = window.setInterval(() => {
      setPhraseIndex((index) => Math.min(index + 1, LOADER_PHRASES.length - 1))
    }, 2300)

    return () => {
      window.cancelAnimationFrame(resetFrame)
      window.clearInterval(interval)
    }
  }, [show])

  return createPortal(
    <AnimatePresence mode="wait">
      {show && (
        <motion.div
          key="page-loader"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[9999] flex touch-none select-none items-center justify-center overflow-hidden"
          style={{ background: '#fcf9f4' }}
          onClick={(event) => event.stopPropagation()}
          onPointerDown={(event) => event.stopPropagation()}
          onTouchStart={(event) => event.stopPropagation()}
        >
          <main className="relative z-10 flex h-screen w-full max-w-md flex-col items-center justify-center gap-12 overflow-hidden p-8 landscape:max-w-[760px] landscape:flex-row landscape:gap-16">
            <div className="relative flex h-64 w-64 shrink-0 items-center justify-center landscape:h-48 landscape:w-48">
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 0.9, scale: 1 }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                style={{ willChange: 'transform, opacity' }}
              >
                <img
                  src="/loader-lotus.png"
                  alt=""
                  className="h-48 w-48 rounded-full object-cover landscape:h-32 landscape:w-32"
                  draggable={false}
                />
              </motion.div>
            </div>

            <div className="flex w-full flex-col items-center gap-6 px-4 landscape:max-w-[320px] landscape:items-start landscape:px-0">
              <div className="space-y-2 text-center landscape:text-left">
                <h1 className="font-headline text-xl font-medium tracking-tight text-[#1c1c19] sm:text-2xl">
                  Создаём ваше личное пространство...
                </h1>
              </div>

              <div
                className="relative h-1 w-48 overflow-hidden rounded-full landscape:w-64"
                style={{ background: '#e5e2dd' }}
              >
                <motion.div
                  className="absolute inset-y-0 left-0 w-full rounded-full"
                  style={{
                    background: '#2fa7a0',
                    transformOrigin: 'left',
                    willChange: 'transform',
                  }}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 6, ease: 'linear' }}
                />
              </div>

              <div className="h-5 overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.p
                    key={LOADER_PHRASES[phraseIndex]}
                    className="text-center font-body text-sm text-[#3d4948]/70 landscape:text-left"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                  >
                    {LOADER_PHRASES[phraseIndex]}
                  </motion.p>
                </AnimatePresence>
              </div>
            </div>
          </main>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
