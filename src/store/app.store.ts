import { create } from 'zustand'

export type BookmarkType = 'гороскоп' | 'поддержка'

export interface Bookmark {
  id: string
  type: BookmarkType
  date: string
  text: string
  icon: string
}

type AppState = {
  isHydrated: boolean
  setHydrated: (value: boolean) => void
  currentMood: string
  setCurrentMood: (mood: string) => void
  zodiacSign: string
  setZodiacSign: (sign: string) => void
  
  // User Profile
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

export const useAppStore = create<AppState>((set) => ({
  isHydrated: false,
  setHydrated: (isHydrated) => set({ isHydrated }),
  currentMood: 'Воодушевлена',
  setCurrentMood: (mood) => set({ currentMood: mood }),
  zodiacSign: 'Лев ♌︎',
  setZodiacSign: (sign) => set({ zodiacSign: sign }),

  // Defaults
  email: 'example@mail.com',
  setEmail: (email) => set({ email }),
  birthDate: '12.03.1994',
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
    bookmarks: [bookmark, ...state.bookmarks]
  })),
  removeBookmark: (id) => set((state) => ({
    bookmarks: state.bookmarks.filter((b) => b.id !== id)
  })),
}))
