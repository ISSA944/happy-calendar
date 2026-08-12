// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '../api'
import { hasPendingLoginPushCheck } from '../features/notifications/loginPushPrompt.storage'
import { useAppStore } from '../store'
import { OtpPage } from './OtpPage'

vi.mock('../api', () => ({
  apiClient: { post: vi.fn() },
}))

vi.mock('../auth/token-storage', () => ({
  setAuthTokens: vi.fn(),
}))

beforeEach(() => {
  window.sessionStorage.clear()
  useAppStore.setState({ email: 'user@example.com', showOnboardingLoader: false })
  vi.mocked(apiClient.post).mockResolvedValue({
    data: { accessToken: 'access', refreshToken: 'refresh' },
  })
})

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
  window.sessionStorage.clear()
})

async function verifyOtp(flow?: 'login') {
  const user = userEvent.setup()
  render(
    <MemoryRouter initialEntries={[{ pathname: '/otp', state: flow ? { flow } : undefined }]}>
      <Routes>
        <Route path="/otp" element={<OtpPage />} />
        <Route path="/" element={<p>Главная</p>} />
        <Route path="/notifications" element={<p>Уведомления</p>} />
      </Routes>
    </MemoryRouter>,
  )

  fireEvent.change(screen.getAllByRole('textbox')[0], { target: { value: '1111' } })
  await user.click(screen.getByRole('button', { name: 'Продолжить' }))
  await waitFor(() => expect(apiClient.post).toHaveBeenCalledWith('auth/verify-otp', {
    email: 'user@example.com',
    code: '1111',
  }))
}

describe('OtpPage push handoff', () => {
  it('marks a current-device push check after a successful login', async () => {
    await verifyOtp('login')

    expect(await screen.findByText('Главная')).toBeInTheDocument()
    expect(hasPendingLoginPushCheck()).toBe(true)
  })

  it('does not mark the login-only check during a new registration', async () => {
    await verifyOtp()

    expect(hasPendingLoginPushCheck()).toBe(false)
  })
})
