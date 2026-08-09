// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '../api'
import { useAppStore } from './app.store'

vi.mock('../api', () => ({
  apiClient: {
    get: vi.fn(),
    patch: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}))

vi.mock('../auth/token-storage', () => ({
  getAccessToken: () => 'test-token',
  clearAuthTokens: vi.fn(),
}))

const todayResponse = (
  source: 'ai' | 'stored' | 'fallback',
  main: string,
) => ({
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
  })

  it('quietly retries after 300 seconds and replaces fallback with live AI', async () => {
    vi.mocked(apiClient.get)
      .mockResolvedValueOnce(todayResponse('fallback', 'Временный прогноз'))
      .mockResolvedValueOnce(todayResponse('ai', 'Живой прогноз'))

    await useAppStore.getState().initDailyPack()

    expect(useAppStore.getState().dailyPack?.horoscope.main).toBe(
      'Временный прогноз',
    )
    expect(apiClient.get).toHaveBeenCalledTimes(1)

    await vi.advanceTimersByTimeAsync(300_000)

    expect(apiClient.get).toHaveBeenCalledTimes(2)
    expect(useAppStore.getState().dailyPack?.horoscope.main).toBe(
      'Живой прогноз',
    )
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

    await useAppStore.getState().syncProfile()

    expect(useAppStore.getState().currentMood).toBe('Нормально')
    expect(useAppStore.getState().hasCompletedOnboarding).toBe(false)
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

    await useAppStore.getState().syncProfile()

    expect(useAppStore.getState().currentMood).toBe('Грустна')
    expect(useAppStore.getState().hasCompletedOnboarding).toBe(true)
  })
})
