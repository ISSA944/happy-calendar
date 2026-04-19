import { useState, useRef, useEffect, useCallback, useMemo, memo } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'

// ── Isolated timer so its setInterval never re-renders OTP boxes ──
const CountdownTimer = memo(function CountdownTimer({
  initialSeconds,
  onExpire,
  onResend,
}: {
  initialSeconds: number
  onExpire: () => void
  onResend: () => void
}) {
  const [timeLeft, setTimeLeft] = useState(initialSeconds)
  const expiredRef = useRef(false)

  useEffect(() => {
    expiredRef.current = false
    setTimeLeft(initialSeconds)
  }, [initialSeconds])

  useEffect(() => {
    if (timeLeft <= 0) {
      if (!expiredRef.current) {
        expiredRef.current = true
        onExpire()
      }
      return
    }
    const t = setInterval(() => setTimeLeft(prev => prev - 1), 1000)
    return () => clearInterval(t)
  }, [timeLeft, onExpire])

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
      {timeLeft > 0 && (
        <p className="text-[13px] font-medium text-on-surface-variant/60 mt-1">
          через {formatTime(timeLeft)}
        </p>
      )}
    </div>
  )
})

// ── Single OTP box — memo so siblings don't re-render on unrelated state ──
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
    <div
      className={`w-[72px] h-[72px] bg-surface-container-lowest rounded-[24px] flex items-center justify-center shadow-sm transition-colors duration-150 relative overflow-hidden ${
        isActive
          ? 'border-2 border-primary'
          : 'border border-outline-variant'
      }`}
    >
      {/* font-size: 16px prevents Safari zoom on focus */}
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
      {digit !== '' ? (
        <span className="text-2xl font-headline font-bold text-on-surface pointer-events-none">
          {digit}
        </span>
      ) : (
        <span className={`w-2 h-2 rounded-full pointer-events-none transition-colors ${isActive ? 'bg-on-surface' : 'bg-on-surface-variant/30'}`} />
      )}
    </div>
  )
})

export function OtpPage() {
  const navigate = useNavigate()

  const [code, setCode] = useState(['', '', '', ''])
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const [resendKey, setResendKey] = useState(0) // bumping resets CountdownTimer
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Stable ref callbacks — recreating these inline each render defeats OtpBox memo
  const refCallbacks = useMemo(
    () => Array.from({ length: 4 }, (_, i) => (el: HTMLInputElement | null) => {
      inputRefs.current[i] = el
    }),
    []
  )

  const isValid = code.every(digit => digit !== '')

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

  const handleFocus = useCallback((index: number) => setActiveIndex(index), [])
  const handleBlur = useCallback(() => setActiveIndex(null), [])

  const handleSubmit = useCallback(() => {
    if (isValid) navigate('/notifications')
  }, [isValid, navigate])

  const handleExpire = useCallback(() => {}, [])

  const handleResend = useCallback(() => {
    setCode(['', '', '', ''])
    setResendKey(k => k + 1)
    // slight rAF so state flushes before focus
    requestAnimationFrame(() => inputRefs.current[0]?.focus())
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ type: 'spring', bounce: 0, duration: 0.5 }}
      style={{ willChange: 'opacity, transform', transformOrigin: 'center' }}
      className="relative bg-background text-on-surface font-body selection:bg-primary/20 selection:text-primary h-[100dvh] w-full max-w-[430px] mx-auto overflow-x-hidden overflow-y-auto"
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
          <h1 className="absolute left-1/2 -translate-x-1/2 font-headline font-bold text-lg text-primary tracking-tight">Ввод кода</h1>
        </div>
      </header>

      <main className="flex-1 flex flex-col px-5 pt-10 pb-10">
        {/* ── Headline ── */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-10 shrink-0"
        >
          <h2 className="font-headline font-extrabold text-4xl text-on-surface mb-3 tracking-tight leading-tight">
            Проверим почту
          </h2>
          <p className="text-on-surface-variant text-base font-medium leading-relaxed">
            Мы отправили код на вашу электронную почту.
          </p>
        </motion.section>

        {/* ── OTP Boxes ── */}
        <motion.section
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-10 shrink-0"
        >
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
                onFocus={handleFocus}
                onBlur={handleBlur}
              />
            ))}
          </div>
        </motion.section>

        {/* ── Bottom actions ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-auto flex flex-col items-center gap-6 shrink-0"
          style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
        >
          <button
            onClick={handleSubmit}
            disabled={!isValid}
            className={`h-14 font-headline font-bold text-lg rounded-full transition-all flex items-center justify-center w-full active:scale-[0.98] ${
              isValid
                ? 'bg-gradient-to-r from-[#006a65] to-[#2fa7a0] text-white shadow-lg shadow-[#2fa7a0]/30 cursor-pointer'
                : 'bg-[#e5e2dd] text-[#9ca3af] cursor-not-allowed'
            }`}
          >
            Продолжить
          </button>

          <CountdownTimer
            key={resendKey}
            initialSeconds={30}
            onExpire={handleExpire}
            onResend={handleResend}
          />
        </motion.div>
      </main>

      {/* Glassmorphism blobs */}
      <div className="fixed top-[-5%] right-[-5%] w-[300px] h-[300px] bg-primary/5 rounded-full blur-[80px] -z-10 pointer-events-none" />
      <div className="fixed bottom-[-5%] left-[-5%] w-[250px] h-[250px] bg-primary/5 rounded-full blur-[60px] -z-10 pointer-events-none" />
    </motion.div>
  )
}

