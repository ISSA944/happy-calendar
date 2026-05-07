import { createPortal } from 'react-dom'
import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

const LOADER_PHRASES = [
  'Дышите медленно',
  'Составляем ваш идеальный гороскоп',
  'Подбираем поддержку на сегодня',
]

function LotusMark() {
  return (
    <svg
      viewBox="0 0 120 120"
      aria-hidden="true"
      className="h-48 w-48 landscape:h-32 landscape:w-32"
    >
      <defs>
        <radialGradient id="lotus-bg" cx="50%" cy="43%" r="55%">
          <stop offset="0%" stopColor="#fff7ed" />
          <stop offset="58%" stopColor="#e5fbf8" />
          <stop offset="100%" stopColor="#fcf9f4" />
        </radialGradient>
        <linearGradient id="lotus-petal" x1="20%" y1="10%" x2="80%" y2="90%">
          <stop offset="0%" stopColor="#f0b49d" stopOpacity="0.7" />
          <stop offset="48%" stopColor="#87f5ec" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#006a65" stopOpacity="0.92" />
        </linearGradient>
      </defs>
      <circle cx="60" cy="60" r="56" fill="url(#lotus-bg)" />
      <g fill="none" stroke="url(#lotus-petal)" strokeLinecap="round" strokeLinejoin="round">
        <path d="M60 76C45 59 48 35 60 20c12 15 15 39 0 56Z" strokeWidth="5.5" />
        <path d="M50 79C30 70 23 48 28 32c17 7 31 24 22 47Z" strokeWidth="5.5" opacity="0.78" />
        <path d="M70 79c20-9 27-31 22-47-17 7-31 24-22 47Z" strokeWidth="5.5" opacity="0.78" />
        <path d="M43 84C26 83 14 70 11 55c15-1 30 7 32 29Z" strokeWidth="5" opacity="0.52" />
        <path d="M77 84c17-1 29-14 32-29-15-1-30 7-32 29Z" strokeWidth="5" opacity="0.52" />
        <path d="M31 91c17 10 41 10 58 0" strokeWidth="6.5" opacity="0.85" />
      </g>
    </svg>
  )
}

export function PageLoader({ show }: { show: boolean }) {
  const [phraseIndex, setPhraseIndex] = useState(0)

  useEffect(() => {
    if (!show) return

    const resetFrame = window.requestAnimationFrame(() => setPhraseIndex(0))
    const interval = window.setInterval(() => {
      setPhraseIndex((index) => Math.min(index + 1, LOADER_PHRASES.length - 1))
    }, 1800)

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

          <main className="relative z-10 flex h-full w-full max-w-md flex-col items-center justify-center gap-12 overflow-hidden p-8 landscape:max-w-[760px] landscape:flex-row landscape:gap-16">
            <div className="relative flex h-64 w-64 shrink-0 items-center justify-center landscape:h-48 landscape:w-48">
              <motion.div
                className="absolute inset-0 rounded-full border"
                style={{ borderColor: 'rgba(188,201,199,0.3)' }}
                animate={{ scale: [0.98, 1.04, 0.98], opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
              />
              <motion.div
                className="absolute inset-4 rounded-full border"
                style={{ borderColor: 'rgba(188,201,199,0.22)' }}
                animate={{ scale: [1.02, 0.96, 1.02], opacity: [0.55, 0.9, 0.55] }}
                transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut', delay: 0.22 }}
              />
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 0.92, y: 0, scale: [1, 1.018, 1] }}
                transition={{
                  opacity: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
                  y: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
                  scale: { duration: 2.8, repeat: Infinity, ease: 'easeInOut' },
                }}
                style={{
                  mixBlendMode: 'multiply',
                  filter: 'drop-shadow(0 20px 28px rgba(0,106,101,0.1))',
                }}
              >
                <LotusMark />
              </motion.div>
            </div>

            <div className="flex w-full flex-col items-center gap-6 px-4 landscape:max-w-[320px] landscape:items-start landscape:px-0">
              <div className="space-y-2 text-center landscape:text-left">
                <h1 className="font-headline text-xl font-medium tracking-tight text-[#1c1c19] sm:text-2xl">
                  Создаём ваше личное пространство...
                </h1>
              </div>

              <div
                className="relative h-1.5 w-48 overflow-hidden rounded-full landscape:w-64"
                style={{ background: '#e5e2dd' }}
              >
                <motion.div
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{
                    background: 'linear-gradient(90deg, #006a65 0%, #2fa7a0 100%)',
                    boxShadow: '0 0 10px rgba(47,167,160,0.36)',
                  }}
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 5.2, ease: [0.22, 1, 0.36, 1] }}
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
