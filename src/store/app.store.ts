import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { localTimeToUtc, utcToLocal } from '../lib/time'
import { apiClient } from '../api'
import { getAccessToken, clearAuthTokens } from '../auth/token-storage'
import { getZodiac } from '../utils/zodiac'
import { getMoodImage } from '../services/content.service'

export type BookmarkType = 'гороскоп' | 'поддержка'

export interface Bookmark {
  id: string
  type: BookmarkType
  date: string
  text: string
  icon: string
}

export type OfflineTask = 
  | { type: 'ADD_BOOKMARK'; payload: Bookmark }
  | { type: 'REMOVE_BOOKMARK'; payload: { id: string } }

export interface DailyPack {
  date: string
  horoscope: {
    main: string
    detailed: string
    advice: string
    moon: string
    aspect: string
  }
  supportPhrase: string
  holiday: string | null
}

// Server response shapes
type TodayResponse = {
  date: string
  horoscope: { main: string; detailed: string; advice: string; moon: string; aspect: string }
  support: { text: string }
  holiday: { title: string } | null
}

type MoodPatchResponse = {
  currentMood: string
  support: { text: string; mood: string }
}

type BookmarkResponse = {
  id: string
  type: string
  payload: { date: string; text: string; icon: string }
  createdAt?: string
}

type AppState = {
  currentMood: string
  zodiacSign: string
  setZodiacSign: (sign: string) => void

  // Daily Pack — основной контент страницы (приходит с бэка)
  dailyPack: DailyPack | null
  // Включается ProfileSetupPage перед navigate('/home') — показывает прелоадер один раз.
  // Не персистируется: на обычных открытиях приложения всегда false.
  showOnboardingLoader: boolean
  setShowOnboardingLoader: (v: boolean) => void
  initDailyPack: () => Promise<void>
  // Меняет настроение И обновляет фразу поддержки через бэк
  setMood: (mood: string) => Promise<void>
  // "Другая фраза" — POST /api/today/support/next
  refreshSupportPhrase: () => Promise<void>
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
  installBannerDismissCount: number
  dismissInstallBanner: () => void

  // Content Preferences
  showHoroscope: boolean
  toggleHoroscope: () => void
  showHolidays: boolean
  toggleHolidays: () => void
  showSupport: boolean
  toggleSupport: () => void
  syncProfile: () => Promise<void>

  // Bookmarks (sync с бэком)
  bookmarks: Bookmark[]
  offlineQueue: OfflineTask[]
  fetchBookmarks: () => Promise<void>
  addBookmark: (bookmark: Bookmark) => Promise<void>
  removeBookmark: (id: string) => Promise<void>
  processOfflineQueue: () => Promise<void>

  // Logout / re-onboard
  resetApp: () => Promise<void>
}

function delay(ms: number) {
  return new Promise<void>(resolve => setTimeout(resolve, ms))
}

function preloadImage(src: string) {
  if (typeof window === 'undefined' || !src) return Promise.resolve()

  return new Promise<void>(resolve => {
    const img = new Image()
    img.onload = () => resolve()
    img.onerror = () => resolve()
    img.src = src
  })
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentMood: 'Нормально',
      zodiacSign: '',
      setZodiacSign: (sign) => set({ zodiacSign: sign }),

      // Daily Pack
      dailyPack: null,
      showOnboardingLoader: false,
      offlineQueue: [],
      setShowOnboardingLoader: (v) => set({ showOnboardingLoader: v }),

      initDailyPack: async () => {
        if (!getAccessToken()) {
          set({ showOnboardingLoader: false })
          return
        }
        // Если показываем прелоадер — держим минимум 6 сек для плавного UX
        const isLoaderShowing = get().showOnboardingLoader
        const minWait = isLoaderShowing ? delay(6000) : Promise.resolve()
        try {
          const { data } = await apiClient.get<TodayResponse>('today')
          const nextPack = {
            date: data.date,
            horoscope: data.horoscope,
            supportPhrase: data.support.text,
            holiday: data.holiday?.title ?? null,
          }

          set({ dailyPack: nextPack })

          if (isLoaderShowing) {
            await Promise.all([
              minWait,
              preloadImage(getMoodImage(get().currentMood)),
            ])
          }

          set({
            showOnboardingLoader: false,
          })
        } catch (err) {
          console.warn('[store] Failed to fetch /today', err)
          await minWait
          set({ showOnboardingLoader: false })
        }
      },

      setMood: async (mood: string) => {
        // Optimistic UI update
        set({ currentMood: mood })

        if (!getAccessToken()) return
        try {
          const { data } = await apiClient.patch<MoodPatchResponse>('profile/mood', { mood })
          const pack = get().dailyPack
          if (pack) {
            set({ dailyPack: { ...pack, supportPhrase: data.support.text } })
          }
        } catch (err) {
          console.warn('[store] Failed to PATCH /profile/mood', err)
        }
      },

      refreshSupportPhrase: async () => {
        if (!getAccessToken()) return
        try {
          const { data } = await apiClient.post<{ support: { text: string } }>('today/support/next')
          const pack = get().dailyPack
          if (pack) {
            set({ dailyPack: { ...pack, supportPhrase: data.support.text } })
          }
        } catch (err) {
          console.warn('[store] Failed to POST /today/support/next', err)
        }
      },

      setSupportPhrase: (phrase: string) => {
        const pack = get().dailyPack
        if (!pack) return
        set({ dailyPack: { ...pack, supportPhrase: phrase } })
      },

      // User Profile defaults
      userName: '',
      setUserName: (userName) => {
        set({ userName })
        if (getAccessToken()) {
          apiClient.patch('profile', { name: userName }).catch((err) => {
            console.warn('[store] Failed to sync name with backend', err)
          })
        }
      },
      gender: 'UNKNOWN',
      setGender: (gender) => {
        set({ gender })
        if (getAccessToken()) {
          apiClient.patch('profile', { gender }).catch((err) => {
            console.warn('[store] Failed to sync gender with backend', err)
          })
        }
      },
      hasCompletedOnboarding: false,
      setHasCompletedOnboarding: (hasCompletedOnboarding) => set({ hasCompletedOnboarding }),

      profilePhoto: '',
      setProfilePhoto: (profilePhoto) => {
        set({ profilePhoto })
        if (getAccessToken()) {
          apiClient.patch('profile', { avatarUrl: profilePhoto }).catch((err) => {
            console.warn('[store] Failed to sync avatarUrl with backend', err)
          })
        }
      },

      email: '',
      setEmail: (email) => set({ email: email.trim() }),
      birthDate: '',
      setBirthDate: (birthDate) => {
        const prevSign = get().zodiacSign
        const newSign = getZodiac(birthDate)
        
        set({ birthDate, zodiacSign: newSign ?? prevSign })
        
        if (getAccessToken()) {
          apiClient.patch('profile', { 
            birthdate: birthDate,
            zodiacSign: newSign ?? prevSign
          }).then(() => {
            // If sign changed, we MUST refresh the daily pack to get new horoscope
            if (newSign && newSign !== prevSign) {
              void get().initDailyPack()
            }
          }).catch((err) => {
            console.warn('[store] Failed to sync birthdate with backend', err)
          })
        }
      },
      horoscopeTime: '09:00',
      setHoroscopeTime: (horoscopeTime) => {
        set({ horoscopeTime })
        if (getAccessToken()) {
          apiClient.patch('profile', { pushTime: localTimeToUtc(horoscopeTime) }).catch((err) => {
            console.warn('[store] Failed to sync pushTime with backend', err)
          })
        }
      },

      installBannerDismissCount: 0,
      dismissInstallBanner: () => {
        const current = get().installBannerDismissCount
        set({ installBannerDismissCount: current + 1 })
      },

      showHoroscope: true,
      toggleHoroscope: () => {
        const next = !get().showHoroscope
        set({ showHoroscope: next })
        if (getAccessToken()) {
          apiClient.patch('profile', { horoscopeEnabled: next }).catch((err) => {
            console.warn('[store] Failed to sync horoscopeEnabled with backend', err)
            set({ showHoroscope: !next })
          })
        }
      },
      showHolidays: false,
      toggleHolidays: () => {
        const next = !get().showHolidays
        set({ showHolidays: next })
        if (getAccessToken()) {
          apiClient.patch('profile', { holidaysEnabled: next }).catch((err) => {
            console.warn('[store] Failed to sync holidaysEnabled with backend', err)
            set({ showHolidays: !next })
          })
        }
      },
      showSupport: true,
      toggleSupport: () => {
        const next = !get().showSupport
        set({ showSupport: next })
        if (getAccessToken()) {
          apiClient.patch('profile', { supportEnabled: next }).catch((err) => {
            console.warn('[store] Failed to sync supportEnabled with backend', err)
            set({ showSupport: !next })
          })
        }
      },

      syncProfile: async () => {
        if (!getAccessToken()) return
        try {
          const { data } = await apiClient.get<{
            user?: { email?: string; name?: string | null }
            profile?: {
              birthdate?: string | null
              zodiacSign?: string | null
              gender?: 'F' | 'M' | 'UNKNOWN' | string | null
              avatarUrl?: string | null
              currentMood?: string | null
            } | null
            prefs?: {
              pushTime?: string | null
              horoscopeEnabled?: boolean | null
              holidaysEnabled?: boolean | null
              supportEnabled?: boolean | null
            } | null
          }>('profile')

          set({
            email: data.user?.email ?? get().email,
            userName: data.user?.name ?? get().userName,
            birthDate: data.profile?.birthdate ?? get().birthDate,
            zodiacSign: data.profile?.zodiacSign ?? get().zodiacSign,
            hasCompletedOnboarding:
              Boolean(data.profile?.birthdate && data.profile?.zodiacSign) || get().hasCompletedOnboarding,
            gender: (data.profile?.gender as 'F' | 'M' | 'UNKNOWN' | undefined) ?? get().gender,
            profilePhoto: data.profile?.avatarUrl ?? get().profilePhoto,
            currentMood: data.profile?.currentMood ?? get().currentMood,
            horoscopeTime: data.prefs?.pushTime ? utcToLocal(data.prefs.pushTime) : get().horoscopeTime,
            showHoroscope: data.prefs?.horoscopeEnabled ?? get().showHoroscope,
            showHolidays: data.prefs?.holidaysEnabled ?? get().showHolidays,
            showSupport: data.prefs?.supportEnabled ?? get().showSupport,
          })
        } catch (err) {
          console.warn('[store] Failed to fetch /profile', err)
        }
      },

      // Bookmarks
      bookmarks: [],

      fetchBookmarks: async () => {
        if (!getAccessToken()) return
        try {
          const { data } = await apiClient.get<BookmarkResponse[]>('bookmarks')
          set({
            bookmarks: data.map((b) => ({
              id: b.id,
              type: b.type as BookmarkType,
              date: b.payload?.date ?? '',
              text: b.payload?.text ?? '',
              icon: b.payload?.icon ?? 'bookmark',
            })),
          })
        } catch (err) {
          console.warn('[store] Failed to fetch /bookmarks', err)
        }
      },

      addBookmark: async (bookmark: Bookmark) => {
        // Optimistic add
        set((state) => ({ bookmarks: [bookmark, ...state.bookmarks] }))

        if (!getAccessToken()) {
          set((state) => ({ offlineQueue: [...state.offlineQueue, { type: 'ADD_BOOKMARK', payload: bookmark }] }))
          return
        }

        try {
          const { data } = await apiClient.post<BookmarkResponse>('bookmarks', {
            type: bookmark.type,
            payload: { date: bookmark.date, text: bookmark.text, icon: bookmark.icon },
          })
          // Use backend-generated id
          set((state) => ({
            bookmarks: state.bookmarks.map(b => b.id === bookmark.id ? { ...b, id: data.id } : b),
          }))
        } catch (err) {
          console.warn('[store] Failed to POST /bookmarks', err)
          set((state) => ({ offlineQueue: [...state.offlineQueue, { type: 'ADD_BOOKMARK', payload: bookmark }] }))
        }
      },

      removeBookmark: async (id: string) => {
        // Optimistic remove
        const prev = get().bookmarks
        set({ bookmarks: prev.filter((b) => b.id !== id) })

        if (!getAccessToken()) {
          set((state) => ({ offlineQueue: [...state.offlineQueue, { type: 'REMOVE_BOOKMARK', payload: { id } }] }))
          return
        }

        try {
          await apiClient.delete(`bookmarks/${id}`)
        } catch (err) {
          console.warn('[store] Failed to DELETE /bookmarks/:id', err)
          set((state) => ({ offlineQueue: [...state.offlineQueue, { type: 'REMOVE_BOOKMARK', payload: { id } }] }))
        }
      },

      processOfflineQueue: async () => {
        const queue = [...get().offlineQueue]
        if (queue.length === 0 || !getAccessToken()) return

        console.log('[store] Processing offline queue...', queue.length, 'tasks')

        const processedIndexes = new Set<number>()

        for (let i = 0; i < queue.length; i++) {
          const task = queue[i]
          try {
            if (task.type === 'ADD_BOOKMARK') {
              const { data } = await apiClient.post<BookmarkResponse>('bookmarks', {
                type: task.payload.type,
                payload: { date: task.payload.date, text: task.payload.text, icon: task.payload.icon },
              })
              set((state) => ({
                bookmarks: state.bookmarks.map(b => b.id === task.payload.id ? { ...b, id: data.id } : b)
              }))
            } else if (task.type === 'REMOVE_BOOKMARK') {
              await apiClient.delete(`bookmarks/${task.payload.id}`)
            }
            processedIndexes.add(i)
          } catch (err) {
            console.error(`[store] Queue task failed:`, task, err)
          }
        }

        // Remove only successfully processed tasks — failed ones stay for retry
        set({ offlineQueue: queue.filter((_, i) => !processedIndexes.has(i)) })
      },

      resetApp: async () => {
        if (getAccessToken()) {
          try {
            await apiClient.post('auth/logout')
          } catch (err) {
            console.warn('[store] Logout API call failed', err)
          }
        }
        clearAuthTokens()
        set({
          hasCompletedOnboarding: false,
          userName: '',
          email: '',
          birthDate: '',
          zodiacSign: '',
          gender: 'UNKNOWN',
          profilePhoto: '',
          currentMood: 'Нормально',
          dailyPack: null,
          bookmarks: [],
          offlineQueue: [],
          installBannerDismissCount: 0,
        })
      },
    }),
    {
      name: 'yoyojoy-store',
      version: 1,
      // showOnboardingLoader исключён из persist — на повторных открытиях всегда false
      partialize: (state) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { showOnboardingLoader, setShowOnboardingLoader, ...rest } = state
        return rest
      },
    }
  )
)
