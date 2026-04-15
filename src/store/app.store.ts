import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  getHoroscope,
  getRandomQuote,
  getTodayHoliday,
  getTodayDateStr,
} from '../services/content.service'

export type BookmarkType = 'гороскоп' | 'поддержка'

export interface Bookmark {
  id: string
  type: BookmarkType
  date: string
  text: string
  icon: string
}

export interface DailyPack {
  date: string        // "DD.MM" — ключ дня, для детектирования нового дня
  zodiacSign: string
  horoscope: string   // main horoscope text
  holiday: string     // название праздника ('' если нет)
  supportPhrase: string
}

type AppState = {
  currentMood: string
  zodiacSign: string
  setZodiacSign: (sign: string) => void

  // Daily Pack — основной контент страницы
  dailyPack: DailyPack | null
  // Инициализирует пак если он пустой или устарел (новый день / другой знак)
  initDailyPack: (zodiacSign: string, mood: string) => void
  // Меняет настроение И обновляет только фразу поддержки (не трогает гороскоп)
  setMood: (mood: string) => void
  // Обновить только фразу (кнопка "Другая фраза")
  setSupportPhrase: (phrase: string) => void

  // User Profile (onboarding)
  userName: string
  setUserName: (name: string) => void
  gender: 'F' | 'M' | 'UNKNOWN'
  setGender: (gender: 'F' | 'M' | 'UNKNOWN') => void
  hasCompletedOnboarding: boolean
  setHasCompletedOnboarding: (v: boolean) => void

  email: string
  setEmail: (email: string) => void
  birthDate: string
  setBirthDate: (date: string) => void
  horoscopeTime: string
  setHoroscopeTime: (time: string) => void

  // Content Preferences
  showHoroscope: boolean
  toggleHoroscope: () => void
  showHolidays: boolean
  toggleHolidays: () => void
  showSupport: boolean
  toggleSupport: () => void

  // Bookmarks
  bookmarks: Bookmark[]
  addBookmark: (bookmark: Bookmark) => void
  removeBookmark: (id: string) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentMood: 'Воодушевлена',
      zodiacSign: '',
      setZodiacSign: (sign) => set({ zodiacSign: sign }),

      // Daily Pack
      dailyPack: null,

      initDailyPack: (zodiacSign: string, mood: string) => {
        const today = getTodayDateStr()
        const current = get().dailyPack
        // Не регенерируем если пак актуален (тот же день и тот же знак)
        if (current?.date === today && current?.zodiacSign === zodiacSign) return
        set({
          dailyPack: {
            date: today,
            zodiacSign,
            horoscope: getHoroscope(zodiacSign).main,
            holiday: getTodayHoliday()?.name ?? '',
            supportPhrase: getRandomQuote(mood).text,
          },
        })
      },

      setMood: (mood: string) => {
        const pack = get().dailyPack
        set({
          currentMood: mood,
          // Обновляем ТОЛЬКО фразу поддержки — гороскоп и праздник не трогаем
          dailyPack: pack
            ? { ...pack, supportPhrase: getRandomQuote(mood).text }
            : pack,
        })
      },

      setSupportPhrase: (phrase: string) => {
        const pack = get().dailyPack
        if (!pack) return
        set({ dailyPack: { ...pack, supportPhrase: phrase } })
      },

      // User Profile defaults
      userName: '',
      setUserName: (userName) => set({ userName }),
      gender: 'UNKNOWN',
      setGender: (gender) => set({ gender }),
      hasCompletedOnboarding: false,
      setHasCompletedOnboarding: (hasCompletedOnboarding) => set({ hasCompletedOnboarding }),

      email: '',
      setEmail: (email) => set({ email }),
      birthDate: '',
      setBirthDate: (birthDate) => set({ birthDate }),
      horoscopeTime: '09:00',
      setHoroscopeTime: (horoscopeTime) => set({ horoscopeTime }),

      showHoroscope: true,
      toggleHoroscope: () => set((state) => ({ showHoroscope: !state.showHoroscope })),
      showHolidays: false,
      toggleHolidays: () => set((state) => ({ showHolidays: !state.showHolidays })),
      showSupport: true,
      toggleSupport: () => set((state) => ({ showSupport: !state.showSupport })),

      // Bookmarks
      bookmarks: [],
      addBookmark: (bookmark) => set((state) => ({
        bookmarks: [bookmark, ...state.bookmarks],
      })),
      removeBookmark: (id) => set((state) => ({
        bookmarks: state.bookmarks.filter((b) => b.id !== id),
      })),
    }),
    { name: 'happy-calendar-store' }
  )
)
