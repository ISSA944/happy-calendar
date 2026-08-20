// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { LoginPage } from './LoginPage'

vi.mock('../api', () => ({
  apiClient: { post: vi.fn() },
}))

describe('LoginPage mobile layout', () => {
  it('constrains the welcome copy to the same width as the 320px form', () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    )

    const heading = screen.getByRole('heading', { name: 'С возвращением' })

    expect(heading.parentElement).toHaveClass(
      'w-full',
      'max-w-sm',
    )
    expect(heading).toHaveClass('max-w-[272px]', 'mx-auto', 'text-3xl')
  })

  it('keeps its own vertical scroll container for a short Android viewport', () => {
    const { container } = render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    )

    expect(container.firstElementChild).toHaveClass(
      'h-[100dvh]',
      'overflow-y-auto',
      'touch-pan-y',
    )
  })
})
