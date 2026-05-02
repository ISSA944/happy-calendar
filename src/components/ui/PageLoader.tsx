import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'

export function PageLoader({ show }: { show: boolean }) {
  return createPortal(
    <AnimatePresence>
      {show && (
        <motion.div
          key="page-loader"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          // fixed inset-0 + z-[9999] — поверх BottomNav и всех motion-контейнеров
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          style={{ background: '#fcf9f4' }}
        >
          {/* Свечение — Framer Motion pulse (не зависит от CSS) */}
          <motion.div
            className="absolute rounded-full pointer-events-none"
            style={{
              width: 384,
              height: 384,
              background: 'rgba(47,167,160,0.2)',
              filter: 'blur(100px)',
            }}
            animate={{ opacity: [1, 0.45, 1] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* Portrait: flex-col / Landscape: flex-row */}
          <div className="relative z-10 flex flex-col landscape:flex-row items-center justify-center gap-12 landscape:gap-16 px-8 w-full max-w-md landscape:max-w-2xl">

            {/* ── Иллюстрация с кольцами ── */}
            <div className="relative w-64 h-64 landscape:w-48 landscape:h-48 flex items-center justify-center shrink-0">

              {/* Внешнее кольцо — Framer Motion rotate (не зависит от @keyframes spin) */}
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{ border: '0.5px solid rgba(188,201,199,0.3)' }}
                animate={{ rotate: 360 }}
                transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
              />

              {/* Внутреннее кольцо — крутится в обратную сторону */}
              <motion.div
                className="absolute inset-4 rounded-full"
                style={{ border: '0.5px solid rgba(188,201,199,0.2)' }}
                animate={{ rotate: -360 }}
                transition={{ duration: 45, repeat: Infinity, ease: 'linear' }}
              />

              {/* Лотос */}
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuA-5hQlzsfN7kyr1jvMIFYfYkdH6R8KRtaqnmUcqq9ySPKt7gUUiNtm9F38muaNrKTl-n59RLmAPLj8GAWWotShAtbpoydMxcjBljIbmEtE0-nS0oE0MKt2KxOL-Wz8Lmxj5VMnhhDsz9AJdt-48egL-iCXPrEvaVpSbJakseVP5DlT2MZMi6casgFo6PiShnn69BjTDgYNW1qdE8qDSSNQTz26U2WmWQJu7FsQ43DNz30iY6tQkOP7FyDCoCFyikqcLYLTYTJogGHC"
                alt=""
                className="w-48 h-48 landscape:w-32 landscape:h-32 object-cover rounded-full"
                style={{
                  mixBlendMode: 'multiply',
                  opacity: 0.9,
                  boxShadow: '0 20px 40px -15px rgba(0,106,101,0.1)',
                }}
              />
            </div>

            {/* ── Текст + прогресс ── */}
            <div className="flex flex-col items-center landscape:items-start gap-6 w-full">

              <h1
                className="text-xl landscape:text-2xl font-medium text-[#1c1c19] text-center landscape:text-left tracking-tight"
                style={{ fontFamily: 'Manrope, sans-serif' }}
              >
                Создаём ваше личное пространство...
              </h1>

              {/* Прогресс-бар: Framer Motion анимирует width 5% → 86% за 4.2с */}
              <div
                className="w-48 landscape:w-64 rounded-full overflow-hidden"
                style={{ height: 4, background: '#e5e2dd' }}
              >
                {/* Blur-слой пульсирует */}
                <motion.div
                  className="absolute h-1 rounded-full"
                  style={{
                    width: '50%',
                    background: 'linear-gradient(to right, #006a65, #2fa7a0)',
                    filter: 'blur(2px)',
                  }}
                  animate={{ opacity: [0.6, 1, 0.6] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                />
                {/* Основной прогресс */}
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: 'linear-gradient(to right, #006a65, #2fa7a0)' }}
                  initial={{ width: '5%' }}
                  animate={{ width: '86%' }}
                  transition={{ duration: 4.2, ease: [0.1, 0, 0.25, 1] }}
                />
              </div>

              {/* "Дышите медленно" — Framer Motion opacity pulse */}
              <motion.p
                className="text-sm text-center landscape:text-left"
                style={{
                  color: 'rgba(61,73,72,0.7)',
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}
                animate={{ opacity: [1, 0.45, 1] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
              >
                Дышите медленно
              </motion.p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
