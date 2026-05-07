import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'

function LotusMark() {
  return (
    <svg
      viewBox="0 0 120 120"
      aria-hidden="true"
      className="h-28 w-28 landscape:h-24 landscape:w-24"
    >
      <defs>
        <linearGradient id="lotus-petal" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#87f5ec" />
          <stop offset="100%" stopColor="#006a65" />
        </linearGradient>
      </defs>
      <g fill="none" stroke="url(#lotus-petal)" strokeLinecap="round" strokeLinejoin="round">
        <path d="M60 75C45 58 48 35 60 20c12 15 15 38 0 55Z" strokeWidth="5" />
        <path d="M50 78C30 69 23 48 28 32c17 7 30 24 22 46Z" strokeWidth="5" opacity="0.78" />
        <path d="M70 78c20-9 27-30 22-46-17 7-30 24-22 46Z" strokeWidth="5" opacity="0.78" />
        <path d="M43 83C26 82 14 70 11 55c15-1 30 7 32 28Z" strokeWidth="5" opacity="0.52" />
        <path d="M77 83c17-1 29-13 32-28-15-1-30 7-32 28Z" strokeWidth="5" opacity="0.52" />
        <path d="M31 90c17 10 41 10 58 0" strokeWidth="6" opacity="0.85" />
      </g>
    </svg>
  )
}

export function PageLoader({ show }: { show: boolean }) {
  return createPortal(
    <AnimatePresence mode="wait">
      {show && (
        <motion.div
          key="page-loader"
          initial={{ opacity: 0, scale: 1.01 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.01 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden"
          style={{ background: '#fcf9f4' }}
        >
          <motion.div
            className="absolute pointer-events-none rounded-full"
            style={{
              width: 340,
              height: 340,
              background: 'rgba(106,216,208,0.22)',
              filter: 'blur(84px)',
            }}
            animate={{ opacity: [0.55, 0.9, 0.55], scale: [0.96, 1.04, 0.96] }}
            transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut' }}
          />

          <div className="relative z-10 flex w-full max-w-[360px] flex-col items-center justify-center gap-10 px-8 landscape:max-w-[620px] landscape:flex-row landscape:gap-14">
            <div className="relative flex h-44 w-44 shrink-0 items-center justify-center landscape:h-36 landscape:w-36">
              <motion.div
                className="absolute inset-0 rounded-full border"
                style={{ borderColor: 'rgba(0,106,101,0.14)' }}
                animate={{ scale: [0.96, 1, 0.96], opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
              />
              <motion.div
                className="absolute inset-5 rounded-full border"
                style={{ borderColor: 'rgba(47,167,160,0.2)' }}
                animate={{ scale: [1, 0.94, 1], opacity: [0.62, 0.95, 0.62] }}
                transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut', delay: 0.25 }}
              />
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
              >
                <LotusMark />
              </motion.div>
            </div>

            <div className="flex w-full flex-col items-center gap-5 landscape:items-start">
              <div className="space-y-2 text-center landscape:text-left">
                <h1 className="font-headline text-[22px] font-bold leading-tight text-[#1c1c19] landscape:text-2xl">
                  Создаём ваше личное пространство
                </h1>
                <p className="font-body text-sm font-medium text-[#3d4948]/70">
                  Подбираем гороскоп и поддержку на сегодня
                </p>
              </div>

              <div
                className="relative h-3 w-full max-w-[260px] overflow-hidden rounded-full landscape:max-w-[300px]"
                style={{ background: '#e5e2dd' }}
              >
                <motion.div
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{
                    background: 'linear-gradient(90deg, #006a65 0%, #2fa7a0 100%)',
                    boxShadow: '0 0 18px rgba(47,167,160,0.28)',
                  }}
                  initial={{ width: '12%' }}
                  animate={{ width: ['12%', '52%', '76%', '92%'] }}
                  transition={{ duration: 4.4, times: [0, 0.42, 0.74, 1], ease: [0.22, 1, 0.36, 1] }}
                />
              </div>

              <motion.p
                className="font-body text-sm font-semibold text-[#006a65]/75"
                animate={{ opacity: [0.65, 1, 0.65] }}
                transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
              >
                Почти готово
              </motion.p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
