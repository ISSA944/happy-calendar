import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { apiClient } from '../api'
import { useEmailChangeDraft } from '../store'
import { isValidEmail } from '../utils/validation'

export function ChangeEmailPage() {
  const navigate = useNavigate()
  const email = useEmailChangeDraft(s => s.email)
  const consent = useEmailChangeDraft(s => s.consent)
  const marketing = useEmailChangeDraft(s => s.marketing)
  const updateDraft = useEmailChangeDraft(s => s.update)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const canSubmit = isValidEmail(email) && consent

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit || isSubmitting) return

    setIsSubmitting(true)
    setSubmitError('')

    try {
      await apiClient.post('auth/email-change/request', {
        email: email.trim(),
        consents: consent,
        marketing,
      })
      navigate('/change-email-otp')
    } catch (err: any) {
      if (err.response?.status === 409) {
        setSubmitError('Данная почта уже используется другим пользователем.')
      } else if (err.response?.status === 400) {
        setSubmitError('Вы ввели тот же адрес, который используете сейчас.')
      } else {
        setSubmitError('Не удалось отправить код. Проверьте почту и попробуйте ещё раз.')
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
      className="relative h-[100dvh] w-full max-w-[430px] landscape:max-w-[860px] mx-auto overflow-x-hidden overflow-y-auto bg-background text-on-surface font-body selection:bg-primary/20 selection:text-primary"
    >
      <header className="sticky top-0 w-full z-50 bg-background px-5 pt-[env(safe-area-inset-top,0px)] border-b border-primary/5">
        <div className="flex items-center h-16 relative">
          <button
            onClick={() => navigate('/settings')}
            aria-label="Назад"
            className="w-10 h-10 -ml-1 text-primary hover:bg-black/5 rounded-full transition-colors active:scale-95 flex items-center justify-center shrink-0"
          >
            <span className="material-symbols-outlined text-[24px]">arrow_back</span>
          </button>
          <h1 className="absolute left-1/2 -translate-x-1/2 font-headline font-bold text-lg text-primary tracking-tight">Смена почты</h1>
        </div>
      </header>

      <main className="flex-1 flex flex-col px-5 pt-8 pb-[max(1.5rem,env(safe-area-inset-bottom))] landscape:px-10 landscape:pt-6 landscape:pb-6">
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 landscape:grid landscape:grid-cols-2 landscape:gap-8 landscape:items-start">
          <section className="mb-8 landscape:mb-0">
            <h2 className="font-headline font-extrabold text-4xl landscape:text-2xl text-on-surface mb-3 tracking-tight leading-tight">
              Сменим почту
            </h2>
            <p className="text-on-surface-variant text-base landscape:text-sm font-medium leading-relaxed">
              Введите новый адрес, мы отправим на него код подтверждения.
            </p>

            <div className="space-y-1.5 mt-8 landscape:mt-6">
              <label className="block text-sm font-bold text-on-surface ml-1" htmlFor="new-email">
                Электронная почта
              </label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/50 group-focus-within:text-primary transition-colors">mail</span>
                <input
                  id="new-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => updateDraft({ email: e.target.value })}
                  placeholder="example@mail.com"
                  className="w-full h-14 pl-12 pr-5 bg-surface-container-lowest border border-outline-variant rounded-[24px] text-on-surface placeholder:text-on-surface-variant/40 focus:ring-4 focus:ring-primary/5 focus:border-primary transition-colors outline-none text-base font-medium shadow-sm"
                />
              </div>
              <p className="text-xs text-on-surface-variant/60 ml-1">
                Этот адрес будет использоваться для входа и восстановления доступа.
              </p>
            </div>
          </section>

          <div className="flex flex-col justify-between gap-4 mt-6 landscape:mt-0">
            <div className="space-y-3">
              <label className="flex gap-4 items-start cursor-pointer hover:bg-primary/5 p-3 -m-3 rounded-2xl transition-colors" htmlFor="email-change-consent">
                <div className="mt-0.5 shrink-0">
                  <input
                    id="email-change-consent"
                    required
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => updateDraft({ consent: e.target.checked })}
                    className="w-5 h-5 rounded-[6px] border-outline-variant text-primary focus:ring-primary/20 cursor-pointer"
                  />
                </div>
                <span className="text-[13px] font-medium text-on-surface-variant leading-snug">
                  Я согласен(а) на обработку персональных данных (обязательно).{' '}
                  <Link to="/politika" onClick={(e) => e.stopPropagation()} className="text-primary font-bold underline underline-offset-4 decoration-primary/50">
                    Политика
                  </Link>
                </span>
              </label>

              <label className="flex gap-4 items-start cursor-pointer hover:bg-primary/5 p-3 -m-3 rounded-2xl transition-colors" htmlFor="email-change-marketing">
                <div className="mt-0.5 shrink-0">
                  <input
                    id="email-change-marketing"
                    type="checkbox"
                    checked={marketing}
                    onChange={(e) => updateDraft({ marketing: e.target.checked })}
                    className="w-5 h-5 rounded-[6px] border-outline-variant text-primary focus:ring-primary/20 cursor-pointer"
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

            <div className="mt-auto pt-8">
              <button
                disabled={!canSubmit || isSubmitting}
                type="submit"
                className={`h-14 landscape:h-12 font-headline font-bold text-lg rounded-full transition-colors flex items-center justify-center w-full active:scale-[0.98] ${
                  canSubmit && !isSubmitting
                    ? 'bg-[#006a65] text-white shadow-lg shadow-[#006a65]/30 cursor-pointer'
                    : 'bg-[#e5e2dd] text-[#9ca3af] cursor-not-allowed'
                }`}
              >
                {isSubmitting ? 'Отправляем...' : 'Получить код'}
              </button>
              {submitError && <p className="text-center text-sm font-medium text-red-500 mt-4">{submitError}</p>}
            </div>
          </div>
        </form>
      </main>
    </motion.div>
  )
}
