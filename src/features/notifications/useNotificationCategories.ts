import { useAppStore } from '../../store'
import type { NotificationCategory } from './NotificationCategoriesEditor'

/** Собирает 4 категории уведомлений из стора — единый источник для онбординга и Настроек. */
export function useNotificationCategories(): NotificationCategory[] {
  const showHoroscope = useAppStore((s) => s.showHoroscope)
  const toggleHoroscope = useAppStore((s) => s.toggleHoroscope)
  const horoscopeTime = useAppStore((s) => s.horoscopeTime)
  const setHoroscopeTime = useAppStore((s) => s.setHoroscopeTime)

  const showSupport = useAppStore((s) => s.showSupport)
  const toggleSupport = useAppStore((s) => s.toggleSupport)
  const supportTime = useAppStore((s) => s.supportTime)
  const setSupportTime = useAppStore((s) => s.setSupportTime)

  const showHolidays = useAppStore((s) => s.showHolidays)
  const toggleHolidays = useAppStore((s) => s.toggleHolidays)
  const holidaysTime = useAppStore((s) => s.holidaysTime)
  const setHolidaysTime = useAppStore((s) => s.setHolidaysTime)

  const showPersonalCare = useAppStore((s) => s.showPersonalCare)
  const togglePersonalCare = useAppStore((s) => s.togglePersonalCare)
  const personalCareTime = useAppStore((s) => s.personalCareTime)
  const setPersonalCareTime = useAppStore((s) => s.setPersonalCareTime)

  return [
    {
      id: 'horoscope',
      icon: 'auto_awesome',
      title: 'Гороскоп',
      sub: 'ежедневный прогноз',
      enabled: showHoroscope,
      time: horoscopeTime,
      onToggle: toggleHoroscope,
      onTimeChange: setHoroscopeTime,
    },
    {
      id: 'support',
      icon: 'favorite',
      title: 'Поддержка',
      sub: 'тёплая фраза дня',
      enabled: showSupport,
      time: supportTime,
      onToggle: toggleSupport,
      onTimeChange: setSupportTime,
    },
    {
      id: 'holidays',
      icon: 'celebration',
      title: 'Праздники',
      sub: 'праздники и открытки',
      enabled: showHolidays,
      time: holidaysTime,
      onToggle: toggleHolidays,
      onTimeChange: setHolidaysTime,
    },
    {
      id: 'personalCare',
      icon: 'spa',
      title: 'Персональные праздники',
      sub: 'день заботы и задание',
      enabled: showPersonalCare,
      time: personalCareTime,
      onToggle: togglePersonalCare,
      onTimeChange: setPersonalCareTime,
    },
  ]
}
