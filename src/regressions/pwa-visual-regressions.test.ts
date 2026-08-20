/// <reference types="node" />
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { MATERIAL_SYMBOLS } from '../config/materialSymbols'

function literalMaterialSymbols() {
  const sourceFiles = execFileSync('rg', ['-l', 'material-symbols-outlined', 'src'], { encoding: 'utf8' })
    .trim()
    .split(/\r?\n/)

  return sourceFiles.flatMap(file => {
    const source = readFileSync(resolve(file), 'utf8')
    return [...source.matchAll(/material-symbols-outlined[^>]*>\s*([a-z_]+)\s*</g)].map(match => match[1])
  })
}

describe('PWA visual regression contracts', () => {
  it('keeps the 24px Material Symbols baseline used by navigation and notification icons', () => {
    const css = readFileSync(resolve('src/index.css'), 'utf8')

    expect(css).toMatch(/\.material-symbols-outlined\s*\{[\s\S]*font-size:\s*24px/)
  })

  it('keeps every literal Material Symbol in the local font subset manifest', () => {
    const configuredSymbols = new Set(MATERIAL_SYMBOLS)

    expect([...new Set(literalMaterialSymbols())].filter(icon => !configuredSymbols.has(icon))).toEqual([])
  })

  it('leaves bookmark filter scrolling unobscured by edge fades', () => {
    const source = readFileSync(resolve('src/pages/BookmarksPage.tsx'), 'utf8')

    expect(source).toContain('snap-x snap-mandatory')
    expect(source).not.toContain('bg-gradient-to-r from-background to-transparent')
    expect(source).not.toContain('bg-gradient-to-l from-background to-transparent')
  })

  it('does not let the PWA updater mutate notification settings', () => {
    const updaterSource = readFileSync(resolve('src/components/ui/PWAUpdater.tsx'), 'utf8')

    expect(updaterSource).not.toContain('apiClient')
    expect(updaterSource).not.toContain('toggleHoroscope')
    expect(updaterSource).not.toContain('toggleSupport')
    expect(updaterSource).not.toContain('toggleHolidays')
  })
})
