// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ProfileNameField } from './ProfileNameField'

afterEach(cleanup)

describe('ProfileNameField', () => {
  it('keeps the input mounted while a skipped name is typed', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const { rerender } = render(
      <ProfileNameField hadNameOnEntry={false} value="" onChange={onChange} />,
    )
    const input = screen.getByPlaceholderText('Введите своё имя')

    await user.type(input, 'А')
    rerender(
      <ProfileNameField hadNameOnEntry={false} value="А" onChange={onChange} />,
    )
    await user.type(screen.getByPlaceholderText('Введите своё имя'), 'лександра')

    expect(screen.getByPlaceholderText('Введите своё имя')).toBeInTheDocument()
    expect(onChange).toHaveBeenCalledTimes(10)
  })

  it('shows the registration name as text without an extra input', () => {
    render(
      <ProfileNameField
        hadNameOnEntry
        value="Ольга"
        onChange={vi.fn()}
      />,
    )

    expect(screen.getByText('Ольга')).toBeInTheDocument()
    expect(screen.queryByPlaceholderText('Введите своё имя')).toBeNull()
  })
})
