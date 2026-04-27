import fs from 'fs'
import path from 'path'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  function injectIntoSW(content: string): string {
    return content
      .replace('%%FIREBASE_API_KEY%%', env.VITE_FIREBASE_API_KEY ?? '')
      .replace('%%FIREBASE_AUTH_DOMAIN%%', env.VITE_FIREBASE_AUTH_DOMAIN ?? '')
      .replace('%%FIREBASE_STORAGE_BUCKET%%', env.VITE_FIREBASE_STORAGE_BUCKET ?? '')
      .replace('%%FIREBASE_MESSAGING_SENDER_ID%%', env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '')
      .replace('%%FIREBASE_APP_ID%%', env.VITE_FIREBASE_APP_ID ?? '')
  }

  const injectFirebaseSW = {
    name: 'inject-firebase-sw',
    // Dev: intercept the SW request and serve it with real values
    configureServer(server: import('vite').ViteDevServer) {
      server.middlewares.use((req, res, next) => {
        if (req.url?.startsWith('/firebase-messaging-sw.js')) {
          const swPath = path.resolve(__dirname, 'public', 'firebase-messaging-sw.js')
          const content = injectIntoSW(fs.readFileSync(swPath, 'utf-8'))
          res.setHeader('Content-Type', 'application/javascript; charset=utf-8')
          res.setHeader('Service-Worker-Allowed', '/')
          res.end(content)
          return
        }
        next()
      })
    },
    // Build: inject into the copied dist file
    closeBundle() {
      const swPath = path.resolve(__dirname, 'dist', 'firebase-messaging-sw.js')
      if (!fs.existsSync(swPath)) return
      fs.writeFileSync(swPath, injectIntoSW(fs.readFileSync(swPath, 'utf-8')))
    },
  }

  return {
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:4000',
          changeOrigin: true,
        },
      },
    },
    plugins: [
      react(),
      injectFirebaseSW,
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: 'auto',
        includeAssets: ['favicon.svg', 'apple-touch-icon.png', 'pwa-192x192.png', 'pwa-512x512.png'],
        manifest: {
          name: 'YoYoJoy Day',
          short_name: 'YoYoJoy',
          description: 'YoYoJoy Day — персональный AI-компаньон для ежедневных ритуалов: гороскоп, поддержка по настроению и праздники.',
          theme_color: '#2FA7A0',
          background_color: '#fcf9f4',
          display: 'standalone',
          orientation: 'any',
          scope: '/',
          start_url: '/',
          lang: 'ru',
          icons: [
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          skipWaiting: true,
          clientsClaim: true,
          globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest,woff2}'],
          navigateFallback: 'index.html',
          navigateFallbackDenylist: [/^\/api\//],
          cleanupOutdatedCaches: true,
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/images\.unsplash\.com\//,
              handler: 'CacheFirst',
              options: {
                cacheName: 'unsplash-images',
                expiration: { maxEntries: 40, maxAgeSeconds: 60 * 60 * 24 * 30 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
            {
              urlPattern: /^https:\/\/lh3\.googleusercontent\.com\//,
              handler: 'CacheFirst',
              options: {
                cacheName: 'googleusercontent-images',
                expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 30 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
            {
              urlPattern: ({ request }) => request.destination === 'image',
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'runtime-images',
                expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 14 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\//,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'google-fonts-stylesheets',
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\//,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-webfonts',
                expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
          ],
        },
      }),
    ],
  }
})
