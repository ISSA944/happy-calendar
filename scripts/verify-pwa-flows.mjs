import { createRequire } from 'node:module'
import { mkdir } from 'node:fs/promises'
import assert from 'node:assert/strict'

// Synthetic UI-only regression run. No production account, email or push is used.
const require = createRequire(import.meta.url)
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright')
const base = 'http://127.0.0.1:4173'
const output = '.playwright-mcp/pwa-recovery'
await mkdir(output, { recursive: true })
const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE ? { executablePath: process.env.BROWSER_EXECUTABLE } : { channel: 'chrome' }) })
const holidays = Array.from({ length: 18 }, (_, i) => ({
  id: `holiday-${i}`, title: `Праздник ${i + 1}`, date: '06.09', scope: 'ru',
  themeKey: 'Города и путешествия', imageUrl: null, postcardReady: false,
}))
const profile = {
  user: { email: 'qa@example.test', name: 'Проверка' },
  profile: { birthdate: '01.01.1990', zodiacSign: 'Козерог ♑︎', currentMood: 'Нормально', gender: 'UNKNOWN' },
  prefs: { timezone: 'Asia/Almaty', horoscopeEnabled: true, holidaysEnabled: true, supportEnabled: true, personalCareEnabled: true },
}
const today = {
  date: '06.09', horoscope: { main: 'Сегодня можно выбрать спокойный темп и заняться одним важным делом.', detailed: 'Подробный прогноз для проверки экрана.', advice: 'Оставь немного времени для отдыха.', moon: 'Луна.', aspect: 'Аспект.' },
  support: { text: 'Тебе не нужно делать всё сразу. Один небольшой шаг уже имеет значение.' },
  holiday: { title: holidays[0].title }, meta: { contentSource: 'stored' },
}

try {
  for (const [width, height] of [[320, 640], [360, 640], [390, 844], [412, 915], [640, 360], [844, 390]]) {
    const context = await browser.newContext({ viewport: { width, height }, isMobile: true, hasTouch: true, serviceWorkers: 'block' })
    const page = await context.newPage()
    const calls = []
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    await context.addInitScript(() => {
      localStorage.setItem('yoyojoy-access-token', 'synthetic-ui-test')
      localStorage.setItem('yoyojoy-store', JSON.stringify({ version: 0, state: {
        email: 'qa@example.test', userName: 'Проверка', hasCompletedOnboarding: true,
        birthDate: '01.01.1990', zodiacSign: 'Козерог ♑︎', currentMood: 'Нормально',
        bookmarks: [], goals: [], todayHolidays: [], personalCareToday: [], offlineQueue: [],
      } }))
    })
    await context.route('**/*', async route => {
      const request = route.request()
      const url = new URL(request.url())
      if (url.pathname.startsWith('/api/')) {
        calls.push(`${request.method()} ${url.pathname}`)
        let response = []
        if (url.pathname === '/api/profile') response = profile
        if (url.pathname === '/api/today') response = today
        if (url.pathname === '/api/holidays/today') response = holidays
        if (/\/holidays\/holiday-\d+\/card$/.test(url.pathname)) {
          const id = url.pathname.split('/')[3]
          const tone = url.searchParams.get('tone') || 'cute'
          response = { ...holidays.find(h => h.id === id), tone, text: `Открытка ${tone}: пусть день принесёт радость.` }
        }
        if (url.pathname === '/api/bookmarks') response = [{ id: 'bookmark-1', type: 'поддержка', payload: { text: 'Сохранённая поддержка', date: '06.09', icon: 'favorite' } }]
        return route.fulfill({ json: response })
      }
      if (url.origin !== base) return route.abort()
      // Exercise first-navigation loading even when idle warming already started.
      if (/\/(BookmarksPage|SettingsPage)-.*\.js$/.test(url.pathname)) await new Promise(resolve => setTimeout(resolve, 900))
      return route.continue()
    })
    await page.goto(`${base}/home`)
    await page.getByRole('link', { name: /Закладки$/ }).waitFor()
    await page.getByText(today.support.text).waitFor()
    await page.evaluate(() => {
      window.__emptyFrames = 0
      window.__watch = true
      function frame() {
        const main = document.querySelector('main')
        const nav = document.querySelector('nav')
        if (!main || !main.textContent.trim() || !nav || main.getBoundingClientRect().height === 0 || nav.getBoundingClientRect().height === 0) window.__emptyFrames++
        if (window.__watch) requestAnimationFrame(frame)
      }
      requestAnimationFrame(frame)
    })
    await page.getByRole('link', { name: /Закладки$/ }).click()
    await page.getByText('Сохранённая поддержка').waitFor()
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)
    assert.equal(overflow, false, `horizontal overflow ${width}`)
    for (const label of ['Все', 'Гороскоп', 'Поддержка', 'Открытки', 'Забота']) {
      const box = await page.getByRole('button', { name: label, exact: true }).boundingBox()
      assert(box && box.x >= 0 && box.x + box.width <= width + 1 && box.height >= 44, `clipped filter ${label} ${width}`)
    }
    await page.getByRole('link', { name: /Настройки$/ }).click()
    await page.getByText('qa@example.test', { exact: true }).waitFor()
    await page.getByRole('link', { name: /Домой$/ }).click()
    await page.getByText(today.support.text).waitFor()
    const blankFrames = await page.evaluate(() => { window.__watch = false; return window.__emptyFrames })
    assert.equal(blankFrames, 0, `empty shell frames ${width}`)
    await page.getByRole('button', { name: /Праздник дня/ }).click()
    const list = page.getByRole('region', { name: 'Список праздников' })
    await list.waitFor()
    await list.evaluate(element => { element.scrollTop = 600 })
    const target = page.getByRole('button', { name: /Праздник 8 / })
    await target.scrollIntoViewIfNeeded()
    const beforeScroll = await list.evaluate(element => element.scrollTop)
    await target.click()
    await page.getByText('Открытка cute: пусть день принесёт радость.').waitFor()
    const dialog = page.getByRole('dialog')
    const before = await dialog.boundingBox()
    await page.getByRole('button', { name: 'Милая' }).click()
    await page.getByText('Открытка cute: пусть день принесёт радость.').waitFor()
    await page.getByRole('button', { name: 'С юмором' }).click()
    await page.getByText('Открытка humor: пусть день принесёт радость.').waitFor()
    await page.getByRole('button', { name: 'Назад', exact: true }).click()
    assert.equal(await list.evaluate(element => element.scrollTop), beforeScroll, `scroll restoration ${width}`)
    const after = await dialog.boundingBox()
    assert(before && after && Math.abs(before.height - after.height) < 1, `drawer resized ${width}`)
    await page.screenshot({ path: `${output}/${width}x${height}.png` })
    assert.equal(calls.filter(call => call === 'GET /api/today').length, 1, `duplicate today ${width}`)
    assert.equal(calls.filter(call => call === 'GET /api/profile').length, 1, `duplicate profile ${width}`)
    assert.equal(calls.some(call => /^(POST|PATCH|DELETE)/.test(call)), false, 'unexpected API write')
    assert.deepEqual(errors, [], 'browser errors')
    console.log(JSON.stringify({ width, height, blankFrames, apiRequests: calls.length, result: 'PASS' }))
    await context.close()
  }
} finally { await browser.close() }
