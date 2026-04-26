import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { apiClient } from '../api'
import { useAppStore, useRegistrationDraft } from '../store'
import { isValidEmail } from '../utils/validation'

export function RegistrationPage() {
  const navigate = useNavigate()
  const setUserName = useAppStore((s) => s.setUserName)
  const setEmail = useAppStore((s) => s.setEmail)

  const name = useRegistrationDraft((s) => s.name)
  const emailInput = useRegistrationDraft((s) => s.email)
  const consent = useRegistrationDraft((s) => s.consent)
  const marketing = useRegistrationDraft((s) => s.marketing)
  const updateDraft = useRegistrationDraft((s) => s.update)
  const clearDraft = useRegistrationDraft((s) => s.clear)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const canSubmit = isValidEmail(emailInput) && consent

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit || isSubmitting) return

    setIsSubmitting(true)
    setSubmitError('')

    try {
      await apiClient.post('auth/register', {
        email: emailInput.trim(),
        name: name.trim() || undefined,
        consents: consent,
        marketing,
      })

      setUserName(name.trim())
      setEmail(emailInput.trim())
      clearDraft()
      navigate('/otp')
    } catch {
      setSubmitError('Не удалось отправить код. Проверь соединение и попробуй ещё раз.')
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
      className="relative bg-background text-on-surface font-body selection:bg-primary/20 selection:text-primary h-[100dvh] w-full max-w-[430px] mx-auto overflow-x-hidden overflow-y-auto overscroll-none"
    >
      {/* TopAppBar */}
      <header className="sticky top-0 w-full z-50 bg-background px-5 pt-[env(safe-area-inset-top,0px)] border-b border-primary/5">
        <div className="flex items-center h-16 relative">
          <button
            onClick={() => navigate(-1)}
            aria-label="Назад"
            className="w-10 h-10 -ml-1 text-primary hover:bg-black/5 rounded-full transition-colors active:scale-95 flex items-center justify-center shrink-0"
          >
            <span className="material-symbols-outlined text-[24px]">arrow_back</span>
          </button>
          <h1 className="absolute left-1/2 -translate-x-1/2 font-headline font-bold text-lg text-primary tracking-tight">Регистрация</h1>
        </div>
      </header>

      <main
        className="flex-1 flex flex-col px-5 pt-4 min-h-0 pb-[max(1.5rem,env(safe-area-inset-bottom))] mobile-ls:pb-32"
      >

        {/* ── Headline ── shrinks its bottom margin on tiny screens */}
        <section className="mb-4 shrink-0 mobile-ls:mb-2">
          <h2 className="font-headline font-extrabold text-4xl mobile-ls:text-2xl text-on-surface mb-2 mobile-ls:mb-1 tracking-tight leading-tight">
            Давай начнём
          </h2>
          <p className="text-on-surface-variant text-base mobile-ls:text-sm font-medium leading-relaxed">
            Введите данные, чтобы создать аккаунт.
          </p>
        </section>

        {/* ── Form ── */}
        <form
          className="flex flex-col flex-1 min-h-0"
          onSubmit={handleSubmit}
        >
          {/* Fields — fixed size, always visible */}
          <div className="space-y-4 shrink-0">
            {/* Name */}
            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-on-surface ml-1" htmlFor="name">Имя</label>
              <input
                className="w-full h-14 px-5 bg-surface-container-lowest border border-outline-variant rounded-[24px] text-on-surface placeholder:text-on-surface-variant/40 focus:ring-4 focus:ring-primary/5 focus:border-primary transition-colors outline-none text-base font-medium shadow-sm"
                id="name"
                name="name"
                placeholder="Как к тебе обращаться?"
                type="text"
                value={name}
                onChange={(e) => updateDraft({ name: e.target.value })}
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-on-surface ml-1" htmlFor="email">Электронная почта</label>
              <input
                className="w-full h-14 px-5 bg-surface-container-lowest border border-outline-variant rounded-[24px] text-on-surface placeholder:text-on-surface-variant/40 focus:ring-4 focus:ring-primary/5 focus:border-primary transition-colors outline-none text-base font-medium shadow-sm"
                id="email"
                name="email"
                placeholder="example@mail.com"
                type="email"
                value={emailInput}
                onChange={(e) => updateDraft({ email: e.target.value })}
              />
              <p className="text-xs text-on-surface-variant/60 ml-1">Мы пришлём код подтверждения на эту почту.</p>
            </div>
          </div>

          {/*
            Elastic spacer: fills space in idle state (big screen, no keyboard).
            When keyboard opens and dvh shrinks, this gap collapses first —
            protecting the bottom section from being squeezed or clipped.
          */}
          <div className="flex-1 min-h-[12px]" />

          {/* ── Bottom block: checkboxes + CTA ── always visible */}
          <div className="shrink-0 space-y-4">
            {/* Checkboxes */}
            <div className="space-y-3">
              <label className="flex gap-4 items-start cursor-pointer hover:bg-primary/5 p-3 -m-3 rounded-2xl transition-colors" htmlFor="consent">
                <div className="mt-0.5 shrink-0">
                  <input
                    className="w-5 h-5 rounded-[6px] border-outline-variant text-primary focus:ring-primary/20 cursor-pointer"
                    id="consent"
                    required
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => updateDraft({ consent: e.target.checked })}
                  />
                </div>
                <span className="text-[13px] font-medium text-on-surface-variant leading-snug">
                  Я согласен(а) на обработку персональных данных (обязательно){' '}
                  <Link
                    to="/privacy-policy"
                    onClick={(e) => e.stopPropagation()}
                    className="text-primary font-bold underline underline-offset-4 decoration-primary/50 hover:text-primary/80 transition-colors"
                  >
                    Политика
                  </Link>
                </span>
              </label>

              <label className="flex gap-4 items-start cursor-pointer hover:bg-primary/5 p-3 -m-3 rounded-2xl transition-colors" htmlFor="marketing">
                <div className="mt-0.5 shrink-0">
                  <input
                    className="w-5 h-5 rounded-[6px] border-outline-variant text-primary focus:ring-primary/20 cursor-pointer"
                    id="marketing"
                    type="checkbox"
                    checked={marketing}
                    onChange={(e) => updateDraft({ marketing: e.target.checked })}
                  />
                </div>
                <div>
                  <span className="text-[13px] font-medium text-on-surface-variant leading-snug block">
                    Я хочу получать рекламную рассылку на почту
                  </span>
                  <p className="text-[11px] text-on-surface-variant/60 mt-0.5">Можно отписаться в любой момент.</p>
                </div>
              </label>
            </div>

            {/* CTA */}
            <button
              disabled={!canSubmit || isSubmitting}
              type="submit"
              className={`h-14 font-headline font-bold text-lg rounded-full transition-colors flex items-center justify-center w-full active:scale-[0.98] ${
                canSubmit && !isSubmitting
                  ? 'bg-gradient-to-r from-[#006a65] to-[#2fa7a0] text-white shadow-lg shadow-[#2fa7a0]/30 cursor-pointer'
                  : 'bg-[#e5e2dd] text-[#9ca3af] cursor-not-allowed'
              }`}
            >
              {isSubmitting ? 'Отправляем...' : 'Получить код'}
            </button>

            {submitError && (
              <p className="text-center text-sm font-medium text-red-500">
                {submitError}
              </p>
            )}

            <p className="text-center text-sm font-medium text-on-surface-variant/70">
              Почта нужна, чтобы сохранить твои настройки.
            </p>
          </div>
        </form>
      </main>

      {/* Glassmorphism blobs */}

    </motion.div>
  )
}
