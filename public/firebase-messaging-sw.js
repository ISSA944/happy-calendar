/* eslint-disable no-undef */
// Firebase Cloud Messaging Service Worker
//
// ⚠️ SWs cannot read Vite env vars (they run in a separate context).
// Fill these values from Firebase Console → Project Settings → General → Your apps → Web SDK config.
// These are PUBLIC client-side keys — same values that end up in your bundle — safe to commit.

importScripts('https://www.gstatic.com/firebasejs/10.14.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.14.0/firebase-messaging-compat.js')

const firebaseConfig = {
  apiKey: 'AIzaSyCjZLy4WTUlxP5aIyjLy_sIGkzM7LeNO9I',
  authDomain: 'happy-calendar-a5e69.firebaseapp.com',
  projectId: 'happy-calendar-a5e69',
  storageBucket: 'happy-calendar-a5e69.firebasestorage.app',
  messagingSenderId: '313374698896',
  appId: '1:313374698896:web:83520926053d62f239d715',
}

const isConfigComplete = Object.values(firebaseConfig).every(
  (value) => typeof value === 'string' && !value.includes('REPLACE_ME'),
)

if (isConfigComplete) {
  firebase.initializeApp(firebaseConfig)
  const messaging = firebase.messaging()

  // Handles FCM-delivered push messages while the PWA is in the background/closed.
  messaging.onBackgroundMessage((payload) => {
    const notification = payload.notification || {}
    const data = payload.data || {}
    const title = notification.title || 'Happy Calendar'
    const options = {
      body: notification.body || 'У тебя есть обновление на сегодня.',
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      data: { url: data.url || '/home' },
    }
    self.registration.showNotification(title, options)
  })
} else {
  console.warn(
    '[firebase-messaging-sw] Firebase config incomplete — background push disabled. ' +
      'Fill firebaseConfig in public/firebase-messaging-sw.js.',
  )

  // Graceful fallback: still surface any raw Web Push event so dev/testing works
  // without a full Firebase SDK config.
  self.addEventListener('push', (event) => {
    if (!event.data) return

    let payload = {}
    try {
      payload = event.data.json()
    } catch {
      payload = { notification: { title: 'Happy Calendar', body: event.data.text() } }
    }

    const notification = payload.notification || {}
    const data = payload.data || {}
    const title = notification.title || 'Happy Calendar'
    const options = {
      body: notification.body || 'У тебя есть обновление на сегодня.',
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      data: { url: data.url || '/home' },
    }

    event.waitUntil(self.registration.showNotification(title, options))
  })
}

// Click handler — focuses existing window or opens a new one at the notification's target URL.
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const targetUrl = event.notification.data?.url || '/home'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ('focus' in client) {
          client.navigate(targetUrl)
          return client.focus()
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl)
      }
      return undefined
    }),
  )
})
