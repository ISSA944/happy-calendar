// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { BookmarksPage } from './BookmarksPage'

const fetchBookmarks = vi.fn()

vi.mock('../components/InstallBanner', () => ({ InstallBanner: () => null }))
vi.mock('../store', () => ({
  useAppStore: (selector: (state: Record<string, unknown>) => unknown) => selector({
    bookmarks: [],
    fetchBookmarks,
    removeBookmark: vi.fn(),
  }),
}))

describe('BookmarksPage filters', () => {
  it('shows every filter as a full-size button instead of a clipped horizontal strip', () => {
    render(
      <MemoryRouter>
        <BookmarksPage />
      </MemoryRouter>,
    )

    const filters = ['Все', 'Гороскоп', 'Поддержка', 'Открытки', 'Забота'].map(name =>
      screen.getByRole('button', { name }),
    )
    const filterGrid = filters[0].parentElement

    expect(filterGrid).toHaveClass('grid', 'grid-cols-2', 'min-[400px]:grid-cols-3')
    expect(filterGrid).not.toHaveClass('overflow-x-auto')
    expect(filters.every(button => button.classList.contains('min-h-11'))).toBe(true)
  })
})
