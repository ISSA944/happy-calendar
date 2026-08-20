// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { BottomNav } from './BottomNav'

describe('BottomNav', () => {
  it('starts loading the destination before navigating after a touch begins', () => {
    const preloadTab = vi.fn()

    render(
      <MemoryRouter initialEntries={['/home']}>
        <BottomNav onTabIntent={preloadTab} />
      </MemoryRouter>,
    )

    fireEvent.pointerDown(screen.getByRole('link', { name: /закладки/i }))

    expect(preloadTab).toHaveBeenCalledWith('/bookmarks')
  })
})
