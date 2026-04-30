import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'

interface PageLoaderProps {
  show: boolean
}

export function PageLoader({ show }: PageLoaderProps) {
  return createPortal(
    // AnimatePresence живёт ВНУТРИ портала — видит motion.div и запускает exit-анимацию
    <AnimatePresence>
      {show && (
        <motion.div
          key="page-loader"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          style={{ willChange: 'opacity' }}
          // z-[9999] + renderится в body → перекрывает BottomNav и все motion-контейнеры
          className="fixed inset-0 z-[9999] bg-background flex items-center justify-center overflow-hidden"
        >
          {/* Фоновое свечение */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-[#2fa7a0]/10 rounded-full blur-[80px] pointer-events-none animate-pulse" />

          {/* Portrait: flex-col / Landscape: flex-row */}
          <div className="relative z-10 flex flex-col landscape:flex-row items-center justify-center gap-10 landscape:gap-14 px-10 w-full max-w-[430px] landscape:max-w-[700px]">

            {/* Орб с кольцами */}
            <div className="relative w-44 h-44 landscape:w-32 landscape:h-32 flex items-center justify-center shrink-0">
              <div
                className="absolute inset-0 border border-outline-variant/30 rounded-full"
                style={{ animation: 'spin 60s linear infinite' }}
              />
              <div
                className="absolute inset-4 border border-outline-variant/20 rounded-full"
                style={{ animation: 'spin 45s linear infinite reverse' }}
              />
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                style={{ willChange: 'transform' }}
                className="w-28 h-28 landscape:w-20 landscape:h-20 bg-gradient-to-tr from-[#006a65] to-[#2fa7a0] rounded-full shadow-2xl shadow-[#2fa7a0]/30 flex items-center justify-center"
              >
                <span
                  className="material-symbols-outlined text-white text-[44px] landscape:text-[32px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  spa
                </span>
              </motion.div>
            </div>

            {/* Текст и прогресс-бар */}
            <div className="flex flex-col items-center landscape:items-start gap-5 landscape:gap-4">
              <h1 className="font-headline font-semibold text-xl landscape:text-lg text-on-surface text-center landscape:text-left tracking-tight leading-snug">
                Создаём твоё<br className="landscape:hidden" /> личное пространство...
              </h1>

              <div className="w-48 landscape:w-56 h-[3px] bg-surface-container-highest rounded-full overflow-hidden relative">
                <div className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-[#006a65] to-[#2fa7a0] rounded-full loader-bar" />
              </div>

              <p className="text-sm text-on-surface-variant/60 font-body animate-pulse text-center landscape:text-left">
                Дышите медленно
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
