// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const webPush = vi.hoisted(() => ({
  state: {
    isChecking: false,
    isSubscribed: false,
    isLoading: false,
    permission: 'default' as NotificationPermission,
    isSupported: true,
    error: null as string | null,
    subscribe: vi.fn(),
  },
}))

vi.mock('../../hooks/useWebPush', () => ({
  useWebPush: () => webPush.state,
}))

import { LoginPushPrompt } from './LoginPushPrompt'
import {
  hasPendingLoginPushCheck,
  markLoginPushCheckPending,
} from './loginPushPrompt.storage'

const originalMatchMedia = window.matchMedia
const originalUserAgent = window.navigator.userAgent

beforeEach(() => {
  window.sessionStorage.clear()
  webPush.state = {
    isChecking: false,
    isSubscribed: false,
    isLoading: false,
    permission: 'default',
    isSupported: true,
    error: null,
    subscribe: vi.fn(),
  }
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: vi.fn().mockReturnValue({ matches: true }),
  })
  Object.defineProperty(window.navigator, 'userAgent', {
    configurable: true,
    value: 'Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36 Chrome/140 Mobile',
  })
})

afterEach(() => {
  cleanup()
  window.sessionStorage.clear()
  vi.clearAllMocks()
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: originalMatchMedia,
  })
  Object.defineProperty(window.navigator, 'userAgent', {
    configurable: true,
    value: originalUserAgent,
  })
})

describe('LoginPushPrompt', () => {
  it('renders nothing before a successful login asks for a device check', () => {
    render(<LoginPushPrompt />)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('does not flash while the current-device subscription is being checked', () => {
    markLoginPushCheckPending()
    webPush.state.isChecking = true

    render(<LoginPushPrompt />)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(hasPendingLoginPushCheck()).toBe(true)
  })

  it('silently clears the login check when this device is already subscribed', async () => {
    markLoginPushCheckPending()
    webPush.state.isSubscribed = true

    render(<LoginPushPrompt />)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    await waitFor(() => expect(hasPendingLoginPushCheck()).toBe(false))
  })

  it('connects an unsubscribed standalone device and closes only after confirmation', async () => {
    markLoginPushCheckPending()
    webPush.state.subscribe.mockResolvedValue(true)
    const user = userEvent.setup()

    render(<LoginPushPrompt />)

    expect(screen.getByText('На этом устройстве уведомления ещё не подключены')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Разрешить уведомления' }))

    expect(webPush.state.subscribe).toHaveBeenCalledOnce()
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(hasPendingLoginPushCheck()).toBe(false)
  })

  it('keeps the prompt open when device subscription confirmation fails', async () => {
    markLoginPushCheckPending()
    webPush.state.subscribe.mockResolvedValue(false)
    const user = userEvent.setup()

    render(<LoginPushPrompt />)
    await user.click(screen.getByRole('button', { name: 'Разрешить уведомления' }))

    expect(await screen.findByText('Не удалось подключить уведомления. Попробуйте ещё раз.')).toBeInTheDocument()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(hasPendingLoginPushCheck()).toBe(true)
  })

  it('shows settings guidance instead of requesting permission again when notifications are denied', () => {
    markLoginPushCheckPending()
    webPush.state.permission = 'denied'

    render(<LoginPushPrompt />)

    expect(screen.getByText('Уведомления заблокированы в настройках устройства')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Разрешить уведомления' })).not.toBeInTheDocument()
  })

  it('asks an iPhone browser user to open the Home Screen app instead of requesting push', () => {
    markLoginPushCheckPending()
    webPush.state.isSupported = false
    Object.defineProperty(window.navigator, 'userAgent', {
      configurable: true,
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)',
    })
    vi.mocked(window.matchMedia).mockReturnValue({ matches: false } as MediaQueryList)

    render(<LoginPushPrompt />)

    expect(screen.getByText('Откройте YoYoJoy с домашнего экрана')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Разрешить уведомления' })).not.toBeInTheDocument()
  })

  it('dismisses the prompt only for the current completed login', async () => {
    markLoginPushCheckPending()
    const user = userEvent.setup()

    render(<LoginPushPrompt />)
    await user.click(screen.getByRole('button', { name: 'Настроить позже' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(hasPendingLoginPushCheck()).toBe(false)
  })
})
