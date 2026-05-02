import { motion, type Variants } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store'
import { getMoodImage } from '../services/content.service'

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
}
const itemVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.25, ease: 'easeOut' } },
}

export function NotificationsListPage() {
  const navigate   = useNavigate()
  const dailyPack  = useAppStore(s => s.dailyPack)
  const currentMood = useAppStore(s => s.currentMood)
  const moodImage  = getMoodImage(currentMood)

  // Собираем карточки из реального контента — только то, что есть
  const cards = [
    dailyPack?.horoscope && {
      icon: 'stars',
      fill: true,
      title: 'Гороскоп на сегодня',
      body: dailyPack.horoscope.main,
    },
    dailyPack?.supportPhrase && {
      icon: 'favorite',
      fill: true,
      title: 'Поддержка',
      body: dailyPack.supportPhrase,
    },
    dailyPack?.holiday && {
      icon: 'celebration',
      fill: false,
      title: 'Праздник дня',
      body: dailyPack.holiday,
    },
  ].filter(Boolean) as { icon: string; fill: boolean; title: string; body: string }[]

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={containerVariants}
      className="flex flex-col min-h-full bg-background"
    >
      {/* Header */}
      <header className="sticky top-0 w-full z-50 bg-background px-5 pt-[env(safe-area-inset-top,0px)]">
        <div className="flex items-center gap-4 h-16">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 -ml-1 text-primary hover:bg-black/5 rounded-full transition-colors active:scale-95 flex items-center justify-center shrink-0"
          >
            <span className="material-symbols-outlined text-[24px]">arrow_back</span>
          </button>
          <h1 className="font-headline font-bold text-lg tracking-tight text-primary truncate">Уведомления</h1>
        </div>
      </header>

      <main className="flex-1 px-5 pb-28 w-full max-w-[430px] landscape:max-w-[860px] mx-auto landscape:grid landscape:grid-cols-2 landscape:gap-6 landscape:items-start landscape:pt-4">

        {/* Hero */}
        <motion.div variants={itemVariants} className="mb-6 mt-4">
          <h2 className="font-headline text-2xl font-extrabold text-on-surface tracking-tight mb-2">
            Мягкие напоминания
          </h2>
          <p className="text-on-surface-variant text-sm leading-relaxed">
            Все важные моменты твоего пути к осознанности собраны здесь.
          </p>
        </motion.div>

        {/* Карточки из реального контента */}
        <div className="space-y-4">
          {cards.length > 0 ? (
            cards.map((card, i) => (
              <motion.div
                key={i}
                variants={itemVariants}
                className="bg-white p-5 rounded-[20px] flex gap-4 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-white/50"
              >
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <span
                    className="material-symbols-outlined text-primary"
                    style={card.fill ? { fontVariationSettings: "'FILL' 1" } : undefined}
                  >
                    {card.icon}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-headline font-bold text-on-surface text-[15px] leading-snug mb-1">
                    {card.title}
                  </h3>
                  <p className="text-on-surface-variant text-[14px] leading-snug line-clamp-3">
                    {card.body}
                  </p>
                </div>
              </motion.div>
            ))
          ) : (
            /* Пустое состояние — нет данных */
            <motion.div
              variants={itemVariants}
              className="flex flex-col items-center gap-3 py-12 text-center"
            >
              <span className="material-symbols-outlined text-[48px] text-on-surface-variant/30">
                notifications_off
              </span>
              <p className="text-on-surface-variant/60 text-sm font-medium">
                Уведомлений пока нет
              </p>
              <p className="text-on-surface-variant/40 text-xs">
                Они появятся после первого открытия главного экрана
              </p>
            </motion.div>
          )}

          {/* Фото меняется по настроению */}
          {cards.length > 0 && (
            <motion.div
              variants={itemVariants}
              key={currentMood}
              className="mt-2 overflow-hidden rounded-[20px] aspect-[16/10]"
            >
              <img
                alt={currentMood}
                className="w-full h-full object-cover"
                src={moodImage}
                loading="lazy"
              />
            </motion.div>
          )}
        </div>

      </main>
    </motion.div>
  )
}
