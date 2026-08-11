// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '../api'

const push = vi.hoisted(() => ({
  getPushSubscription: vi.fn(),
  isPushSupported: vi.fn(),
  subscribeToPush: vi.fn(),
  unsubscribeFromPush: vi.fn(),
}))

vi.mock('../lib/push', () => push)

import { useWebPush } from './useWebPush'

const subscription = {
  endpoint: 'https://push.example/subscription',
  toJSON: () => ({ endpoint: 'https://push.example/subscription' }),
} as PushSubscription

const originalNotification = globalThis.Notification

beforeEach(() => {
  push.getPushSubscription.mockResolvedValue(null)
  push.isPushSupported.mockReturnValue(true)
  Object.defineProperty(globalThis, 'Notification', {
    configurable: true,
    value: { permission: 'granted' },
  })
})

afterEach(() => {
  window.localStorage.clear()
  vi.restoreAllMocks()
  vi.clearAllMocks()
  push.subscribeToPush.mockReset()
  push.unsubscribeFromPush.mockReset()
  Object.defineProperty(globalThis, 'Notification', {
    configurable: true,
    value: originalNotification,
  })
})

describe('useWebPush', () => {
  it('checks the initial browser subscription before reporting an unsubscribed device', async () => {
    push.getPushSubscription.mockResolvedValue(null)

    const { result } = renderHook(() => useWebPush())

    expect(result.current.isChecking).toBe(true)
    await waitFor(() => expect(result.current.isChecking).toBe(false))
    expect(result.current.isSubscribed).toBe(false)
  })

  it('keeps checking until an existing subscription is synchronized with the backend', async () => {
    window.localStorage.setItem('yoyojoy-access-token', 'access-token')
    let resolveSync: (value: { data: { subscribed: true } }) => void
    const sync = new Promise<{ data: { subscribed: true } }>((resolve) => {
      resolveSync = resolve
    })
    push.getPushSubscription.mockResolvedValue(subscription)
    vi.spyOn(apiClient, 'post').mockReturnValue(sync)

    const { result } = renderHook(() => useWebPush())

    await act(async () => {
      await Promise.resolve()
      await Promise.resolve()
    })
    expect(result.current.isChecking).toBe(true)

    await act(async () => {
      resolveSync!({ data: { subscribed: true } })
      await sync
    })

    await waitFor(() => expect(result.current.isChecking).toBe(false))
    expect(result.current.isSubscribed).toBe(true)
  })

  it('stops checking and shows an actionable error when the initial lookup fails', async () => {
    push.getPushSubscription.mockRejectedValue(new Error('Push manager unavailable'))

    const { result } = renderHook(() => useWebPush())

    expect(result.current.isChecking).toBe(true)
    await waitFor(() => expect(result.current.isChecking).toBe(false))
    expect(result.current.error).toBe('Не удалось проверить состояние push-подписки. Попробуйте ещё раз.')
  })

  it('fetches the runtime VAPID key before synchronizing a new subscription', async () => {
    window.localStorage.setItem('yoyojoy-access-token', 'access-token')
    push.subscribeToPush.mockImplementation(async (publicKey: string) =>
      publicKey === 'AQID' ? { success: true, subscription } : { success: false },
    )
    vi.spyOn(apiClient, 'get').mockResolvedValue({ data: { publicKey: 'AQID' } })
    vi.spyOn(apiClient, 'post').mockResolvedValue({ data: { subscribed: true } })
    const { result } = renderHook(() => useWebPush())

    let subscribed = false
    await act(async () => {
      subscribed = await result.current.subscribe()
    })

    expect(subscribed).toBe(true)
    expect(result.current.isSubscribed).toBe(true)
  })

  it('does not report success when backend synchronization fails', async () => {
    window.localStorage.setItem('yoyojoy-access-token', 'access-token')
    push.subscribeToPush.mockResolvedValue({ success: true, subscription })
    vi.spyOn(apiClient, 'get').mockResolvedValue({ data: { publicKey: 'AQID' } })
    vi.spyOn(apiClient, 'post').mockRejectedValue(new Error('Backend unavailable'))
    const { result } = renderHook(() => useWebPush())

    let subscribed = true
    await act(async () => {
      subscribed = await result.current.subscribe()
    })

    expect(subscribed).toBe(false)
    expect(result.current.isSubscribed).toBe(false)
  })

  it('does not report success when backend rejects the subscription semantically', async () => {
    window.localStorage.setItem('yoyojoy-access-token', 'access-token')
    push.subscribeToPush.mockResolvedValue({ success: true, subscription })
    vi.spyOn(apiClient, 'get').mockResolvedValue({ data: { publicKey: 'AQID' } })
    vi.spyOn(apiClient, 'post').mockResolvedValue({
      data: { subscribed: false, reason: 'invalid-subscription' },
    })
    const { result } = renderHook(() => useWebPush())

    let subscribed = true
    await act(async () => {
      subscribed = await result.current.subscribe()
    })

    expect(subscribed).toBe(false)
    expect(result.current.isSubscribed).toBe(false)
    expect(result.current.error).toBe('Не удалось сохранить push-подписку. Попробуйте ещё раз.')
  })
})
