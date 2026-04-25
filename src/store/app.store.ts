import { create } from 'zustand'
import { persist } from 'zustand/middleware'

function localTimeToUtc(localHHMM: string): string {
  const [h, m] = localHHMM.split(':').map(Number)
  const d = new Date()
  d.setHours(h, m, 0, 0)
  return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`
}
import {
  getHoroscope,
  getRandomQuote,
  getTodayHoliday,
  getTodayDateStr,
} from '../services/content.service'
import { apiClient } from '../api'
import { getAccessToken } from '../auth/token-storage'

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

  profilePhoto: string
  setProfilePhoto: (url: string) => void

  email: string
  setEmail: (email: string) => void
  birthDate: string
  setBirthDate: (date: string) => void
  horoscopeTime: string
  setHoroscopeTime: (time: string) => void

  // Install banner
  installBannerDismissed: boolean
  dismissInstallBanner: () => void

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

  // Reset entire app state (logout / re-onboard)
  resetApp: () => void
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
        if (current?.date === today && current?.zodiacSign === zodiacSign) return
        const { gender } = get()
        set({
          dailyPack: {
            date: today,
            zodiacSign,
            horoscope: getHoroscope(zodiacSign).main,
            holiday: getTodayHoliday()?.name ?? '',
            supportPhrase: getRandomQuote(mood, undefined, gender).text,
          },
        })
      },

      setMood: (mood: string) => {
        const pack = get().dailyPack
        const { gender } = get()
        set({
          currentMood: mood,
          dailyPack: pack
            ? { ...pack, supportPhrase: getRandomQuote(mood, undefined, gender).text }
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

      profilePhoto: '',
      setProfilePhoto: (profilePhoto) => set({ profilePhoto }),

      email: '',
      setEmail: (email) => set({ email }),
      birthDate: '',
      setBirthDate: (birthDate) => set({ birthDate }),
      horoscopeTime: '09:00',
      setHoroscopeTime: (horoscopeTime) => {
        set({ horoscopeTime })
        // Fire-and-forget sync with backend — only when authenticated,
        // so onboarding flow before OTP verification doesn't 401.
        if (getAccessToken()) {
          apiClient.patch('profile', { pushTime: localTimeToUtc(horoscopeTime) }).catch((err) => {
            console.warn('[store] Failed to sync pushTime with backend', err)
          })
        }
      },

      installBannerDismissed: false,
      dismissInstallBanner: () => set({ installBannerDismissed: true }),

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

      resetApp: () => set({
        hasCompletedOnboarding: false,
        userName: '',
        email: '',
        birthDate: '',
        zodiacSign: '',
        gender: 'UNKNOWN',
        profilePhoto: '',
        currentMood: 'Воодушевлена',
        dailyPack: null,
        bookmarks: [],
      }),
    }),
    { name: 'happy-calendar-store' }
  )
)
