// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from './api'
import { useAppStore } from './store'
import App from './App'

vi.mock('./api', () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}))

vi.mock('./auth/token-storage', () => ({
  getAccessToken: () => 'access-token',
  clearAuthTokens: vi.fn(),
}))

vi.mock('./components/ui/PWAUpdater', () => ({ PWAUpdater: () => null }))
vi.mock('./features/notifications/LoginPushPrompt', () => ({ LoginPushPrompt: () => null }))
vi.mock('./pages/HomePage', () => ({ HomePage: () => <p>Главная</p> }))
vi.mock('./pages/ProfileSetupPage', () => ({ ProfileSetupPage: () => <p>Настройка профиля</p> }))

describe('profile bootstrap routing', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', '/')
    localStorage.clear()
    vi.mocked(apiClient.get).mockReset()
    useAppStore.setState({
      hasCompletedOnboarding: false,
      showOnboardingLoader: false,
    })
  })

  afterEach(() => cleanup())

  it('shows a retry action when the profile cannot be loaded, then resumes setup', async () => {
    vi.mocked(apiClient.get)
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce({
        data: {
          user: { email: 'pending@example.com', name: 'Пользователь' },
          profile: { birthdate: null, zodiacSign: null, currentMood: 'Нормально' },
          prefs: null,
        },
      })
    const user = userEvent.setup()

    render(<App />)

    await user.click(await screen.findByRole('button', { name: 'Попробовать снова' }))

    expect(await screen.findByText('Настройка профиля')).toBeInTheDocument()
    expect(useAppStore.getState().showOnboardingLoader).toBe(false)
  })
})
