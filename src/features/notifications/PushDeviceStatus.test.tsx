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

import { PushDeviceStatus } from './PushDeviceStatus'

beforeEach(() => {
  webPush.state = {
    isChecking: false,
    isSubscribed: false,
    isLoading: false,
    permission: 'default',
    isSupported: true,
    error: null,
    subscribe: vi.fn(),
  }
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('PushDeviceStatus', () => {
  it('renders nothing while this supported device is being inspected', () => {
    webPush.state.isChecking = true

    render(<PushDeviceStatus />)

    expect(screen.queryByText('Проверяем подключение уведомлений…')).not.toBeInTheDocument()
    expect(screen.queryByText('На этом устройстве уведомления не подключены')).not.toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('shows actionable blocked copy without a recovery action when permission is denied', () => {
    webPush.state.isChecking = true
    webPush.state.permission = 'denied'

    render(<PushDeviceStatus />)

    expect(screen.getByText('Уведомления заблокированы в настройках браузера.')).toBeInTheDocument()
    expect(screen.getByText('Разрешите уведомления для этого сайта, затем вернитесь сюда.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Подключить и проверить' })).not.toBeInTheDocument()
  })

  it('shows truthful unsupported copy without a recovery action', () => {
    webPush.state.isChecking = true
    webPush.state.isSupported = false

    render(<PushDeviceStatus />)

    expect(screen.getByText('Push-уведомления не поддерживаются этим браузером.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Подключить и проверить' })).not.toBeInTheDocument()
  })

  it('warns and offers recovery when this device is not subscribed', () => {
    webPush.state.error = 'Уведомления заблокированы в настройках.'

    render(<PushDeviceStatus />)

    expect(screen.getByText('На этом устройстве уведомления не подключены')).toBeInTheDocument()
    expect(screen.getByText('Уведомления заблокированы в настройках.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Подключить уведомления' })).toBeInTheDocument()
  })

  it('subscribes from the button without sending a test push', async () => {
    let confirmSubscription: (value: boolean) => void
    const subscription = new Promise<boolean>((resolve) => {
      confirmSubscription = resolve
    })
    webPush.state.subscribe.mockReturnValue(subscription)
    const user = userEvent.setup()
    render(<PushDeviceStatus />)

    await user.click(screen.getByRole('button', { name: 'Подключить уведомления' }))

    expect(webPush.state.subscribe).toHaveBeenCalledOnce()

    confirmSubscription!(true)

    await waitFor(() => expect(screen.getByRole('button', { name: 'Подключить уведомления' })).toBeEnabled())
  })

  it('renders nothing when this device is already connected', () => {
    webPush.state.isSubscribed = true
    render(<PushDeviceStatus />)

    expect(screen.queryByText('На этом устройстве уведомления подключены')).not.toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('keeps the recovery action available when subscribe returns false', async () => {
    webPush.state.subscribe.mockResolvedValue(false)
    const user = userEvent.setup()
    render(<PushDeviceStatus />)

    await user.click(screen.getByRole('button', { name: 'Подключить уведомления' }))

    await waitFor(() => expect(webPush.state.subscribe).toHaveBeenCalledOnce())
    expect(screen.getByRole('button', { name: 'Подключить уведомления' })).toBeEnabled()
  })
})
