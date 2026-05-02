import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'

interface PageLoaderProps {
  show: boolean
}

export function PageLoader({ show }: PageLoaderProps) {
  return createPortal(
    <AnimatePresence>
      {show && (
        <motion.div
          key="page-loader"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          style={{ willChange: 'opacity' }}
          className="fixed inset-0 z-[9999] bg-background flex flex-col items-center justify-center overflow-hidden font-body"
        >
          {/* Фоновое свечение */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full pointer-events-none -z-10"
            style={{
              background: 'rgba(47,167,160,0.15)',
              filter: 'blur(100px)',
              animation: 'gentle-pulse 2s cubic-bezier(0.4,0,0.6,1) infinite',
            }}
          />

          {/* Иллюстрация с кольцами */}
          <div className="relative w-64 h-64 landscape:w-44 landscape:h-44 flex items-center justify-center mb-10 landscape:mb-6">
            {/* Внешнее кольцо */}
            <div
              className="absolute inset-0 rounded-full"
              style={{
                border: '0.5px solid rgba(188,201,199,0.3)',
                animation: 'spin 60s linear infinite',
              }}
            />
            {/* Внутреннее кольцо */}
            <div
              className="absolute inset-4 rounded-full"
              style={{
                border: '0.5px solid rgba(188,201,199,0.2)',
                animation: 'spin 45s linear infinite reverse',
              }}
            />
            {/* Изображение лотоса */}
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuA-5hQlzsfN7kyr1jvMIFYfYkdH6R8KRtaqnmUcqq9ySPKt7gUUiNtm9F38muaNrKTl-n59RLmAPLj8GAWWotShAtbpoydMxcjBljIbmEtE0-nS0oE0MKt2KxOL-Wz8Lmxj5VMnhhDsz9AJdt-48egL-iCXPrEvaVpSbJakseVP5DlT2MZMi6casgFo6PiShnn69BjTDgYNW1qdE8qDSSNQTz26U2WmWQJu7FsQ43DNz30iY6tQkOP7FyDCoCFyikqcLYLTYTJogGHC"
              alt="Загрузка"
              className="w-48 h-48 landscape:w-32 landscape:h-32 object-cover rounded-full mix-blend-multiply opacity-90 shadow-[0_20px_40px_-15px_rgba(0,106,101,0.1)]"
            />
          </div>

          {/* Текст и прогресс-бар */}
          <div className="flex flex-col items-center gap-6 w-full px-8">
            <h1 className="font-headline text-xl landscape:text-lg font-medium text-on-surface text-center tracking-tight">
              Создаём ваше личное пространство...
            </h1>

            {/* Полоска загрузки */}
            <div className="w-48 h-1 bg-surface-container-highest rounded-full overflow-hidden relative">
              {/* Блюр-слой */}
              <div className="absolute top-0 left-0 h-full w-1/2 bg-gradient-to-r from-[#006a65] to-[#2fa7a0] rounded-full blur-[1px] animate-pulse" />
              {/* Бегущий слой */}
              <div className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-[#006a65] to-[#2fa7a0] rounded-full loader-bar" />
            </div>

            <p className="text-sm text-on-surface-variant/70 text-center animate-pulse">
              Дышите медленно
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
