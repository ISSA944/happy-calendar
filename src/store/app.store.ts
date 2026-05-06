import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { localTimeToUtc } from '../lib/time'
import { apiClient } from '../api'
import { getAccessToken, clearAuthTokens } from '../auth/token-storage'
import { clearStoredFcmToken } from '../lib/firebase'

export type BookmarkType = 'гороскоп' | 'поддержка'

export interface Bookmark {
  id: string
  type: BookmarkType
  date: string
  text: string
  icon: string
}

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
  installBannerDismissed: boolean
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
  fetchBookmarks: () => Promise<void>
  addBookmark: (bookmark: Bookmark) => Promise<void>
  removeBookmark: (id: string) => Promise<void>

  // Logout / re-onboard
  resetApp: () => Promise<void>
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
      setShowOnboardingLoader: (v) => set({ showOnboardingLoader: v }),

      initDailyPack: async () => {
        if (!getAccessToken()) {
          set({ showOnboardingLoader: false })
          return
        }
        // Если показываем прелоадер — держим минимум 4.5 сек для плавного UX
        const isLoaderShowing = get().showOnboardingLoader
        const minWait = isLoaderShowing
          ? new Promise<void>(r => setTimeout(r, 4500))
          : Promise.resolve()
        try {
          const [{ data }] = await Promise.all([
            apiClient.get<TodayResponse>('today'),
            minWait,
          ])
          set({
            dailyPack: {
              date: data.date,
              horoscope: data.horoscope,
              supportPhrase: data.support.text,
              holiday: data.holiday?.title ?? null,
            },
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
      setUserName: (userName) => set({ userName }),
      gender: 'UNKNOWN',
      setGender: (gender) => set({ gender }),
      hasCompletedOnboarding: false,
      setHasCompletedOnboarding: (hasCompletedOnboarding) => set({ hasCompletedOnboarding }),

      profilePhoto: '',
      setProfilePhoto: (profilePhoto) => set({ profilePhoto }),

      email: '',
      setEmail: (email) => {
        const next = email.trim()
        const prev = get().email
        set({ email: next })
        if (getAccessToken()) {
          apiClient.patch('profile', { email: next }).catch((err) => {
            console.warn('[store] Failed to sync email with backend', err)
            set({ email: prev })
          })
        }
      },
      birthDate: '',
      setBirthDate: (birthDate) => {
        set({ birthDate })
        if (getAccessToken()) {
          apiClient.patch('profile', { birthdate: birthDate }).catch((err) => {
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

      installBannerDismissed: false,
      dismissInstallBanner: () => set({ installBannerDismissed: true }),

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
            horoscopeTime: data.prefs?.pushTime ?? get().horoscopeTime,
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
        if (!getAccessToken()) {
          // Offline fallback — keep local-only id
          set((state) => ({ bookmarks: [bookmark, ...state.bookmarks] }))
          return
        }
        try {
          const { data } = await apiClient.post<BookmarkResponse>('bookmarks', {
            type: bookmark.type,
            payload: { date: bookmark.date, text: bookmark.text, icon: bookmark.icon },
          })
          // Use backend-generated id
          set((state) => ({
            bookmarks: [{ ...bookmark, id: data.id }, ...state.bookmarks],
          }))
        } catch (err) {
          console.warn('[store] Failed to POST /bookmarks', err)
        }
      },

      removeBookmark: async (id: string) => {
        // Optimistic remove
        const prev = get().bookmarks
        set({ bookmarks: prev.filter((b) => b.id !== id) })

        if (!getAccessToken()) return
        try {
          await apiClient.delete(`bookmarks/${id}`)
        } catch (err) {
          console.warn('[store] Failed to DELETE /bookmarks/:id', err)
          // Rollback on server failure
          set({ bookmarks: prev })
        }
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
        clearStoredFcmToken()
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
        })
      },
    }),
    {
      name: 'yoyojoy-store',
      // showOnboardingLoader исключён из persist — на повторных открытиях всегда false
      partialize: (state) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { showOnboardingLoader, setShowOnboardingLoader, ...rest } = state
        return rest
      },
    }
  )
)
