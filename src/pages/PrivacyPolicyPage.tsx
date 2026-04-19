import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'

const SECTIONS = [
  {
    n: 1,
    title: 'Сбор данных',
    body:
      'Мы собираем только ту информацию, которая необходима для персонализации вашего опыта: ваше имя (или псевдоним) и дату рождения для астрологических расчётов. Мы не отслеживаем ваше местоположение вне рамок приложения.',
  },
  {
    n: 2,
    title: 'Использование данных',
    body:
      'Ваши данные используются исключительно для формирования индивидуальных прогнозов и рекомендаций по медитации. Мы никогда не продаём и не передаём вашу личную информацию рекламным сетям или третьим лицам.',
  },
  {
    n: 3,
    title: 'Защита информации',
    body:
      'Все передаваемые данные шифруются по промышленным стандартам. Мы регулярно проводим аудит безопасности, чтобы ваше «Цифровое Убежище» оставалось неприступным для посторонних.',
  },
]

export function PrivacyPolicyPage() {
  const navigate = useNavigate()

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      style={{ willChange: 'opacity', transform: 'translateZ(0)' }}
      className="relative bg-background text-on-surface font-body selection:bg-primary/20 selection:text-primary h-[100dvh] w-full max-w-[430px] mx-auto overflow-x-hidden overflow-y-auto overscroll-none"
    >
      {/* TopAppBar */}
      <header className="sticky top-0 w-full z-50 bg-background px-5 pt-[env(safe-area-inset-top,0px)] border-b border-primary/5">
        <div className="flex items-center h-16 relative">
          <button
            onClick={() => navigate(-1)}
            aria-label="Назад"
            className="w-10 h-10 -ml-1 text-primary hover:bg-black/5 rounded-full transition-colors active:scale-95 flex items-center justify-center shrink-0"
          >
            <span className="material-symbols-outlined text-[24px]">arrow_back</span>
          </button>
          <h1 className="absolute left-1/2 -translate-x-1/2 font-headline font-bold text-lg text-primary tracking-tight truncate max-w-[70%] text-center">
            Политика конфиденциальности
          </h1>
        </div>
      </header>

      <main
        className="px-6 pt-8"
        style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}
      >
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="mb-10 flex flex-col items-center"
        >
          <div className="w-20 h-20 bg-primary-container/20 rounded-full flex items-center justify-center mb-6">
            <span
              className="material-symbols-outlined text-primary text-4xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              verified_user
            </span>
          </div>
          <h2 className="font-headline font-extrabold text-2xl text-center leading-tight tracking-tight text-on-surface">
            Ваша конфиденциальность важна для нас
          </h2>
          <div className="mt-4 h-1 w-12 bg-primary-container rounded-full" />
        </motion.div>

        {/* Intro */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="text-on-surface-variant leading-relaxed text-[15px] mb-12"
        >
          В приложении «Digital Sanctuary» мы верим, что ваше цифровое спокойствие начинается
          с уверенности в безопасности ваших личных данных. Мы создали это пространство как ваше
          личное убежище, где каждая деталь защищена.
        </motion.p>

        {/* Cards */}
        <div className="space-y-6">
          {SECTIONS.map((s, i) => (
            <motion.section
              key={s.n}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15 + i * 0.06 }}
              className="bg-white rounded-3xl p-6 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)]"
            >
              <div className="flex items-center gap-3 mb-4">
                <span className="w-8 h-8 rounded-full bg-secondary-fixed flex items-center justify-center text-on-secondary-fixed-variant font-bold text-sm">
                  {s.n}
                </span>
                <h3 className="font-headline font-bold text-lg text-on-surface">{s.title}</h3>
              </div>
              <p className="text-on-surface-variant leading-relaxed text-[14px]">{s.body}</p>
            </motion.section>
          ))}
        </div>

        {/* Footer note */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.35 }}
          className="mt-12 text-center"
        >
          <div className="inline-block px-4 py-3 bg-surface-container rounded-2xl">
            <p className="text-[12px] text-on-surface-variant font-medium">
              Последнее обновление: 24 мая 2024
            </p>
          </div>
        </motion.footer>
      </main>

      {/* Glassmorphism blobs */}
      <div className="fixed top-[-5%] right-[-5%] w-[300px] h-[300px] bg-primary/5 rounded-full blur-[80px] -z-10 pointer-events-none" />
      <div className="fixed bottom-[-5%] left-[-5%] w-[250px] h-[250px] bg-primary/5 rounded-full blur-[60px] -z-10 pointer-events-none" />
    </motion.div>
  )
}
