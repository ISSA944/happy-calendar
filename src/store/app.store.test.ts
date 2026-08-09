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
