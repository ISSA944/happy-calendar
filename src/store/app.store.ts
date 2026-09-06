import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { apiClient } from '../api'
import { getAccessToken, clearAuthTokens } from '../auth/token-storage'
import { getZodiac } from '../utils/zodiac'
import { getMoodImage } from '../services/content.service'
import { useRegistrationDraft } from './registrationDraft.store'
import { useEmailChangeDraft } from './emailChangeDraft.store'

export type BookmarkType = 'гороскоп' | 'поддержка' | 'открытка' | 'забота'

export interface Bookmark {
  id: string
  type: BookmarkType
  date: string
  text: string
  icon: string
  imageUrl?: string
  title?: string
  tone?: Tone
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
  contentSource: 'ai' | 'stored' | 'fallback'
}

// ── Goals ────────────────────────────────────────────────────────────────
export interface GoalView {
  id: string
  title: string
  sub: string
  emoji: string
  active: boolean
  progress: number
}

// ── Holidays (ТЗ п. 4.3/5) ──────────────────────────────────────────────
export interface HolidayCard {
  id: string
  date: string
  title: string
  scope: string // 'ru' | 'intl'
  themeKey: string
  imageUrl: string | null
  postcardReady: boolean
}
export type Tone = 'cute' | 'humor' | 'cynical'
export interface HolidayCardWithText extends HolidayCard {
  tone: Tone
  text: string
}

// ── Personal care day (ТЗ п. 6.1) ───────────────────────────────────────
export interface PersonalCareView {
  id: string
  title: string
  task: string
  affirmation: string
  goalTags: string[]
  themeKey: string
  imageUrl: string | null
  doneToday: boolean
}
export interface MilestoneHit {
  goalId: string
  goalTitle: string
  count: number
  emoji: string
}

// Server response shapes
type TodayResponse = {
  date: string
  horoscope: {
    main: string
    detailed: string
    advice: string
    moon: string
    aspect: string
  }
  support: { text: string }
  holiday: { title: string } | null
  meta?: {
    contentSource: 'ai' | 'stored' | 'fallback'
    retryAfterSeconds?: number
  }
}

type MoodPatchResponse = {
  currentMood: string
  support: { text: string; mood: string }
}

type BookmarkResponse = {
  id: string
  type: string
  payload: {
    date: string
    text: string
    icon: string
    imageUrl?: string
    title?: string
    tone?: Tone
  }
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
  initDailyPack: (options?: { force?: boolean }) => Promise<void>
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
  showPersonalCare: boolean
  togglePersonalCare: () => void
  // Per-category push times (ТЗ п. 4.5) — horoscopeTime уже существовал, остальные новые.
  supportTime: string
  setSupportTime: (time: string) => void
  holidaysTime: string
  setHolidaysTime: (time: string) => void
  personalCareTime: string
  setPersonalCareTime: (time: string) => void
  syncProfile: () => Promise<boolean | null>

  // Goals (ТЗ п. 4.2/4.5/6.4)
  goals: GoalView[]
  fetchGoals: () => Promise<void>
  setGoals: (selected: string[]) => Promise<void>

  // Holidays today (ТЗ п. 4.3/5)
  todayHolidays: HolidayCard[]
  fetchHolidaysToday: () => Promise<void>
  getHolidayCard: (id: string, tone: Tone) => Promise<HolidayCardWithText>

  // Personal care day (ТЗ п. 6.1) — карточка на каждую активную цель юзера (1-4), не одна ротируемая.
  personalCareToday: PersonalCareView[]
  fetchPersonalCareToday: () => Promise<void>
  completePersonalCare: (goalId: string) => Promise<MilestoneHit[]>

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

let fallbackRetryTimer: ReturnType<typeof setTimeout> | null = null

const dailyRequests = new Map<string, Promise<void>>()
let loadedDailyKey: string | null = null
let contentGeneration = 0
function dailyRequestKey(state: AppState) {
  const now = new Date()
  const date = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`
  // Identity only, not authorization: token refresh must not discard a valid response.
  const token = getAccessToken()
  let subject: string | null = token ? state.email : null
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))) as { sub?: string }
      if (typeof payload.sub === 'string') subject = payload.sub
    } catch { /* Invalid tokens are rejected by the API, never trusted here. */ }
  }
  return JSON.stringify([subject, state.email, state.zodiacSign, state.currentMood, date, contentGeneration])
}

function clearFallbackRetry() {
  if (fallbackRetryTimer !== null) {
    clearTimeout(fallbackRetryTimer)
    fallbackRetryTimer = null
  }
}

function preloadImage(src: string) {
  if (typeof window === 'undefined' || !src) return Promise.resolve()

  return new Promise<void>(resolve => {
    const img = new Image()
    let settled = false
    const timeoutId = window.setTimeout(settle, 4_000)

    function settle() {
      if (settled) return
      settled = true
      window.clearTimeout(timeoutId)
      resolve()
    }

    img.onload = settle
    img.onerror = settle
    img.src = src
  })
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isPersistedDailyPack(value: unknown): value is DailyPack {
  if (!isRecord(value) || !isRecord(value.horoscope)) return false

  return (
    typeof value.date === 'string' &&
    typeof value.supportPhrase === 'string' &&
    typeof value.horoscope.main === 'string' &&
    typeof value.horoscope.detailed === 'string' &&
    typeof value.horoscope.advice === 'string' &&
    typeof value.horoscope.moon === 'string' &&
    typeof value.horoscope.aspect === 'string'
  )
}

/**
 * Old mobile sessions can survive many deployments. Never let an outdated or
 * partially-written local cache replace collection defaults with null/objects:
 * Home renders these collections before the first server refresh and would
 * otherwise fall into the global error screen.
 */
export function sanitizePersistedAppState(value: unknown): Record<string, unknown> {
  if (!isRecord(value)) return {}

  return {
    ...value,
    bookmarks: Array.isArray(value.bookmarks) ? value.bookmarks : [],
    offlineQueue: Array.isArray(value.offlineQueue) ? value.offlineQueue : [],
    goals: Array.isArray(value.goals) ? value.goals : [],
    todayHolidays: Array.isArray(value.todayHolidays) ? value.todayHolidays : [],
    personalCareToday: Array.isArray(value.personalCareToday)
      ? value.personalCareToday.filter(item => isRecord(item) && Array.isArray(item.goalTags))
      : [],
    dailyPack: isPersistedDailyPack(value.dailyPack) ? value.dailyPack : null,
  }
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentMood: 'Нормально',
      zodiacSign: '',
      setZodiacSign: sign => set({ zodiacSign: sign }),

      // Daily Pack
      dailyPack: null,
      showOnboardingLoader: false,
      offlineQueue: [],
      setShowOnboardingLoader: v => set({ showOnboardingLoader: v }),

      initDailyPack: async (options) => {
        if (!getAccessToken()) {
          set({ showOnboardingLoader: false })
          return
        }

        const key = dailyRequestKey(get())
        const pending = dailyRequests.get(key)
        if (pending) return pending
        if (!options?.force && loadedDailyKey === key && get().dailyPack) {
          set({ showOnboardingLoader: false })
          return
        }
        const request = (async () => {

        // Clear stale pack from previous day so yesterday's content isn't shown while fetching
        const stored = get().dailyPack
        if (stored) {
          const now = new Date()
          const clientToday = `${String(now.getDate()).padStart(2, '0')}.${String(now.getMonth() + 1).padStart(2, '0')}`
          if (stored.date !== clientToday) {
            set({ dailyPack: null })
          }
        }

        // Если показываем прелоадер — держим минимум 6 сек для плавного UX
        const isLoaderShowing = get().showOnboardingLoader
        const minWait = isLoaderShowing ? delay(6000) : Promise.resolve()
        try {
          const { data } = await apiClient.get<TodayResponse>('today')
          if (dailyRequestKey(get()) !== key) return
          const nextPack = {
            date: data.date,
            horoscope: data.horoscope,
            supportPhrase: data.support.text,
            holiday: data.holiday?.title ?? null,
            contentSource: data.meta?.contentSource ?? 'stored',
          }

          set({ dailyPack: nextPack })
          loadedDailyKey = key

          clearFallbackRetry()
          if (data.meta?.contentSource === 'fallback') {
            const retryAfterSeconds = data.meta.retryAfterSeconds ?? 300
            fallbackRetryTimer = setTimeout(() => {
              fallbackRetryTimer = null
              void get().initDailyPack({ force: true })
            }, retryAfterSeconds * 1000)
          }

          if (isLoaderShowing) {
            await Promise.all([minWait, preloadImage(getMoodImage(get().currentMood))])
          }

          if (dailyRequestKey(get()) !== key) return

          set({
            showOnboardingLoader: false,
          })
        } catch (err) {
          console.warn('[store] Failed to fetch /today', err)
          await minWait
          if (dailyRequestKey(get()) === key) set({ showOnboardingLoader: false })
        }
        })()
        dailyRequests.set(key, request)
        try { await request } finally { if (dailyRequests.get(key) === request) dailyRequests.delete(key) }
      },

      setMood: async (mood: string) => {
        contentGeneration++
        // Optimistic UI update
        set({ currentMood: mood })

        if (!getAccessToken()) return
        const key = dailyRequestKey(get())
        try {
          const { data } = await apiClient.patch<MoodPatchResponse>('profile/mood', { mood })
          if (dailyRequestKey(get()) !== key) return
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
        const key = dailyRequestKey(get())
        try {
          const { data } = await apiClient.post<{ support: { text: string } }>('today/support/next')
          if (dailyRequestKey(get()) !== key) return
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
      setUserName: userName => set({ userName }),
      gender: 'UNKNOWN',
      setGender: gender => {
        set({ gender })
        if (getAccessToken()) {
          apiClient.patch('profile', { gender }).catch(err => {
            console.warn('[store] Failed to sync gender with backend', err)
          })
        }
      },
      hasCompletedOnboarding: false,
      setHasCompletedOnboarding: hasCompletedOnboarding => set({ hasCompletedOnboarding }),

      profilePhoto: '',
      setProfilePhoto: profilePhoto => {
        set({ profilePhoto })
        if (getAccessToken()) {
          apiClient.patch('profile', { avatarUrl: profilePhoto }).catch(err => {
            console.warn('[store] Failed to sync avatarUrl with backend', err)
          })
        }
      },

      email: '',
      setEmail: email => set({ email: email.trim() }),
      birthDate: '',
      setBirthDate: birthDate => {
        const prevSign = get().zodiacSign
        const newSign = getZodiac(birthDate)

        set({ birthDate, zodiacSign: newSign ?? prevSign })

        if (getAccessToken()) {
          apiClient
            .patch('profile', {
              birthdate: birthDate,
              zodiacSign: newSign ?? prevSign,
            })
            .then(() => {
              // If sign changed, we MUST refresh the daily pack to get new horoscope
              if (newSign && newSign !== prevSign) {
                void get().initDailyPack()
              }
            })
            .catch(err => {
              console.warn('[store] Failed to sync birthdate with backend', err)
            })
        }
      },
      horoscopeTime: '09:00',
      setHoroscopeTime: horoscopeTime => {
        set({ horoscopeTime })
        if (getAccessToken()) {
          apiClient.patch('profile', { horoscopeTime }).catch(err => {
            console.warn('[store] Failed to sync horoscopeTime with backend', err)
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
          apiClient.patch('profile', { horoscopeEnabled: next }).catch(err => {
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
          apiClient.patch('profile', { holidaysEnabled: next }).catch(err => {
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
          apiClient.patch('profile', { supportEnabled: next }).catch(err => {
            console.warn('[store] Failed to sync supportEnabled with backend', err)
            set({ showSupport: !next })
          })
        }
      },
      showPersonalCare: true,
      togglePersonalCare: () => {
        const next = !get().showPersonalCare
        set({ showPersonalCare: next })
        if (getAccessToken()) {
          apiClient.patch('profile', { personalCareEnabled: next }).catch(err => {
            console.warn('[store] Failed to sync personalCareEnabled with backend', err)
            set({ showPersonalCare: !next })
          })
        }
      },

      supportTime: '12:00',
      setSupportTime: supportTime => {
        set({ supportTime })
        if (getAccessToken()) {
          apiClient.patch('profile', { supportTime }).catch(err => {
            console.warn('[store] Failed to sync supportTime with backend', err)
          })
        }
      },
      holidaysTime: '10:00',
      setHolidaysTime: holidaysTime => {
        set({ holidaysTime })
        if (getAccessToken()) {
          apiClient.patch('profile', { holidaysTime }).catch(err => {
            console.warn('[store] Failed to sync holidaysTime with backend', err)
          })
        }
      },
      personalCareTime: '08:30',
      setPersonalCareTime: personalCareTime => {
        set({ personalCareTime })
        if (getAccessToken()) {
          apiClient.patch('profile', { personalCareTime }).catch(err => {
            console.warn('[store] Failed to sync personalCareTime with backend', err)
          })
        }
      },

      goals: [],
      fetchGoals: async () => {
        if (!getAccessToken()) return
        try {
          const { data } = await apiClient.get<GoalView[]>('goals')
          set({ goals: data })
        } catch (err) {
          console.warn('[store] Failed to fetch /goals', err)
        }
      },
      setGoals: async (selected: string[]) => {
        if (!getAccessToken()) return
        try {
          const { data } = await apiClient.patch<GoalView[]>('goals', {
            selected,
          })
          set({ goals: data })
        } catch (err) {
          console.warn('[store] Failed to PATCH /goals', err)
        }
      },

      todayHolidays: [],
      fetchHolidaysToday: async () => {
        if (!getAccessToken()) return
        try {
          const { data } = await apiClient.get<HolidayCard[]>('holidays/today')
          set({ todayHolidays: data })
        } catch (err) {
          console.warn('[store] Failed to fetch /holidays/today', err)
        }
      },
      getHolidayCard: async (id: string, tone: Tone) => {
        const { data } = await apiClient.get<HolidayCardWithText>(`holidays/${id}/card`, { params: { tone } })
        return data
      },

      personalCareToday: [],
      fetchPersonalCareToday: async () => {
        if (!getAccessToken()) return
        try {
          const { data } = await apiClient.get<PersonalCareView[]>('personal-care/today')
          set({ personalCareToday: data })
        } catch (err) {
          console.warn('[store] Failed to fetch /personal-care/today', err)
        }
      },
      completePersonalCare: async (goalId: string) => {
        const items = get().personalCareToday
        const item = items.find(c => c.goalTags.includes(goalId))
        if (!item || !getAccessToken()) return []
        try {
          const { data } = await apiClient.post<{
            alreadyDone: boolean
            milestoneHits: MilestoneHit[]
          }>(`personal-care/${item.id}/complete`, { goalId })
          set({
            personalCareToday: items.map(c => (c.goalTags.includes(goalId) ? { ...c, doneToday: true } : c)),
          })
          void get().fetchGoals()
          return data.milestoneHits
        } catch (err) {
          console.warn('[store] Failed to POST /personal-care/:id/complete', err)
          return []
        }
      },

      syncProfile: async () => {
        if (!getAccessToken()) return null
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
              horoscopeTime?: string | null
              supportTime?: string | null
              holidaysTime?: string | null
              personalCareTime?: string | null
              horoscopeEnabled?: boolean | null
              holidaysEnabled?: boolean | null
              supportEnabled?: boolean | null
              personalCareEnabled?: boolean | null
            } | null
          }>('profile')

          const hasCompletedOnboarding = Boolean(data.profile?.birthdate && data.profile?.zodiacSign)

          set({
            email: data.user?.email ?? get().email,
            userName: data.user?.name ?? get().userName,
            birthDate: data.profile?.birthdate ?? '',
            zodiacSign: data.profile?.zodiacSign ?? '',
            hasCompletedOnboarding,
            gender: (data.profile?.gender as 'F' | 'M' | 'UNKNOWN' | undefined) ?? 'UNKNOWN',
            profilePhoto: data.profile?.avatarUrl ?? '',
            currentMood: data.profile?.currentMood ?? 'Нормально',
            horoscopeTime: data.prefs?.horoscopeTime ?? data.prefs?.pushTime ?? get().horoscopeTime,
            supportTime: data.prefs?.supportTime ?? get().supportTime,
            holidaysTime: data.prefs?.holidaysTime ?? get().holidaysTime,
            personalCareTime: data.prefs?.personalCareTime ?? get().personalCareTime,
            showHoroscope: data.prefs?.horoscopeEnabled ?? get().showHoroscope,
            showHolidays: data.prefs?.holidaysEnabled ?? get().showHolidays,
            showSupport: data.prefs?.supportEnabled ?? get().showSupport,
            showPersonalCare: data.prefs?.personalCareEnabled ?? get().showPersonalCare,
          })
          return hasCompletedOnboarding
        } catch (err) {
          console.warn('[store] Failed to fetch /profile', err)
          return null
        }
      },

      // Bookmarks
      bookmarks: [],

      fetchBookmarks: async () => {
        if (!getAccessToken()) return
        try {
          const { data } = await apiClient.get<BookmarkResponse[]>('bookmarks')
          set({
            bookmarks: data.map(b => ({
              id: b.id,
              type: b.type as BookmarkType,
              date: b.payload?.date ?? '',
              text: b.payload?.text ?? '',
              icon: b.payload?.icon ?? 'bookmark',
              imageUrl: b.payload?.imageUrl,
              title: b.payload?.title,
              tone: b.payload?.tone,
            })),
          })
        } catch (err) {
          console.warn('[store] Failed to fetch /bookmarks', err)
        }
      },

      addBookmark: async (bookmark: Bookmark) => {
        // Optimistic add
        set(state => ({ bookmarks: [bookmark, ...state.bookmarks] }))

        if (!getAccessToken()) {
          set(state => ({
            offlineQueue: [...state.offlineQueue, { type: 'ADD_BOOKMARK', payload: bookmark }],
          }))
          return
        }

        try {
          const { data } = await apiClient.post<BookmarkResponse>('bookmarks', {
            type: bookmark.type,
            payload: {
              date: bookmark.date,
              text: bookmark.text,
              icon: bookmark.icon,
              imageUrl: bookmark.imageUrl,
              title: bookmark.title,
              tone: bookmark.tone,
            },
          })
          // Use backend-generated id
          set(state => ({
            bookmarks: state.bookmarks.map(b => (b.id === bookmark.id ? { ...b, id: data.id } : b)),
          }))
        } catch (err) {
          console.warn('[store] Failed to POST /bookmarks', err)
          set(state => ({
            offlineQueue: [...state.offlineQueue, { type: 'ADD_BOOKMARK', payload: bookmark }],
          }))
        }
      },

      removeBookmark: async (id: string) => {
        // Optimistic remove
        const prev = get().bookmarks
        set({ bookmarks: prev.filter(b => b.id !== id) })

        if (!getAccessToken()) {
          set(state => ({
            offlineQueue: [...state.offlineQueue, { type: 'REMOVE_BOOKMARK', payload: { id } }],
          }))
          return
        }

        try {
          await apiClient.delete(`bookmarks/${id}`)
        } catch (err) {
          console.warn('[store] Failed to DELETE /bookmarks/:id', err)
          set(state => ({
            offlineQueue: [...state.offlineQueue, { type: 'REMOVE_BOOKMARK', payload: { id } }],
          }))
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
                payload: {
                  date: task.payload.date,
                  text: task.payload.text,
                  icon: task.payload.icon,
                  imageUrl: task.payload.imageUrl,
                  title: task.payload.title,
                  tone: task.payload.tone,
                },
              })
              set(state => ({
                bookmarks: state.bookmarks.map(b => (b.id === task.payload.id ? { ...b, id: data.id } : b)),
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
        contentGeneration++
        loadedDailyKey = null
        clearFallbackRetry()
        if (getAccessToken()) {
          try {
            await apiClient.post('auth/logout')
          } catch (err) {
            console.warn('[store] Logout API call failed', err)
          }
        }
        clearAuthTokens()
        useRegistrationDraft.getState().clear()
        useEmailChangeDraft.getState().clear()
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
          goals: [],
          todayHolidays: [],
          personalCareToday: [],
        })
      },
    }),
    {
      name: 'yoyojoy-store',
      version: 2,
      migrate: persistedState => sanitizePersistedAppState(persistedState),
      merge: (persistedState, currentState) =>
        ({
          ...currentState,
          ...sanitizePersistedAppState(persistedState),
          showOnboardingLoader: false,
          email: '',
        }) as AppState,
      // showOnboardingLoader исключён из persist — на повторных открытиях всегда false
      partialize: state => ({
        currentMood: state.currentMood,
        zodiacSign: state.zodiacSign,
        dailyPack: state.dailyPack,
        userName: state.userName,
        gender: state.gender,
        hasCompletedOnboarding: state.hasCompletedOnboarding,
        profilePhoto: state.profilePhoto,
        birthDate: state.birthDate,
        horoscopeTime: state.horoscopeTime,
        installBannerDismissCount: state.installBannerDismissCount,
        showHoroscope: state.showHoroscope,
        showHolidays: state.showHolidays,
        showSupport: state.showSupport,
        showPersonalCare: state.showPersonalCare,
        supportTime: state.supportTime,
        holidaysTime: state.holidaysTime,
        personalCareTime: state.personalCareTime,
        goals: state.goals,
        todayHolidays: state.todayHolidays,
        personalCareToday: state.personalCareToday,
        bookmarks: state.bookmarks,
        offlineQueue: state.offlineQueue,
      }),
    },
  ),
)
