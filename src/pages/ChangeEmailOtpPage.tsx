import { useCallback, useMemo, useRef, useState, memo, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { apiClient } from '../api'
import { setAuthTokens } from '../auth/token-storage'
import { useAppStore, useEmailChangeDraft } from '../store'
import { getHttpStatus } from '../utils/http'

const CountdownTimer = memo(function CountdownTimer({
  initialSeconds,
  onResend,
}: {
  initialSeconds: number
  onResend: () => void
}) {
  const [timeLeft, setTimeLeft] = useState(initialSeconds)

  useEffect(() => {
    if (timeLeft <= 0) return
    const t = setInterval(() => setTimeLeft(prev => prev - 1), 1000)
    return () => clearInterval(t)
  }, [timeLeft])

  const formatTime = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`

  return (
    <div className="text-center">
      <button
        onClick={timeLeft === 0 ? onResend : undefined}
        disabled={timeLeft > 0}
        className={`text-sm font-bold transition-colors ${timeLeft === 0 ? 'text-primary hover:text-primary/80 cursor-pointer active:scale-95' : 'text-on-surface-variant/40 cursor-not-allowed'}`}
      >
        Отправить код ещё раз
      </button>
      {timeLeft > 0 && <p className="text-[13px] font-medium text-on-surface-variant/60 mt-1">через {formatTime(timeLeft)}</p>}
    </div>
  )
})

const OtpBox = memo(function OtpBox({
  index,
  digit,
  isActive,
  inputRef,
  onChange,
  onKeyDown,
  onFocus,
  onBlur,
}: {
  index: number
  digit: string
  isActive: boolean
  inputRef: (el: HTMLInputElement | null) => void
  onChange: (index: number, value: string) => void
  onKeyDown: (index: number, e: React.KeyboardEvent<HTMLInputElement>) => void
  onFocus: (index: number) => void
  onBlur: () => void
}) {
  return (
    <div className={`w-[72px] h-[72px] bg-surface-container-lowest rounded-[24px] flex items-center justify-center shadow-sm transition-colors duration-150 relative overflow-hidden ${isActive ? 'border-2 border-primary' : 'border border-outline-variant'}`}>
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        maxLength={4}
        value={digit}
        onChange={(e) => onChange(index, e.target.value)}
        onKeyDown={(e) => onKeyDown(index, e)}
        onFocus={() => onFocus(index)}
        onBlur={onBlur}
        style={{ fontSize: '16px' }}
        className="absolute inset-0 w-full h-full opacity-0 cursor-text z-10"
      />
      {digit !== ''
        ? <span className="text-2xl font-headline font-bold text-on-surface pointer-events-none">{digit}</span>
        : <span className={`w-2 h-2 rounded-full pointer-events-none transition-colors ${isActive ? 'bg-on-surface' : 'bg-on-surface-variant/30'}`} />}
    </div>
  )
})

export function ChangeEmailOtpPage() {
  const navigate = useNavigate()
  const email = useEmailChangeDraft(s => s.email)
  const consent = useEmailChangeDraft(s => s.consent)
  const marketing = useEmailChangeDraft(s => s.marketing)
  const clearDraft = useEmailChangeDraft(s => s.clear)
  const setEmail = useAppStore(s => s.setEmail)

  const [code, setCode] = useState(['', '', '', ''])
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const [resendKey, setResendKey] = useState(0)
  const [submitError, setSubmitError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const refCallbacks = useMemo(
    () => Array.from({ length: 4 }, (_, i) => (el: HTMLInputElement | null) => {
      inputRefs.current[i] = el
    }),
    [],
  )

  const isValid = code.every(digit => digit !== '')

  useEffect(() => {
    if (!email && !isSuccess) navigate('/change-email', { replace: true })
  }, [email, navigate, isSuccess])

  const handleChange = useCallback((index: number, value: string) => {
    if (value && !/^\d+$/.test(value)) return
    if (value.length > 1) {
      const digits = value.slice(0, 4).split('')
      setCode(prev => {
        const next = [...prev]
        digits.forEach((d, i) => { if (index + i < 4) next[index + i] = d })
        return next
      })
      inputRefs.current[Math.min(index + digits.length, 3)]?.focus()
      return
    }
    setCode(prev => {
      const next = [...prev]
      next[index] = value
      return next
    })
    if (value && index < 3) inputRefs.current[index + 1]?.focus()
  }, [])

  const handleKeyDown = useCallback((index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      setCode(prev => {
        const next = [...prev]
        next[index - 1] = ''
        return next
      })
      inputRefs.current[index - 1]?.focus()
    }
  }, [code])

  const handleSubmit = useCallback(async () => {
    if (!isValid || !email || isSubmitting) return
    setIsSubmitting(true)
    setSubmitError('')

    try {
      const { data } = await apiClient.post<{ accessToken: string; refreshToken: string }>('auth/email-change/verify', {
        email: email.trim(),
        code: code.join(''),
      })
      setIsSuccess(true)
      setAuthTokens(data.accessToken, data.refreshToken)
      setEmail(email.trim())
      clearDraft()
      navigate('/settings', { replace: true, state: { emailChanged: true } })
    } catch (err: unknown) {
      const status = getHttpStatus(err)
      if (status === 401) {
        setSubmitError('Неверный код или срок его действия истек.')
      } else if (status === 409) {
        setSubmitError('Данная почта уже занята другим пользователем.')
      } else {
        setSubmitError('Произошла ошибка. Попробуйте еще раз позже.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }, [clearDraft, code, email, isSubmitting, isValid, navigate, setEmail])

  const handleResend = useCallback(async () => {
    if (!email || isResending) return
    setIsResending(true)
    setSubmitError('')
    try {
      await apiClient.post('auth/email-change/request', { email: email.trim(), consents: consent, marketing })
      setCode(['', '', '', ''])
      setResendKey(k => k + 1)
      requestAnimationFrame(() => inputRefs.current[0]?.focus())
    } catch {
      setSubmitError('Не удалось отправить код повторно. Попробуй чуть позже.')
    } finally {
      setIsResending(false)
    }
  }, [consent, email, isResending, marketing])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.18, ease: [0.32, 0.72, 0, 1] }}
      style={{ willChange: 'opacity' }}
      className="relative bg-background text-on-surface font-body selection:bg-primary/20 selection:text-primary h-[100dvh] w-full max-w-[430px] landscape:max-w-[860px] mx-auto overflow-x-hidden overflow-y-auto"
    >
      <header className="sticky top-0 w-full z-50 bg-background px-5 pt-[env(safe-area-inset-top,0px)] border-b border-primary/5">
        <div className="flex items-center h-16 relative">
          <button onClick={() => navigate('/change-email')} aria-label="Назад" className="w-10 h-10 -ml-1 text-primary hover:bg-black/5 rounded-full transition-colors active:scale-95 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[24px]">arrow_back</span>
          </button>
          <h1 className="absolute left-1/2 -translate-x-1/2 font-headline font-bold text-lg text-primary tracking-tight">Смена почты</h1>
        </div>
      </header>

      <main className="flex-1 flex flex-col px-5 pt-10 pb-10 landscape:pt-4 landscape:pb-4 landscape:max-w-[540px] landscape:mx-auto landscape:justify-center">
        <section className="mb-10 shrink-0 landscape:mb-5">
          <h2 className="font-headline font-extrabold text-4xl landscape:text-2xl text-on-surface mb-3 landscape:mb-1 tracking-tight leading-tight">
            Проверим почту
          </h2>
          <p className="text-on-surface-variant text-base landscape:text-sm font-medium leading-relaxed">
            Мы отправили код на {email || 'вашу электронную почту'}.
          </p>
        </section>

        <section className="mb-10 shrink-0 landscape:mb-5">
          <div className="flex justify-between gap-3">
            {code.map((digit, index) => (
              <OtpBox
                key={index}
                index={index}
                digit={digit}
                isActive={activeIndex === index}
                inputRef={refCallbacks[index]}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                onFocus={setActiveIndex}
                onBlur={() => setActiveIndex(null)}
              />
            ))}
          </div>
        </section>

        <div className="mt-auto flex flex-col items-center gap-4 shrink-0 landscape:mt-0" style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}>
          <button
            onClick={handleSubmit}
            disabled={!isValid || isSubmitting}
            className={`h-14 landscape:h-12 font-headline font-bold text-lg rounded-full transition-colors flex items-center justify-center w-full active:scale-[0.98] ${isValid && !isSubmitting ? 'bg-[#006a65] text-white shadow-lg shadow-[#006a65]/30 cursor-pointer' : 'bg-[#e5e2dd] text-[#9ca3af] cursor-not-allowed'}`}
          >
            {isSubmitting ? 'Проверяем...' : 'Продолжить'}
          </button>

          {submitError && <p className="text-center text-sm font-medium text-red-500">{submitError}</p>}
          <CountdownTimer key={resendKey} initialSeconds={30} onResend={handleResend} />
        </div>
      </main>
    </motion.div>
  )
}
