import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import type { Variants } from 'framer-motion'

interface NotifItem {
  icon: string
  iconFill: boolean
  title: string
  time: string
  description: string
  faded?: boolean
}

const NOTIFICATIONS: NotifItem[] = [
  {
    icon: 'stars',
    iconFill: true,
    title: 'Гороскоп на сегодня',
    time: '10:00',
    description: 'Твой персональный прогноз уже ждёт тебя ✨',
  },
  {
    icon: 'favorite',
    iconFill: true,
    title: 'Поддержка',
    time: '2 ч. назад',
    description: 'Новая фраза дня специально для твоего настроения.',
  },
  {
    icon: 'notifications',
    iconFill: true,
    title: 'Напоминание',
    time: 'Вчера',
    description: 'Время для твоей ежедневной практики осознанности.',
  },
  {
    icon: 'celebration',
    iconFill: false,
    title: 'С праздником!',
    time: '2 дня назад',
    description: 'Мы подготовили для тебя особенный подарок внутри приложения.',
    faded: true,
  },
]

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
}
const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
}

export function NotificationsListPage() {
  const navigate = useNavigate()

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

      <main className="flex-1 px-5 pb-28">
        {/* Hero */}
        <motion.div variants={itemVariants} className="mb-8 mt-4">
          <h2 className="font-headline text-2xl font-extrabold text-on-surface tracking-tight mb-2">Мягкие напоминания</h2>
          <p className="text-on-surface-variant text-sm leading-relaxed">
            Все важные моменты твоего пути к осознанности собраны здесь.
          </p>
        </motion.div>

        {/* Notification Cards */}
        <div className="space-y-5">
          {NOTIFICATIONS.map((n, i) => (
            <motion.div
              key={i}
              variants={itemVariants}
              className={`bg-white p-5 rounded-[20px] flex gap-4 shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-white/50 ${n.faded ? 'opacity-60' : ''}`}
            >
              <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${n.faded ? 'bg-surface-container-highest' : 'bg-primary/10'}`}>
                <span
                  className={`material-symbols-outlined ${n.faded ? 'text-on-surface-variant' : 'text-primary'}`}
                  style={n.iconFill ? { fontVariationSettings: "'FILL' 1" } : undefined}
                >
                  {n.icon}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1 gap-2">
                  <h3 className="font-headline font-bold text-on-surface text-[15px] leading-snug">{n.title}</h3>
                  <span className="text-[10px] uppercase tracking-widest text-on-surface-variant/60 font-semibold flex-shrink-0 pt-0.5">{n.time}</span>
                </div>
                <p className="text-on-surface-variant text-[14px] leading-snug">{n.description}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Decorative image */}
        <motion.div
          variants={itemVariants}
          className="mt-10 overflow-hidden rounded-[20px] aspect-[16/10] bg-gradient-to-tr from-primary/10 to-tertiary-container/10 flex items-center justify-center"
        >
          <img
            alt="Спокойствие"
            className="w-full h-full object-cover"
            src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=500&fit=crop&q=80"
            loading="lazy"
          />
        </motion.div>
      </main>
    </motion.div>
  )
}
