/* eslint-disable no-undef */
// Firebase Cloud Messaging Service Worker
//
// ⚠️ SWs cannot read Vite env vars (they run in a separate context).
// Fill these values from Firebase Console → Project Settings → General → Your apps → Web SDK config.
// These are PUBLIC client-side keys — same values that end up in your bundle — safe to commit.

// Click handler — focuses existing window or opens a new one at the notification's target URL.
// Register this before importing FCM scripts so Firebase does not override custom click behavior.
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

// Force this SW to become active immediately, even if Workbox SW is controlling the page.
// Without this, the SW stays in 'waiting' state and getToken() never resolves on iOS.
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))

importScripts('https://www.gstatic.com/firebasejs/10.14.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.14.0/firebase-messaging-compat.js')

const firebaseConfig = {
  apiKey: '%%FIREBASE_API_KEY%%',
  authDomain: '%%FIREBASE_AUTH_DOMAIN%%',
  projectId: '%%FIREBASE_PROJECT_ID%%',
  storageBucket: '%%FIREBASE_STORAGE_BUCKET%%',
  messagingSenderId: '%%FIREBASE_MESSAGING_SENDER_ID%%',
  appId: '%%FIREBASE_APP_ID%%',
}

const isConfigComplete = Object.values(firebaseConfig).every(
  (value) => typeof value === 'string' && !value.startsWith('%%'),
)

if (isConfigComplete) {
  firebase.initializeApp(firebaseConfig)
  const messaging = firebase.messaging()

  // Handles FCM-delivered push messages while the PWA is in the background/closed.
  messaging.onBackgroundMessage((payload) => {
    const notification = payload.notification || {}
    const data = payload.data || {}
    const title = notification.title || 'YoYoJoy Day'
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
      payload = { notification: { title: 'YoYoJoy Day', body: event.data.text() } }
    }

    const notification = payload.notification || {}
    const data = payload.data || {}
    const title = notification.title || 'YoYoJoy Day'
    const options = {
      body: notification.body || 'У тебя есть обновление на сегодня.',
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      data: { url: data.url || '/home' },
    }

    event.waitUntil(self.registration.showNotification(title, options))
  })
}
