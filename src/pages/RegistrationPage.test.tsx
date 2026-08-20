// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '../api'
import { useRegistrationDraft } from '../store'
import { LoginPage } from './LoginPage'
import { RegistrationPage } from './RegistrationPage'

vi.mock('../api', () => ({
  apiClient: { post: vi.fn() },
}))

beforeEach(() => {
  window.localStorage.clear()
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
  window.localStorage.clear()
  window.sessionStorage.clear()
})

function OtpStateProbe() {
  const state = useLocation().state as { giftEmailAccepted?: boolean } | null
  return <p>{state?.giftEmailAccepted ? 'Подарки подтверждены' : 'Нет статуса подарков'}</p>
}

function renderRegistration() {
  const view = render(
    <MemoryRouter initialEntries={['/register']}>
      <Routes>
        <Route path="/register" element={<RegistrationPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/otp" element={<OtpStateProbe />} />
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

    expect(page).toHaveClass('h-[100dvh]', 'overflow-y-auto', 'touch-pan-y', '[-webkit-overflow-scrolling:touch]')
    expect(page).not.toHaveClass('min-h-[100dvh]')
  })

  it('uses compact vertical spacing on short phone screens', () => {
    const page = renderRegistration()
    const headerRow = page?.querySelector('header > div')
    const title = screen.getByRole('heading', { name: 'Давай начнём' })
    const email = screen.getByLabelText('Электронная почта')
    const submit = screen.getByRole('button', { name: 'Получить код' })

    expect(headerRow).toHaveClass('[@media(max-height:700px)]:h-12')
    expect(title).toHaveClass('[@media(max-height:700px)]:text-3xl')
    expect(email).toHaveClass('[@media(max-height:700px)]:h-12')
    expect(submit).toHaveClass('[@media(max-height:700px)]:h-12')
    expect(page?.querySelector('main')).toHaveClass('pb-[max(5rem,env(safe-area-inset-bottom))]')
  })

  it('carries confirmed gift delivery to the OTP screen', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce({
      data: {
        ok: true,
        email: 'new@example.com',
        giftEmailAccepted: true,
      },
    })
    renderRegistration()

    await submitRegistration('new@example.com')

    expect(await screen.findByText('Подарки подтверждены')).toBeInTheDocument()
    expect(JSON.parse(window.localStorage.getItem('yoyojoy-pending-otp') ?? 'null')).toMatchObject({
      email: 'new@example.com',
      flow: 'registration',
      giftEmailAccepted: true,
    })
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

  it('explains how to enter the existing owner test account', async () => {
    vi.mocked(apiClient.post).mockRejectedValue({ response: { status: 409 } })
    renderRegistration()

    await submitRegistration('MUKANISKANDER01@gmail.com')

    expect(await screen.findByText('Это уже созданный тестовый аккаунт. Нажми «Войти в аккаунт» и используй код 1111.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Войти в аккаунт' })).toBeInTheDocument()
  })

  it('keeps a successful login recoverable after Android reloads the tab', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce({ data: { ok: true } })
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/otp" element={<OtpStateProbe />} />
        </Routes>
      </MemoryRouter>,
    )

    await user.type(screen.getByLabelText('Электронная почта'), 'LOGIN@EXAMPLE.COM')
    await user.click(screen.getByRole('button', { name: 'Получить код' }))

    expect(JSON.parse(window.localStorage.getItem('yoyojoy-pending-otp') ?? 'null')).toMatchObject({
      email: 'login@example.com',
      flow: 'login',
      giftEmailAccepted: false,
    })
  })
})
