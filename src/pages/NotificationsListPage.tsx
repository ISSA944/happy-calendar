import { useEffect, useMemo, useState } from 'react'
import { motion, type Variants } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store'
import { getMoodImage } from '../services/content.service'
import { apiClient } from '../api'

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
}
const itemVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.25, ease: 'easeOut' } },
}

type NotificationItem = {
  id: string
  sentAt: string
  type: string
  title: string | null
  body: string | null
  date: string | null
  mood: string | null
}

function formatDate(sentAt: string): string {
  const date = new Date(sentAt)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today.getTime() - 86400000)
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  if (d.getTime() === today.getTime()) return 'Сегодня'
  if (d.getTime() === yesterday.getTime()) return 'Вчера'
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
}

function notificationIcon(type: string) {
  if (type.includes('horoscope')) return { icon: 'stars', fill: true }
  if (type.includes('support')) return { icon: 'favorite', fill: true }
  if (type.includes('holiday')) return { icon: 'celebration', fill: false }
  return { icon: 'notifications', fill: false }
}

export function NotificationsListPage() {
  const navigate   = useNavigate()
  const currentMood = useAppStore(s => s.currentMood)
  const [items, setItems] = useState<NotificationItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [isClearing, setIsClearing] = useState(false)

  const handleClearAll = async () => {
    setIsClearing(true)
    try {
      await apiClient.delete('notifications')
      setItems([])
      setShowClearConfirm(false)
    } catch {
      // тихо — пользователь может перезагрузить страницу
    } finally {
      setIsClearing(false)
    }
  }

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  useEffect(() => {
    let cancelled = false
    apiClient.get<NotificationItem[]>('notifications')
      .then(({ data }) => {
        if (!cancelled) setItems(data)
      })
      .catch((err) => {
        console.warn('[notifications] Failed to fetch notifications', err)
        if (!cancelled) setItems([])
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  const heroMoodImage = useMemo(
    () => getMoodImage(items[0]?.mood || currentMood),
    [currentMood, items],
  )

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
        <motion.div variants={itemVariants} className="mb-6 mt-4 flex flex-col gap-4">
          <div>
            <h2 className="font-headline text-2xl font-extrabold text-on-surface tracking-tight mb-2">
              Мягкие напоминания
            </h2>
            <p className="text-on-surface-variant text-sm leading-relaxed">
              Все важные моменты твоего пути к осознанности собраны здесь.
            </p>
          </div>
          {items.length > 0 && (
            <div className="hidden landscape:block overflow-hidden rounded-[20px] aspect-[4/3] w-full">
              <img
                alt={currentMood}
                className="w-full h-full object-cover"
                src={heroMoodImage}
                loading="lazy"
              />
            </div>
          )}
        </motion.div>

        {/* Карточки из реально отправленных push-уведомлений */}
        <div className="space-y-4">
          {items.length > 0 ? (
            items.map((item) => {
              const icon = notificationIcon(item.type)
              return (
                <motion.div
                  key={item.id}
                  variants={itemVariants}
                  onClick={() => toggleExpand(item.id)}
                  className="bg-white p-5 rounded-[20px] flex gap-4 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-white/50 active:scale-[0.98] transition-transform cursor-pointer"
                >
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <span
                      className="material-symbols-outlined text-primary"
                      style={icon.fill ? { fontVariationSettings: "'FILL' 1" } : undefined}
                    >
                      {icon.icon}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-headline font-bold text-on-surface text-[15px] leading-snug">
                        {item.title || 'Уведомление'}
                      </h3>
                      <span className="text-on-surface-variant/50 text-[11px] shrink-0 mt-0.5">
                        {formatDate(item.sentAt)}
                      </span>
                    </div>
                    <p className={`text-on-surface-variant text-[14px] leading-snug ${expandedIds.has(item.id) ? '' : 'line-clamp-3'}`}>
                      {item.body || 'Текст уведомления недоступен'}
                    </p>
                  </div>
                </motion.div>
            )})
          ) : isLoading ? (
            <motion.div variants={itemVariants} className="flex flex-col items-center gap-3 py-12 text-center">
              <span className="material-symbols-outlined text-[48px] text-on-surface-variant/30">hourglass_empty</span>
              <p className="text-on-surface-variant/60 text-sm font-medium">Загружаем уведомления...</p>
            </motion.div>
          ) : (
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
          {items.length > 0 && (
            <motion.div
              variants={itemVariants}
              key={heroMoodImage}
              className="mt-2 overflow-hidden rounded-[20px] aspect-[16/10] landscape:hidden"
            >
              <img
                alt={currentMood}
                className="w-full h-full object-cover"
                src={heroMoodImage}
                loading="lazy"
              />
            </motion.div>
          )}

          {/* Очистить уведомления */}
          {items.length > 0 && (
            <motion.div variants={itemVariants} className="pt-2 pb-4">
              <button
                onClick={() => setShowClearConfirm(true)}
                className="w-full py-4 rounded-[1.5rem] border border-red-200 text-red-500 font-semibold text-sm active:scale-[0.98] transition-colors hover:bg-red-50"
              >
                Очистить все уведомления
              </button>
            </motion.div>
          )}
        </div>

      </main>

      {/* Модал подтверждения */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-inverse-surface/60 p-6">
          <div className="bg-background rounded-[28px] p-6 w-full max-w-sm shadow-xl space-y-4">
            <div className="flex justify-center">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
                <span className="material-symbols-outlined text-red-400 text-2xl">delete_sweep</span>
              </div>
            </div>
            <h2 className="font-headline font-bold text-lg text-on-surface text-center">
              Очистить уведомления?
            </h2>
            <p className="text-sm text-on-surface-variant text-center leading-relaxed">
              Все уведомления будут удалены без возможности восстановления.
            </p>
            <button
              onClick={handleClearAll}
              disabled={isClearing}
              className="w-full py-3 rounded-full bg-red-500 text-white font-headline font-bold text-base active:scale-[0.98] transition-all"
            >
              {isClearing ? 'Удаляем...' : 'Да, очистить'}
            </button>
            <button
              onClick={() => setShowClearConfirm(false)}
              className="w-full py-3 text-on-surface-variant font-semibold text-sm"
            >
              Отмена
            </button>
          </div>
        </div>
      )}
    </motion.div>
  )
}
