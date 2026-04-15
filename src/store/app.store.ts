import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type BookmarkType = 'гороскоп' | 'поддержка'

export interface Bookmark {
  id: string
  type: BookmarkType
  date: string
  text: string
  icon: string
}

type AppState = {
  currentMood: string
  setCurrentMood: (mood: string) => void
  zodiacSign: string
  setZodiacSign: (sign: string) => void

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
    (set) => ({
      currentMood: 'Воодушевлена',
      setCurrentMood: (mood) => set({ currentMood: mood }),
      zodiacSign: '',
      setZodiacSign: (sign) => set({ zodiacSign: sign }),

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
