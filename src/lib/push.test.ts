// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { subscribeToPush } from './push'

const originalServiceWorker = navigator.serviceWorker
const originalPushManager = window.PushManager
const originalNotification = window.Notification

afterEach(() => {
  Object.defineProperty(navigator, 'serviceWorker', {
    configurable: true,
    value: originalServiceWorker,
  })
  Object.defineProperty(window, 'PushManager', {
    configurable: true,
    value: originalPushManager,
  })
  Object.defineProperty(window, 'Notification', {
    configurable: true,
    value: originalNotification,
  })
  vi.restoreAllMocks()
})

describe('subscribeToPush', () => {
  it('subscribes with the runtime VAPID key', async () => {
    const subscription = { endpoint: 'https://push.example/subscription' } as PushSubscription
    const subscribe = vi.fn().mockResolvedValue(subscription)
    const registration = {
      pushManager: {
        getSubscription: vi.fn().mockResolvedValue(null),
        subscribe,
      },
    }

    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: { ready: Promise.resolve(registration) },
    })
    Object.defineProperty(window, 'PushManager', { configurable: true, value: class PushManager {} })
    Object.defineProperty(window, 'Notification', {
      configurable: true,
      value: { permission: 'granted' },
    })

    const result = await subscribeToPush('AQID')

    expect(result).toEqual({ success: true, subscription })
    expect(Array.from(subscribe.mock.calls[0][0].applicationServerKey as Uint8Array)).toEqual([1, 2, 3])
  })
})
