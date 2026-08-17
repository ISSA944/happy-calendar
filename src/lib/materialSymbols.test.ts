// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { revealMaterialSymbols } from './materialSymbols'

describe('revealMaterialSymbols', () => {
  beforeEach(() => {
    document.documentElement.classList.remove('material-symbols-ready')
  })

  it('reveals icon ligatures only after the local font is ready', async () => {
    let finishLoading: ((faces: FontFace[]) => void) | undefined
    const loading = new Promise<FontFace[]>((resolve) => {
      finishLoading = resolve
    })
    const fonts = {
      load: vi.fn().mockReturnValue(loading),
      check: vi.fn().mockReturnValue(true),
    } as unknown as FontFaceSet

    const ready = revealMaterialSymbols(document, fonts)
    expect(document.documentElement).not.toHaveClass('material-symbols-ready')

    finishLoading?.([])
    await ready

    expect(document.documentElement).toHaveClass('material-symbols-ready')
  })

  it('keeps raw ligature names hidden when the font cannot load', async () => {
    const fonts = {
      load: vi.fn().mockRejectedValue(new Error('font unavailable')),
      check: vi.fn(),
    } as unknown as FontFaceSet

    await revealMaterialSymbols(document, fonts)

    expect(document.documentElement).not.toHaveClass('material-symbols-ready')
  })
})
