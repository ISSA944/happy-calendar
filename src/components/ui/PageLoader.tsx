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
          transition={{ duration: 0.35, ease: 'easeOut' }}
          style={{ willChange: 'opacity' }}
          className="fixed inset-0 z-[9999] bg-background font-body text-on-surface flex flex-col items-center justify-center"
        >
          {/* Главный контент */}
          <main className="w-full max-w-md landscape:max-w-2xl mx-auto flex flex-col landscape:flex-row items-center justify-center p-8 gap-12 landscape:gap-16 relative overflow-hidden h-screen landscape:h-auto">

            {/* Свечение */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full pointer-events-none -z-10 pulse-soft"
              style={{ background: 'rgba(47,167,160,0.2)', filter: 'blur(100px)' }}
            />

            {/* Иллюстрация */}
            <div className="relative w-64 h-64 landscape:w-48 landscape:h-48 flex items-center justify-center shrink-0">
              {/* Кольцо внешнее */}
              <div className="absolute inset-0 rounded-full animate-[spin_60s_linear_infinite]"
                style={{ border: '0.5px solid rgba(188,201,199,0.3)' }}
              />
              {/* Кольцо внутреннее */}
              <div className="absolute inset-4 rounded-full animate-[spin_45s_linear_infinite_reverse]"
                style={{ border: '0.5px solid rgba(188,201,199,0.2)' }}
              />
              {/* Лотос */}
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuA-5hQlzsfN7kyr1jvMIFYfYkdH6R8KRtaqnmUcqq9ySPKt7gUUiNtm9F38muaNrKTl-n59RLmAPLj8GAWWotShAtbpoydMxcjBljIbmEtE0-nS0oE0MKt2KxOL-Wz8Lmxj5VMnhhDsz9AJdt-48egL-iCXPrEvaVpSbJakseVP5DlT2MZMi6casgFo6PiShnn69BjTDgYNW1qdE8qDSSNQTz26U2WmWQJu7FsQ43DNz30iY6tQkOP7FyDCoCFyikqcLYLTYTJogGHC"
                alt="Загрузка"
                className="w-48 h-48 landscape:w-36 landscape:h-36 object-cover rounded-full mix-blend-multiply opacity-90 shadow-[0_20px_40px_-15px_rgba(0,106,101,0.1)]"
              />
            </div>

            {/* Текст и бар */}
            <div className="flex flex-col items-center landscape:items-start gap-6 w-full px-4 landscape:px-0">
              <h1 className="font-headline text-xl landscape:text-2xl font-medium text-on-surface text-center landscape:text-left tracking-tight">
                Создаём ваше личное пространство...
              </h1>

              {/* Прогресс-бар */}
              <div className="w-48 landscape:w-64 h-1 bg-surface-container-highest rounded-full overflow-hidden relative">
                {/* Blur-слой — пульсирует */}
                <div className="absolute top-0 left-0 h-full w-1/2 bg-gradient-to-r from-[#006a65] to-[#2fa7a0] rounded-full blur-[1px] animate-[pulse_2s_ease-in-out_infinite]" />
                {/* Прогресс — заполняется от 5% до 86% за 4 сек */}
                <div className="absolute top-0 left-0 h-full bg-[#2fa7a0] rounded-full loader-progress" />
              </div>

              <p className="font-body text-sm text-on-surface-variant/70 text-center landscape:text-left animate-pulse">
                Дышите медленно
              </p>
            </div>

          </main>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
