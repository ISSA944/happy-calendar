/// <reference lib="webworker" />

import { initializeApp } from 'firebase/app'
import { getMessaging, onBackgroundMessage } from 'firebase/messaging/sw'
import { clientsClaim } from 'workbox-core'
import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching'
import { registerRoute, NavigationRoute } from 'workbox-routing'
import { CacheFirst, StaleWhileRevalidate } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'
import { CacheableResponsePlugin } from 'workbox-cacheable-response'

declare const self: ServiceWorkerGlobalScope

type PrecacheEntry = Parameters<typeof precacheAndRoute>[0]

self.skipWaiting()
clientsClaim()

precacheAndRoute(self.__WB_MANIFEST as PrecacheEntry)
cleanupOutdatedCaches()

registerRoute(
  new NavigationRoute(
    createHandlerBoundToURL('/index.html'),
    {
      denylist: [/^\/api\//],
    },
  ),
)

registerRoute(
  /^https:\/\/images\.unsplash\.com\//,
  new CacheFirst({
    cacheName: 'unsplash-images',
    plugins: [
      new ExpirationPlugin({ maxEntries: 40, maxAgeSeconds: 60 * 60 * 24 * 30 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  }),
)

registerRoute(
  /^https:\/\/lh3\.googleusercontent\.com\//,
  new CacheFirst({
    cacheName: 'googleusercontent-images',
    plugins: [
      new ExpirationPlugin({ maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 30 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  }),
)

registerRoute(
  ({ request }) => request.destination === 'image',
  new StaleWhileRevalidate({
    cacheName: 'runtime-images',
    plugins: [
      new ExpirationPlugin({ maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 14 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  }),
)

registerRoute(
  /^https:\/\/fonts\.googleapis\.com\//,
  new StaleWhileRevalidate({
    cacheName: 'google-fonts-stylesheets',
  }),
)

registerRoute(
  /^https:\/\/fonts\.gstatic\.com\//,
  new CacheFirst({
    cacheName: 'google-fonts-webfonts',
    plugins: [
      new ExpirationPlugin({ maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  }),
)

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const targetUrl = event.notification.data?.url || '/home'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ('focus' in client) {
          void client.navigate(targetUrl)
          return client.focus()
        }
      }

      return self.clients.openWindow?.(targetUrl)
    }),
  )
})

self.addEventListener('push', (event: PushEvent) => {
  let payload:
    | { source?: string; title?: string; body?: string; data?: { url?: string } }
    | undefined

  try {
    payload = event.data?.json()
  } catch {
    payload = undefined
  }

  if (payload?.source !== 'web-push') return

  event.waitUntil(
    self.registration.showNotification(payload.title || 'YoYoJoy Day', {
      body: payload.body || 'У тебя есть обновление на сегодня.',
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      data: { url: payload.data?.url || '/home' },
    }),
  )
})

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const isFirebaseConfigured = Object.values(firebaseConfig).every(
  (value) => typeof value === 'string' && value.length > 0,
)

if (isFirebaseConfigured) {
  const app = initializeApp(firebaseConfig)
  const messaging = getMessaging(app)

  onBackgroundMessage(messaging, (payload) => {
    const notification = payload.notification || {}
    const data = payload.data || {}

    void self.registration.showNotification(notification.title || 'YoYoJoy Day', {
      body: notification.body || 'У тебя есть обновление на сегодня.',
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      data: { url: data.url || '/home' },
    })
  })
} else {
  console.warn('[sw] Firebase config incomplete; background push disabled.')
}
