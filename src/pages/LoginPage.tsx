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
      navigate('/otp')
    } catch (err: any) {
      const status = err?.response?.status
      if (status === 404) {
        setSubmitError('__not_found__')
      } else if (status === 429) {
        setSubmitError('Слишком много попыток. Подожди немного.')
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
      className="relative bg-background text-on-surface font-body selection:bg-primary/20 selection:text-primary h-[100dvh] w-full max-w-[430px] landscape:max-w-[860px] mx-auto overflow-x-hidden overflow-y-auto overscroll-none"
    >
      <header className="sticky top-0 w-full z-50 bg-background px-5 pt-[env(safe-area-inset-top,0px)] border-b border-primary/5">
        <div className="flex items-center h-16 relative">
          <button
            onClick={() => navigate(-1)}
            aria-label="Назад"
            className="w-10 h-10 -ml-1 text-primary hover:bg-black/5 rounded-full transition-colors active:scale-95 flex items-center justify-center shrink-0"
          >
            <span className="material-symbols-outlined text-[24px]">arrow_back</span>
          </button>
          <h1 className="absolute left-1/2 -translate-x-1/2 font-headline font-bold text-lg text-primary tracking-tight">Вход</h1>
        </div>
      </header>

      <main className="flex flex-col px-5 pt-10 pb-[max(1.5rem,env(safe-area-inset-bottom))] landscape:px-10 landscape:pt-6 landscape:max-w-[540px] landscape:mx-auto">
        <section className="mb-8">
          <h2 className="font-headline font-extrabold text-4xl landscape:text-2xl text-on-surface mb-3 tracking-tight leading-tight">
            С возвращением
          </h2>
          <p className="text-on-surface-variant text-base font-medium leading-relaxed">
            Введи свой email — мы пришлём одноразовый код для входа.
          </p>
        </section>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-on-surface-variant">Email</label>
            <input
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="your@email.com"
              value={emailInput}
              onChange={(e) => { setEmailInput(e.target.value); setSubmitError('') }}
              className="h-14 rounded-2xl border border-outline-variant bg-surface-container-lowest px-4 text-base text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          <div className="flex flex-col items-center gap-3">
            <button
              type="submit"
              disabled={!canSubmit || isSubmitting}
              className={`h-14 landscape:h-12 w-full font-headline font-bold text-lg rounded-full transition-colors flex items-center justify-center active:scale-[0.98] ${
                canSubmit && !isSubmitting
                  ? 'bg-gradient-to-r from-[#006a65] to-[#2fa7a0] text-white shadow-lg shadow-[#2fa7a0]/30 cursor-pointer'
                  : 'bg-[#e5e2dd] text-[#9ca3af] cursor-not-allowed'
              }`}
            >
              {isSubmitting ? 'Отправляем...' : 'Получить код'}
            </button>

            {submitError === '__not_found__' ? (
              <div className="text-center">
                <p className="text-sm font-medium text-on-surface-variant mb-2">Этот email не найден.</p>
                <Link to="/register" className="text-sm font-bold text-primary underline underline-offset-2">Зарегистрироваться →</Link>
              </div>
            ) : submitError ? (
              <p className="text-center text-sm font-medium text-red-500">{submitError}</p>
            ) : null}

            <p className="text-center text-sm text-on-surface-variant/60">
              Нет аккаунта?{' '}
              <Link to="/register" className="font-bold text-primary">Зарегистрироваться</Link>
            </p>
          </div>
        </form>
      </main>
    </motion.div>
  )
}
