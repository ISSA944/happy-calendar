// @vitest-environment jsdom
/// <reference types="node" />
import '@testing-library/jest-dom/vitest'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { resolve } from 'node:path'
import { LandingMood } from '../features/landing/LandingMood'
import { PWA_PRECACHE_PATTERNS } from '../config/pwaCache'
import { shouldApplyPwaUpdateImmediately } from '../components/ui/pwaUpdatePolicy'

describe('startup performance contracts', () => {
  it('keeps heavyweight non-shell files out of the service-worker precache', () => {
    expect(PWA_PRECACHE_PATTERNS).toContain('assets/index-*.js')
    expect(PWA_PRECACHE_PATTERNS).not.toContain('**/*.{js,css,html,ico,png,svg,webmanifest,woff2}')
    expect(PWA_PRECACHE_PATTERNS.some(pattern => pattern.includes('email-assets'))).toBe(false)
    expect(PWA_PRECACHE_PATTERNS.some(pattern => pattern.includes('loader-lotus'))).toBe(false)
  })

  it('loads landing mood photography lazily', () => {
    const { container } = render(
      <MemoryRouter>
        <LandingMood />
      </MemoryRouter>,
    )
    const images = [...container.querySelectorAll('img')]

    expect(images.length).toBeGreaterThan(0)
    expect(images.every(image => image.getAttribute('loading') === 'lazy')).toBe(true)
    expect(images.every(image => image.getAttribute('decoding') === 'async')).toBe(true)
  })

  it('applies a ready update immediately only on safe routes', () => {
    expect(shouldApplyPwaUpdateImmediately('/')).toBe(true)
    expect(shouldApplyPwaUpdateImmediately('/home')).toBe(true)
    expect(shouldApplyPwaUpdateImmediately('/register')).toBe(false)
    expect(shouldApplyPwaUpdateImmediately('/otp')).toBe(false)
    expect(shouldApplyPwaUpdateImmediately('/profile-setup')).toBe(false)
    expect(shouldApplyPwaUpdateImmediately('/change-email')).toBe(false)
  })

  it('does not start heavyweight loader or remote font downloads on the landing page', () => {
    const appSource = readFileSync(resolve('src/App.tsx'), 'utf8')
    const htmlSource = readFileSync(resolve('index.html'), 'utf8')

    expect(appSource).not.toContain("img.src = '/loader-lotus")
    expect(htmlSource).not.toContain('images.unsplash.com')
    expect(htmlSource).not.toContain('fonts.googleapis.com')
    expect(statSync(resolve('public/loader-lotus.webp')).size).toBeLessThan(20_000)
  })

  it('registers one service worker and uses the narrowed precache manifest', () => {
    const mainSource = readFileSync(resolve('src/main.tsx'), 'utf8')
    const viteSource = readFileSync(resolve('vite.config.ts'), 'utf8')

    expect(mainSource).not.toContain("from 'virtual:pwa-register'")
    expect(viteSource).toContain('globPatterns: PWA_PRECACHE_PATTERNS')
  })

  it('keeps authenticated pages out of the landing-page bundle', () => {
    const files = readdirSync(resolve('dist/assets'))
    const entry = files.find(file => /^index-.*\.js$/.test(file))!
    const built = readFileSync(resolve('dist/assets', entry), 'utf8')
    for (const page of ['HomePage', 'BookmarksPage', 'SettingsPage', 'NotificationsListPage']) {
      const chunk = files.find(file => file.startsWith(`${page}-`) && file.endsWith('.js'))
      expect(chunk).toBeDefined()
      expect(built).toContain(`import("./${chunk}")`)
    }
  })

  it('keeps below-the-fold landing sections out of the critical bundle', () => {
    const landingSource = readFileSync(resolve('src/pages/LandingPage.tsx'), 'utf8')

    expect(landingSource).toContain("lazy(() => import('../features/landing/LandingMood')")
    expect(landingSource).not.toContain("import { LandingMood } from '../features/landing/LandingMood'")
  })

  it('keeps the original smooth app navigation while preserving route code splitting', () => {
    const appSource = readFileSync(resolve('src/App.tsx'), 'utf8')
    const viteSource = readFileSync(resolve('vite.config.ts'), 'utf8')

    expect(appSource).toContain("from 'framer-motion'")
    expect(appSource).toContain('<AnimatePresence mode="wait">')
    expect(appSource).toContain('initial={{ opacity: 0, y: 10 }}')
    expect(appSource).toContain('exit={{ opacity: 0, y: -10 }}')
    expect(appSource).toContain('<LazyMotion features={domAnimation}>')
    expect(appSource).toContain('<m.div')
    expect(appSource).toContain("lazy(() => import('./components/ui/PageLoader')")
    expect(viteSource).not.toContain("'motion': ['framer-motion']")
  })

  it('keeps the restored animation runtime inside the agreed 140 KiB entry budget', () => {
    const budgetSource = readFileSync(resolve('scripts/check-performance-budget.mjs'), 'utf8')

    expect(budgetSource).toContain('const entryLimit = 140 * 1024')
    expect(budgetSource).toContain('const precacheLimit = 650 * 1024')
  })
})
