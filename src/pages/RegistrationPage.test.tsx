// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '../api'
import { useRegistrationDraft } from '../store'
import { LoginPage } from './LoginPage'
import { RegistrationPage } from './RegistrationPage'

vi.mock('../api', () => ({
  apiClient: { post: vi.fn() },
}))

beforeEach(() => {
  window.sessionStorage.clear()
  useRegistrationDraft.setState({
    name: '',
    email: '',
    consent: false,
    marketing: false,
  })
})

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
  window.sessionStorage.clear()
})

function renderRegistration() {
  const view = render(
    <MemoryRouter initialEntries={['/register']}>
      <Routes>
        <Route path="/register" element={<RegistrationPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/otp" element={<p>Введите код</p>} />
      </Routes>
    </MemoryRouter>,
  )

  return view.container.firstElementChild
}

async function submitRegistration(email: string) {
  const user = userEvent.setup()
  await user.type(screen.getByLabelText('Электронная почта'), email)
  await user.click(screen.getByLabelText(/Я согласен/))
  await user.click(screen.getByRole('button', { name: 'Получить код' }))
  return user
}

describe('RegistrationPage Android registration flow', () => {
  it('keeps the registration page as the viewport-height scroll container', () => {
    const page = renderRegistration()

    expect(page).toHaveClass('h-[100dvh]', 'overflow-y-auto')
    expect(page).not.toHaveClass('min-h-[100dvh]')
  })

  it('offers login for an existing account and prefills an editable email', async () => {
    vi.mocked(apiClient.post).mockRejectedValue({ response: { status: 409 } })
    renderRegistration()
    const user = await submitRegistration('  existing@example.com  ')

    await user.click(await screen.findByRole('button', { name: 'Войти в аккаунт' }))

    const loginEmail = screen.getByLabelText('Электронная почта')
    expect(loginEmail).toHaveValue('existing@example.com')
    await user.clear(loginEmail)
    await user.type(loginEmail, 'corrected@example.com')
    expect(loginEmail).toHaveValue('corrected@example.com')
    expect(apiClient.post).toHaveBeenCalledOnce()
  })
})
