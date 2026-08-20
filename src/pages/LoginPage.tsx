import { motion } from 'framer-motion'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { apiClient } from '../api'
import { useAppStore } from '../store'
import { isValidEmail } from '../utils/validation'
import { getHttpStatus } from '../utils/http'
import { savePendingOtpContext } from '../features/auth/pendingOtp.storage'

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const setEmail = useAppStore(s => s.setEmail)

  const [emailInput, setEmailInput] = useState(() => {
    const routedEmail = (location.state as { email?: unknown } | null)?.email
    return typeof routedEmail === 'string' ? routedEmail : ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const canSubmit = isValidEmail(emailInput)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit || isSubmitting) return

    setIsSubmitting(true)
    setSubmitError('')

    try {
      await apiClient.post('auth/login', { email: emailInput.trim() })
      const normalizedEmail = emailInput.trim().toLowerCase()
      setEmail(normalizedEmail)
      savePendingOtpContext({
        email: normalizedEmail,
        flow: 'login',
        giftEmailAccepted: false,
      })
      navigate('/otp', { state: { flow: 'login' } })
    } catch (err: unknown) {
      const status = getHttpStatus(err)
      if (status === 404) {
        setSubmitError('Этот email не зарегистрирован.')
      } else if (status === 429) {
        setSubmitError('Слишком много попыток. Подожди немного и попробуй снова.')
      } else {
        setSubmitError('Не удалось отправить код. Проверь соединение.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.18, ease: [0.32, 0.72, 0, 1] }}
      style={{ willChange: 'opacity' }}
      className="relative h-[100dvh] w-full max-w-[430px] touch-pan-y overflow-x-hidden overflow-y-auto overscroll-none bg-background font-body text-on-surface selection:bg-primary/20 selection:text-primary landscape:max-w-[860px] mx-auto [-webkit-overflow-scrolling:touch]"
    >
      {/* Header */}
      <header className="sticky top-0 w-full z-50 bg-background/95 px-4 pt-[env(safe-area-inset-top,0px)]">
        <div className="flex items-center h-16 relative">
          <button
            onClick={() => navigate(-1)}
            aria-label="Назад"
            className="w-10 h-10 -ml-1 text-primary hover:bg-black/5 rounded-full transition-colors active:scale-95 flex items-center justify-center shrink-0"
          >
            <span className="material-symbols-outlined text-[24px]">arrow_back</span>
          </button>
          <h2 className="absolute left-1/2 -translate-x-1/2 font-headline font-bold text-lg text-primary tracking-tight">
            Вход в аккаунт
          </h2>
        </div>
      </header>

      <main className="flex flex-col items-center px-6 pt-8 pb-[max(2rem,env(safe-area-inset-bottom))] landscape:flex-row landscape:items-start landscape:gap-10 landscape:px-10 landscape:pt-6 landscape:justify-center w-full">
        {/* Hero */}
        <div className="mb-8 flex w-full max-w-sm flex-col gap-3 text-center landscape:mb-0 landscape:w-[280px] landscape:shrink-0 landscape:pt-6 landscape:text-left">
          <h1 className="mx-auto max-w-[272px] font-headline text-3xl font-extrabold leading-tight tracking-tight text-on-surface landscape:mx-0 landscape:max-w-none">
            С возвращением
          </h1>
          <p className="font-body text-on-surface-variant text-base landscape:text-sm leading-relaxed">
            Введите почту, чтобы войти в свой аккаунт.
          </p>
        </div>

        {/* Card */}
        <div className="bg-surface-container-lowest rounded-[24px] p-6 landscape:p-8 shadow-sm w-full landscape:max-w-[400px]">
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            {/* Email */}
            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-on-surface ml-1" htmlFor="login-email">
                Электронная почта
              </label>
              <input
                id="login-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="example@mail.com"
                value={emailInput}
                onChange={e => {
                  setEmailInput(e.target.value)
                  setSubmitError('')
                }}
                className="w-full h-14 px-5 bg-surface-container-lowest border border-outline-variant rounded-[24px] text-on-surface placeholder:text-on-surface-variant/40 focus:ring-4 focus:ring-primary/5 focus:border-primary transition-colors outline-none text-base font-medium shadow-sm"
              />
              <p className="text-xs text-on-surface-variant/70 ml-1">Мы пришлём код подтверждения на эту почту.</p>
            </div>

            {/* Кнопка */}
            <button
              type="submit"
              disabled={!canSubmit || isSubmitting}
              className={`h-14 landscape:h-12 w-full font-headline font-bold text-lg rounded-full transition-all flex items-center justify-center active:scale-[0.98] shadow-md ${
                canSubmit && !isSubmitting
                  ? 'bg-[#006a65] text-white shadow-[#006a65]/30 cursor-pointer hover:shadow-lg'
                  : 'bg-[#e5e2dd] text-[#9ca3af] cursor-not-allowed shadow-none'
              }`}
            >
              {isSubmitting ? 'Отправляем...' : 'Получить код'}
            </button>

            {/* Ошибка */}
            {submitError && <p className="text-center text-sm font-medium text-red-500">{submitError}</p>}

            {/* Ссылка на регистрацию */}
            <p className="text-center text-sm text-on-surface-variant">
              Ещё нет аккаунта?{' '}
              <Link to="/register" className="font-semibold text-primary hover:underline underline-offset-4">
                Зарегистрироваться
              </Link>
            </p>
          </form>
        </div>
      </main>
    </motion.div>
  )
}
