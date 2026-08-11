// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '../api'

const push = vi.hoisted(() => ({
  getPushSubscription: vi.fn(),
  isPushSupported: vi.fn(),
  subscribeToPush: vi.fn(),
  unsubscribeFromPush: vi.fn(),
}))

const navigation = vi.hoisted(() => ({ navigate: vi.fn() }))

vi.mock('../lib/push', () => push)
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return { ...actual, useNavigate: () => navigation.navigate }
})
vi.mock('../features/notifications/NotificationCategoriesEditor', () => ({
  NotificationCategoriesEditor: () => <div data-testid="notification-categories" />,
}))
vi.mock('../features/notifications/useNotificationCategories', () => ({
  useNotificationCategories: () => [],
}))

import { NotificationsPage } from './NotificationsPage'

const originalNotification = globalThis.Notification
const originalMatchMedia = window.matchMedia

beforeEach(() => {
  window.localStorage.setItem('yoyojoy-access-token', 'access-token')
  push.getPushSubscription.mockResolvedValue(null)
  push.isPushSupported.mockReturnValue(true)

  let permission: NotificationPermission = 'default'
  Object.defineProperty(globalThis, 'Notification', {
    configurable: true,
    value: {
      get permission() {
        return permission
      },
      requestPermission: vi.fn(async () => {
        permission = 'denied'
        return permission
      }),
    },
  })
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: vi.fn().mockReturnValue({ matches: true }),
  })
})

afterEach(() => {
  cleanup()
  window.localStorage.clear()
  vi.restoreAllMocks()
  vi.clearAllMocks()
  Object.defineProperty(globalThis, 'Notification', {
    configurable: true,
    value: originalNotification,
  })
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: originalMatchMedia,
  })
})

describe('NotificationsPage', () => {
  it('shows the current hook error when notification permission is denied', async () => {
    vi.spyOn(apiClient, 'get').mockResolvedValue({ data: { publicKey: 'AQID' } })
    push.subscribeToPush.mockResolvedValue({
      success: false,
      errorType: 'permission',
      error: 'Permission denied',
    })
    const user = userEvent.setup()
    render(<NotificationsPage />)

    await user.click(screen.getAllByRole('button', { name: 'Разрешить уведомления' })[0])

    expect(await screen.findByText('Уведомления заблокированы в настройках.')).toBeInTheDocument()
    expect(navigation.navigate).not.toHaveBeenCalled()
  })
})
