// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { useEmailChangeDraft } from '../store'
import { ChangeEmailPage } from './ChangeEmailPage'

describe('ChangeEmailPage mobile layout', () => {
  beforeEach(() => {
    useEmailChangeDraft.setState({ email: '', consent: false, marketing: false })
  })

  it('lets consent copy wrap instead of overflowing a narrow phone', () => {
    render(
      <MemoryRouter>
        <ChangeEmailPage />
      </MemoryRouter>,
    )

    const consentCopy = screen.getByLabelText(/Я согласен/).closest('label')?.querySelector('span')
    const marketingCopy = screen.getByLabelText(/Я хочу получать/).closest('label')?.querySelector('div:last-child')

    expect(consentCopy).toHaveClass('min-w-0', 'break-words')
    expect(marketingCopy).toHaveClass('min-w-0', 'break-words')
  })
})
