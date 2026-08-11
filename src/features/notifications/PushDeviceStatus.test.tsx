// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '../../api'

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
  vi.spyOn(apiClient, 'post').mockResolvedValue({ data: { sent: 1, total: 1 } })
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('PushDeviceStatus', () => {
  it('shows only the checking state while this supported device is being inspected', () => {
    webPush.state.isChecking = true

    render(<PushDeviceStatus />)

    expect(screen.getByText('Проверяем подключение уведомлений…')).toBeInTheDocument()
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
    expect(screen.getByRole('button', { name: 'Подключить и проверить' })).toBeInTheDocument()
  })

  it('subscribes from the button and sends a test only after confirmation', async () => {
    let confirmSubscription: (value: boolean) => void
    const subscription = new Promise<boolean>((resolve) => {
      confirmSubscription = resolve
    })
    webPush.state.subscribe.mockReturnValue(subscription)
    const user = userEvent.setup()
    render(<PushDeviceStatus />)

    await user.click(screen.getByRole('button', { name: 'Подключить и проверить' }))

    expect(webPush.state.subscribe).toHaveBeenCalledOnce()
    expect(apiClient.post).not.toHaveBeenCalled()

    confirmSubscription!(true)

    await waitFor(() => expect(apiClient.post).toHaveBeenCalledWith('push/test'))
    await waitFor(() => expect(screen.getByRole('button', { name: 'Подключить и проверить' })).toBeEnabled())
  })

  it('keeps the connected controls without adding a success caption after a successful test', async () => {
    webPush.state.isSubscribed = true
    const user = userEvent.setup()
    render(<PushDeviceStatus />)

    expect(screen.getByText('На этом устройстве уведомления подключены')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Отправить тестовый push' }))

    expect(apiClient.post).toHaveBeenCalledWith('push/test')
    await waitFor(() => expect(screen.getByRole('button', { name: 'Отправить тестовый push' })).toBeEnabled())
    expect(screen.getByText('На этом устройстве уведомления подключены')).toBeInTheDocument()
    expect(screen.queryByText(/Проверьте шторку уведомлений/)).not.toBeInTheDocument()
  })

  it.each([
    { sent: 0, total: 0 },
    { sent: 0, total: 1 },
  ])('shows a delivery-check error when the provider accepts no pushes ($sent/$total)', async (response) => {
    webPush.state.isSubscribed = true
    vi.mocked(apiClient.post).mockResolvedValue({ data: response })
    const user = userEvent.setup()
    render(<PushDeviceStatus />)

    await user.click(screen.getByRole('button', { name: 'Отправить тестовый push' }))

    expect(await screen.findByText('Не удалось отправить тестовый push. Попробуйте ещё раз.')).toBeInTheDocument()
    expect(screen.queryByText(/Проверьте шторку уведомлений/)).not.toBeInTheDocument()
  })

  it('does not call push/test when subscribe returns false', async () => {
    webPush.state.subscribe.mockResolvedValue(false)
    const user = userEvent.setup()
    render(<PushDeviceStatus />)

    await user.click(screen.getByRole('button', { name: 'Подключить и проверить' }))

    await waitFor(() => expect(webPush.state.subscribe).toHaveBeenCalledOnce())
    expect(apiClient.post).not.toHaveBeenCalled()
  })

  it('keeps connected status when only the test request fails', async () => {
    webPush.state.isSubscribed = true
    vi.mocked(apiClient.post).mockRejectedValue(new Error('Provider unavailable'))
    const user = userEvent.setup()
    render(<PushDeviceStatus />)

    await user.click(screen.getByRole('button', { name: 'Отправить тестовый push' }))

    expect(await screen.findByText('Не удалось отправить тестовый push. Попробуйте ещё раз.')).toBeInTheDocument()
    expect(screen.getByText('На этом устройстве уведомления подключены')).toBeInTheDocument()
  })
})
