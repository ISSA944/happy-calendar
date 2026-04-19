import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { useAppStore, useRegistrationDraft } from '../store'

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

  const isValidEmail = (v: string) => /\S+@\S+\.\S+/.test(v)
  const canSubmit = isValidEmail(emailInput) && consent

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (canSubmit) {
      setUserName(name.trim())
      setEmail(emailInput.trim())
      clearDraft()
      navigate('/otp')
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      style={{ willChange: 'opacity', transform: 'translateZ(0)' }}
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
        className="flex-1 flex flex-col px-5 pt-4 min-h-0"
        style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
      >

        {/* ── Headline ── shrinks its bottom margin on tiny screens */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-4 shrink-0"
        >
          <h2 className="font-headline font-extrabold text-4xl text-on-surface mb-2 tracking-tight leading-tight">
            Давай начнём
          </h2>
          <p className="text-on-surface-variant text-base font-medium leading-relaxed">
            Введите данные, чтобы создать аккаунт.
          </p>
        </motion.section>

        {/* ── Form ── */}
        <motion.form
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex flex-col flex-1 min-h-0"
          onSubmit={handleSubmit}
        >
          {/* Fields — fixed size, always visible */}
          <div className="space-y-4 shrink-0">
            {/* Name */}
            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-on-surface ml-1" htmlFor="name">Имя</label>
              <input
                className="w-full h-14 px-5 bg-surface-container-lowest border border-outline-variant rounded-[24px] text-on-surface placeholder:text-on-surface-variant/40 focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all outline-none text-base font-medium shadow-sm"
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
                className="w-full h-14 px-5 bg-surface-container-lowest border border-outline-variant rounded-[24px] text-on-surface placeholder:text-on-surface-variant/40 focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all outline-none text-base font-medium shadow-sm"
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
              disabled={!canSubmit}
              type="submit"
              className={`h-14 font-headline font-bold text-lg rounded-full transition-all flex items-center justify-center w-full active:scale-[0.98] ${
                canSubmit
                  ? 'bg-gradient-to-r from-[#006a65] to-[#2fa7a0] text-white shadow-lg shadow-[#2fa7a0]/30 cursor-pointer'
                  : 'bg-[#e5e2dd] text-[#9ca3af] cursor-not-allowed'
              }`}
            >
              Получить код
            </button>

            <p className="text-center text-sm font-medium text-on-surface-variant/70">
              Почта нужна, чтобы сохранить твои настройки.
            </p>
          </div>
        </motion.form>
      </main>

      {/* Glassmorphism blobs */}
      <div className="fixed top-[-5%] right-[-5%] w-[300px] h-[300px] bg-primary/5 rounded-full blur-[80px] -z-10 pointer-events-none" />
      <div className="fixed bottom-[-5%] left-[-5%] w-[250px] h-[250px] bg-primary/5 rounded-full blur-[60px] -z-10 pointer-events-none" />
    </motion.div>
  )
}
