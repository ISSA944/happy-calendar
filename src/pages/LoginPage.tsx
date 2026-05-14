import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { apiClient } from '../api'
import { useAppStore } from '../store'
import { isValidEmail } from '../utils/validation'

export function LoginPage() {
  const navigate = useNavigate()
  const setEmail = useAppStore((s) => s.setEmail)

  const [emailInput, setEmailInput] = useState('')
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
      setEmail(emailInput.trim())
      navigate('/otp', { state: { flow: 'login' } })
    } catch (err: any) {
      const status = err?.response?.status
      if (status === 404) {
        setSubmitError('__not_found__')
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
      className="relative bg-background text-on-surface font-body selection:bg-primary/20 selection:text-primary min-h-[100dvh] w-full max-w-[430px] landscape:max-w-[860px] mx-auto overflow-x-hidden overflow-y-auto overscroll-none"
    >
      {/* Декоративные блобы */}
      <div className="fixed top-[10%] right-[5%] w-[30%] aspect-square pointer-events-none -z-10">
        <div className="w-full h-full rounded-full bg-gradient-to-br from-primary/5 to-transparent blur-3xl" />
      </div>
      <div className="fixed bottom-[10%] left-[5%] w-[40%] aspect-square pointer-events-none -z-10">
        <div className="w-full h-full rounded-full bg-gradient-to-tr from-secondary/5 to-transparent blur-3xl" />
      </div>

      {/* Header */}
      <header className="sticky top-0 w-full z-50 bg-background/80 backdrop-blur-md px-4 pt-[env(safe-area-inset-top,0px)]">
        <div className="flex items-center h-16 relative">
          <button
            onClick={() => navigate(-1)}
            aria-label="Назад"
            className="w-10 h-10 -ml-1 text-primary hover:bg-black/5 rounded-full transition-colors active:scale-95 flex items-center justify-center shrink-0"
          >
            <span className="material-symbols-outlined text-[24px]">arrow_back</span>
          </button>
          <h2 className="absolute left-1/2 -translate-x-1/2 font-headline font-bold text-lg text-primary tracking-tight">Вход в аккаунт</h2>
        </div>
      </header>

      <main className="flex flex-col px-6 pt-8 pb-[max(2rem,env(safe-area-inset-bottom))] landscape:grid landscape:grid-cols-2 landscape:gap-8 landscape:px-10 landscape:pt-6 landscape:items-start w-full max-w-[480px] landscape:max-w-[860px] mx-auto">

        {/* Hero */}
        <div className="flex flex-col gap-3 text-center landscape:text-left mb-8 landscape:mb-0 landscape:pt-4">
          <h1 className="font-headline text-4xl landscape:text-3xl font-extrabold text-on-surface tracking-tight leading-tight">
            С возвращением
          </h1>
          <p className="font-body text-on-surface-variant text-base landscape:text-sm leading-relaxed">
            Введите почту, чтобы войти в свой аккаунт.
          </p>
        </div>

        {/* Card */}
        <div className="bg-surface-container-lowest rounded-[24px] p-6 landscape:p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">

            {/* Email input */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-on-surface-variant px-1" htmlFor="login-email">
                Электронная почта
              </label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline-variant group-focus-within:text-primary transition-colors text-[20px]">
                  mail
                </span>
                <input
                  id="login-email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="example@mail.com"
                  value={emailInput}
                  onChange={(e) => { setEmailInput(e.target.value); setSubmitError('') }}
                  className="w-full pl-11 pr-4 py-4 bg-surface-container-low border border-outline-variant rounded-2xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 text-on-surface placeholder:text-outline-variant transition-all text-base"
                />
              </div>
              <p className="text-xs text-on-surface-variant/70 px-1 leading-relaxed">
                Мы пришлём код подтверждения на эту почту.
              </p>
            </div>

            {/* Кнопка */}
            <button
              type="submit"
              disabled={!canSubmit || isSubmitting}
              className={`h-14 landscape:h-12 w-full font-headline font-bold text-lg rounded-full transition-all flex items-center justify-center active:scale-[0.98] ${
                canSubmit && !isSubmitting
                  ? 'bg-gradient-to-r from-[#006a65] to-[#2fa7a0] text-white shadow-lg shadow-[#2fa7a0]/30 cursor-pointer'
                  : 'bg-[#e5e2dd] text-[#9ca3af] cursor-not-allowed'
              }`}
            >
              {isSubmitting ? 'Отправляем...' : 'Получить код'}
            </button>

            {/* Ошибки */}
            {submitError === '__not_found__' ? (
              <div className="text-center">
                <p className="text-sm font-medium text-on-surface-variant mb-1">Этот email не найден.</p>
                <Link to="/register" className="text-sm font-bold text-primary underline underline-offset-2">
                  Зарегистрироваться →
                </Link>
              </div>
            ) : submitError ? (
              <p className="text-center text-sm font-medium text-red-500">{submitError}</p>
            ) : null}

            {/* Ссылка на регистрацию */}
            <p className="text-center text-sm text-on-surface-variant/70">
              Ещё нет аккаунта?{' '}
              <Link to="/register" className="font-bold text-primary underline-offset-2 hover:underline">
                Зарегистрироваться
              </Link>
            </p>

          </form>
        </div>

      </main>
    </motion.div>
  )
}
