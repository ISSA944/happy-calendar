import { afterEach, describe, expect, it, vi } from 'vitest'
import { nativeShare, prepareShareFile, shareViaChannel } from './share'

const originalNavigator = globalThis.navigator
const originalFetch = globalThis.fetch

afterEach(() => {
  Object.defineProperty(globalThis, 'navigator', {
    configurable: true,
    value: originalNavigator,
  })
  globalThis.fetch = originalFetch
  vi.restoreAllMocks()
})

describe('nativeShare postcard images', () => {
  it('does not reopen link sharing after cancelling file sharing', async () => {
    const share = vi.fn().mockRejectedValue(new DOMException('Cancelled', 'AbortError'))
    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: { share, canShare: () => true },
    })
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      blob: async () => new Blob(['image'], { type: 'image/webp' }),
    }) as typeof fetch
    const file = await prepareShareFile('https://yoyojoy.online/card.webp')
    await nativeShare('Title', 'Text', 'https://yoyojoy.online/card.webp', file ?? undefined)
    expect(share).toHaveBeenCalledTimes(1)
  })
  it('shares the fetched WebP file when the device accepts shared files', async () => {
    const share = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: { share, canShare: vi.fn().mockReturnValue(true) },
    })
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      blob: () => Promise.resolve(new Blob(['postcard'], { type: 'image/webp' })),
    }) as typeof fetch

    const file = await prepareShareFile('https://yoyojoy.online/postcards/calendar/01/v8-20260808/01-114_cute.webp')
    const result = await nativeShare(
      'YoYoJoy · Праздник дат и планов',
      'Текст уже нанесён на открытку',
      'https://yoyojoy.online/postcards/calendar/01/v8-20260808/01-114_cute.webp',
      file ?? undefined,
    )

    expect(result).toBe(true)
    expect(share).toHaveBeenCalledOnce()
    const payload = share.mock.calls[0][0] as ShareData
    expect(payload.files).toHaveLength(1)
    expect(payload.files?.[0].name).toBe('01-114_cute.webp')
    expect(payload.files?.[0].type).toBe('image/webp')
  })

  it('opens link sharing synchronously without fetching on the click path', async () => {
    const share = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { share } })
    globalThis.fetch = vi.fn()
    const result = nativeShare('Title', 'Text', 'https://yoyojoy.online/card.webp')
    expect(share).toHaveBeenCalledOnce()
    expect(fetch).not.toHaveBeenCalled()
    expect(await result).toBe(true)
  })

  it('reports a failed clipboard write instead of confirming copied', async () => {
    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: { clipboard: { writeText: vi.fn().mockRejectedValue(new Error('denied')) } },
    })
    expect(await shareViaChannel('copy', 'Title', 'Text')).toBe(false)
  })

  it('shares the public postcard URL when file sharing is unavailable', async () => {
    const share = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: { share, canShare: vi.fn().mockReturnValue(false) },
    })
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      blob: () => Promise.resolve(new Blob(['postcard'], { type: 'image/webp' })),
    }) as typeof fetch
    const imageUrl =
      'https://yoyojoy.online/postcards/calendar/01/v8-20260808/01-114_humor.webp'

    const result = await nativeShare('Заголовок', 'Текст', imageUrl)

    expect(result).toBe(true)
    expect(share).toHaveBeenCalledWith({
      title: 'Заголовок',
      text: 'Текст',
      url: imageUrl,
    })
  })
})
