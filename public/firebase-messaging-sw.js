self.addEventListener('push', (event) => {
  if (!event.data) {
    return
  }

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
    data: {
      url: data.url || '/home',
    },
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

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
