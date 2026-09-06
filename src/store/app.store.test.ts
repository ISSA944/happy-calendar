// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '../api'
import { sanitizePersistedAppState, useAppStore } from './app.store'
const session = vi.hoisted(() => ({ token: 'test-token' }))

vi.mock('../api', () => ({
  apiClient: {
    get: vi.fn(),
    patch: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}))

vi.mock('../auth/token-storage', () => ({
  getAccessToken: () => session.token,
  clearAuthTokens: vi.fn(),
}))

const todayResponse = (source: 'ai' | 'stored' | 'fallback', main: string) => ({
  data: {
    date: '10.08',
    horoscope: {
      main,
      detailed: `${main} подробно`,
      advice: 'Совет',
      moon: 'Луна',
      aspect: 'Аспект',
    },
    support: { text: 'Поддержка' },
    holiday: null,
    meta: {
      contentSource: source,
      ...(source === 'fallback' ? { retryAfterSeconds: 300 } : {}),
    },
  },
})

describe('daily fallback refresh', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    localStorage.clear()
    useAppStore.setState({
      dailyPack: null,
      showOnboardingLoader: false,
    })
    vi.mocked(apiClient.get).mockReset()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('coalesces overlapping daily requests and reuses a loaded pack on tab return', async () => {
    let finish!: (value: ReturnType<typeof todayResponse>) => void
    vi.mocked(apiClient.get).mockImplementationOnce(() => new Promise(resolve => { finish = resolve }))
    const first = useAppStore.getState().initDailyPack()
    const second = useAppStore.getState().initDailyPack()
    expect(apiClient.get).toHaveBeenCalledTimes(1)
    finish(todayResponse('ai', 'Один ответ'))
    await Promise.all([first, second])
    await useAppStore.getState().initDailyPack()
    expect(apiClient.get).toHaveBeenCalledTimes(1)
  })

  it('ignores a daily response after the profile identity changes', async () => {
    let finish!: (value: ReturnType<typeof todayResponse>) => void
    vi.mocked(apiClient.get).mockImplementationOnce(() => new Promise(resolve => { finish = resolve }))
    const loading = useAppStore.getState().initDailyPack()
    useAppStore.setState({ email: 'another@example.com' })
    finish(todayResponse('ai', 'Чужой ответ'))
    await loading
    expect(useAppStore.getState().dailyPack).toBeNull()
  })

  it('accepts the response when auto-refresh rotates the token for the same user', async () => {
    const token = (exp: number) => `header.${btoa(JSON.stringify({ sub: 'same-user', exp }))}.signature`
    session.token = token(1)
    let finish!: (value: ReturnType<typeof todayResponse>) => void
    vi.mocked(apiClient.get).mockImplementationOnce(() => new Promise(resolve => { finish = resolve }))
    const loading = useAppStore.getState().initDailyPack()
    session.token = token(2)
    finish(todayResponse('ai', 'После обновления токена'))
    await loading
    expect(useAppStore.getState().dailyPack?.horoscope.main).toBe('После обновления токена')
    session.token = 'test-token'
  })

  it('does not replace the latest mood support with a slower previous mood response', async () => {
    useAppStore.setState({ dailyPack: {
      date: '06.09', horoscope: todayResponse('ai', 'Прогноз').data.horoscope,
      holiday: null, supportPhrase: 'Исходная поддержка', contentSource: 'ai',
    } })
    let finish!: (value: unknown) => void
    vi.mocked(apiClient.patch).mockImplementationOnce(() => new Promise(resolve => { finish = resolve }))
      .mockResolvedValueOnce({ data: { support: { text: 'Для спокойного настроения' } } })
    const first = useAppStore.getState().setMood('Тревожна')
    await useAppStore.getState().setMood('Спокойна')
    finish({ data: { support: { text: 'Устаревшая поддержка' } } })
    await first
    expect(useAppStore.getState().dailyPack?.supportPhrase).toBe('Для спокойного настроения')
  })

  it('quietly retries after 300 seconds and replaces fallback with live AI', async () => {
    vi.mocked(apiClient.get)
      .mockResolvedValueOnce(todayResponse('fallback', 'Временный прогноз'))
      .mockResolvedValueOnce(todayResponse('ai', 'Живой прогноз'))

    await useAppStore.getState().initDailyPack()

    expect(useAppStore.getState().dailyPack?.horoscope.main).toBe('Временный прогноз')
    expect(apiClient.get).toHaveBeenCalledTimes(1)

    await vi.advanceTimersByTimeAsync(300_000)

    expect(apiClient.get).toHaveBeenCalledTimes(2)
    expect(useAppStore.getState().dailyPack?.horoscope.main).toBe('Живой прогноз')
  })

  it('finishes the onboarding loader when an Android image never settles', async () => {
    class StalledImage {
      onload: (() => void) | null = null
      onerror: (() => void) | null = null
      src = ''
    }
    vi.stubGlobal('Image', StalledImage)
    vi.mocked(apiClient.get).mockResolvedValueOnce(todayResponse('ai', 'Живой прогноз'))
    useAppStore.setState({
      showOnboardingLoader: true,
      currentMood: 'Нормально',
    })

    let finished = false
    const loading = useAppStore
      .getState()
      .initDailyPack()
      .then(() => {
        finished = true
      })

    await vi.advanceTimersByTimeAsync(6_000)
    await Promise.resolve()

    expect(finished).toBe(true)
    expect(useAppStore.getState().showOnboardingLoader).toBe(false)
    await loading
  })
})

describe('profile mood hydration', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.mocked(apiClient.get).mockReset()
    useAppStore.setState({
      currentMood: 'Тревожна',
      hasCompletedOnboarding: true,
      birthDate: '01.01.1990',
      zodiacSign: 'Козерог ♑︎',
    })
  })

  it('resets a new incomplete profile to Нормально instead of leaking persisted mood', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: {
        user: { email: 'new@example.com', name: 'Новый пользователь' },
        profile: null,
        prefs: null,
      },
    })

    const result = await useAppStore.getState().syncProfile()

    expect(useAppStore.getState().currentMood).toBe('Нормально')
    expect(useAppStore.getState().hasCompletedOnboarding).toBe(false)
    expect(result).toBe(false)
  })

  it('keeps the mood and onboarding state returned by an existing server profile', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: {
        user: { email: 'existing@example.com', name: 'Анна' },
        profile: {
          birthdate: '10.08.1990',
          zodiacSign: 'Лев ♌︎',
          gender: 'F',
          avatarUrl: null,
          currentMood: 'Грустна',
        },
        prefs: null,
      },
    })

    const result = await useAppStore.getState().syncProfile()

    expect(useAppStore.getState().currentMood).toBe('Грустна')
    expect(useAppStore.getState().hasCompletedOnboarding).toBe(true)
    expect(result).toBe(true)
  })

  it('reports a profile loading failure without changing onboarding state', async () => {
    vi.mocked(apiClient.get).mockRejectedValueOnce(new Error('offline'))

    const result = await useAppStore.getState().syncProfile()

    expect(result).toBeNull()
  })
})

describe('persisted state recovery', () => {
  it('replaces malformed collection caches that would crash the home screen', () => {
    const recovered = sanitizePersistedAppState({
      bookmarks: null,
      goals: { stale: true },
      todayHolidays: 'broken',
      personalCareToday: null,
      offlineQueue: false,
      dailyPack: { date: '18.08', horoscope: null },
      userName: 'Ольга',
    })

    expect(recovered).toMatchObject({
      bookmarks: [],
      goals: [],
      todayHolidays: [],
      personalCareToday: [],
      offlineQueue: [],
      dailyPack: null,
      userName: 'Ольга',
    })
  })
})
