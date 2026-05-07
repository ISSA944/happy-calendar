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
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[9999] flex touch-none select-none items-center justify-center overflow-hidden"
          style={{ background: '#fcf9f4' }}
          onClick={(event) => event.stopPropagation()}
          onPointerDown={(event) => event.stopPropagation()}
          onTouchStart={(event) => event.stopPropagation()}
        >
          <motion.div
            className="absolute pointer-events-none rounded-full"
            style={{
              width: 384,
              height: 384,
              background: 'rgba(47,167,160,0.2)',
              filter: 'blur(100px)',
            }}
            animate={{ opacity: [1, 0.5, 1], scale: [0.98, 1.04, 0.98] }}
            transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
          />

          <main className="relative z-10 flex h-screen w-full max-w-md flex-col items-center justify-center gap-12 overflow-hidden p-8 landscape:max-w-[760px] landscape:flex-row landscape:gap-16">
            <div className="relative flex h-64 w-64 shrink-0 items-center justify-center landscape:h-48 landscape:w-48">
              <motion.div
                className="absolute inset-0 rounded-full border"
                style={{ borderColor: 'rgba(188,201,199,0.3)' }}
                animate={{ scale: [0.98, 1.035, 0.98], opacity: [0.72, 1, 0.72] }}
                transition={{ duration: 2.9, repeat: Infinity, ease: 'easeInOut' }}
              />
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 0.9, y: 0, scale: [1, 1.012, 1] }}
                transition={{
                  opacity: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
                  y: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
                  scale: { duration: 2.9, repeat: Infinity, ease: 'easeInOut' },
                }}
                style={{
                  mixBlendMode: 'multiply',
                  filter: 'drop-shadow(0 20px 28px rgba(0,106,101,0.1))',
                }}
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
                  className="absolute inset-y-0 left-0 rounded-full blur-[1px]"
                  style={{ background: 'linear-gradient(90deg, #006a65 0%, #2fa7a0 100%)' }}
                  initial={{ width: '0%', opacity: 0.7 }}
                  animate={{ width: '100%', opacity: [0.55, 0.95, 0.55] }}
                  transition={{
                    width: { duration: 6.7, ease: 'linear' },
                    opacity: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
                  }}
                />
                <motion.div
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{
                    background: '#2fa7a0',
                    boxShadow: '0 0 8px rgba(47,167,160,0.3)',
                  }}
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 6.7, ease: 'linear' }}
                />
              </div>

              <div className="h-5 overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.p
                    key={LOADER_PHRASES[phraseIndex]}
                    className="text-center font-body text-sm text-[#3d4948]/70 landscape:text-left"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
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
