import { useCallback, useEffect, useState } from 'react'
import { apiClient } from '../api'
import { getAccessToken } from '../auth/token-storage'
import {
  getFirebaseMessagingToken,
  getWebPushSubscription,
  isFirebaseMessagingConfigured,
  isWebPushSupported,
  onFirebaseForegroundMessage,
  setStoredFcmToken,
} from '../lib/firebase'

type PushSyncOptions = {
  requestPermission?: boolean
}

export function useFirebasePush() {
  const [permission, setPermission] = useState<NotificationPermission>(() => {
    if (typeof Notification === 'undefined') return 'default'
    return Notification.permission
  })

  const syncPushSubscription = useCallback(async (options?: PushSyncOptions) => {
    if (
      typeof window === 'undefined' ||
      typeof Notification === 'undefined' ||
      !('serviceWorker' in navigator)
    ) {
      return { subscribed: false, reason: 'unsupported' as const }
    }

    if (!isFirebaseMessagingConfigured() && !isWebPushSupported()) {
      return { subscribed: false, reason: 'missing-config' as const }
    }

    const accessToken = getAccessToken()
    if (!accessToken) {
      return { subscribed: false, reason: 'missing-auth' as const }
    }

    let nextPermission = Notification.permission
    if (options?.requestPermission && nextPermission !== 'granted') {
      nextPermission = await Notification.requestPermission()
      setPermission(nextPermission)
    }

    if (nextPermission !== 'granted') {
      return { subscribed: false, reason: 'permission-denied' as const }
    }

    if (isFirebaseMessagingConfigured()) {
      const token = await getFirebaseMessagingToken()

      if (token) {
        // Always sync with the backend. The server is idempotent, while localStorage
        // can survive logout/reset and otherwise make a real DB subscription get skipped.
        await apiClient.post('push/subscribe', { fcm_token: token })
        setStoredFcmToken(token)

        return { subscribed: true, token, provider: 'fcm' as const, skipped: false as const }
      }
    }

    const webSubscription = await getWebPushSubscription()
    if (!webSubscription) {
      return { subscribed: false, reason: 'token-unavailable' as const }
    }

    await apiClient.post('push/web-subscribe', {
      subscription: webSubscription.toJSON(),
      user_agent: navigator.userAgent,
    })

    return { subscribed: true, provider: 'web-push' as const, skipped: false as const }
  }, [])

  return {
    permission,
    syncPushSubscription,
    requestPermissionAndSubscribe: useCallback(
      () => syncPushSubscription({ requestPermission: true }),
      [syncPushSubscription],
    ),
  }
}

export function useFirebaseForegroundNotifications() {
  useEffect(() => {
    let unsubscribe: (() => void) | undefined
    let cancelled = false

    void onFirebaseForegroundMessage(async (payload) => {
      if (
        typeof Notification === 'undefined' ||
        Notification.permission !== 'granted' ||
        !('serviceWorker' in navigator)
      ) {
        return
      }

      const notification = payload.notification ?? {}
      const data = payload.data ?? {}
      const registration = await navigator.serviceWorker.ready

      await registration.showNotification(notification.title ?? 'YoYoJoy Day', {
        body: notification.body ?? 'У тебя есть обновление на сегодня.',
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        data: { url: data.url ?? '/home' },
      })
    }).then((nextUnsubscribe) => {
      if (cancelled) {
        nextUnsubscribe?.()
        return
      }
      unsubscribe = nextUnsubscribe
    })

    return () => {
      cancelled = true
      unsubscribe?.()
    }
  }, [])
}
