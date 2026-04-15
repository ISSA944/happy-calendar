import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'

export function OtpPage() {
  const navigate = useNavigate()

  const [code, setCode] = useState(['', '', '', ''])
  const [timeLeft, setTimeLeft] = useState(30)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (timeLeft <= 0) return
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000)
    return () => clearInterval(timer)
  }, [timeLeft])

  const isValid = code.every(digit => digit !== '')

  const handleChange = (index: number, value: string) => {
    if (value && !/^\d+$/.test(value)) return

    if (value.length > 1) {
      const digits = value.slice(0, 4).split('')
      const newCode = [...code]
      digits.forEach((d, i) => { if (index + i < 4) newCode[index + i] = d })
      setCode(newCode)
      inputRefs.current[Math.min(index + digits.length, 3)]?.focus()
      return
    }

    const newCode = [...code]
    newCode[index] = value
    setCode(newCode)
    if (value && index < 3) inputRefs.current[index + 1]?.focus()
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      const newCode = [...code]
      newCode[index - 1] = ''
      setCode(newCode)
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handleSubmit = () => { if (isValid) navigate('/notifications') }

  const handleResend = () => {
    if (timeLeft === 0) {
      setTimeLeft(30)
      setCode(['', '', '', ''])
      inputRefs.current[0]?.focus()
    }
  }

  const formatTime = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      // h-[100dvh] = viewport excluding keyboard on iOS 15.4+
      // overflow-y-hidden = no scroll; elastic spacers handle the squeeze
      className="relative bg-background text-on-surface font-body selection:bg-primary/20 selection:text-primary h-[100dvh] w-full max-w-[390px] mx-auto overflow-x-hidden overflow-y-auto"
    >
      {/* TopAppBar */}
      <header className="sticky top-0 w-full z-50 bg-background px-5 pt-[env(safe-area-inset-top,0px)] border-b border-primary/5">
        <div className="flex items-center gap-4 h-16">
          <button
            onClick={() => navigate(-1)}
            aria-label="Назад"
            className="w-10 h-10 -ml-1 text-primary hover:bg-black/5 rounded-full transition-colors active:scale-95 flex items-center justify-center shrink-0"
          >
            <span className="material-symbols-outlined text-[24px]">arrow_back</span>
          </button>
          <h1 className="font-headline font-bold text-lg text-primary tracking-tight truncate">Подтверждение</h1>
        </div>
      </header>

      {/*
        Layout strategy:
          headline (shrink-0)
          ↕ elastic gap 1 (flex-1, min 20px)
          OTP boxes (shrink-0)
          ↕ elastic gap 2 (flex-1, min 20px)
          button + resend (shrink-0)

        When keyboard opens, dvh shrinks and both gaps collapse equally.
        Neither the boxes nor the button ever get clipped.
      */}
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
            {code.map((digit, index) => {
              const isFilled = digit !== ''
              const isActive = inputRefs.current[index] === document.activeElement

              return (
                <div
                  key={index}
                  onClick={() => inputRefs.current[index]?.focus()}
                  className={`w-[72px] h-[72px] bg-surface-container-lowest rounded-[24px] flex items-center justify-center shadow-sm transition-all duration-200 relative overflow-hidden ${
                    isActive
                      ? 'border-2 border-primary ring-4 ring-primary/5'
                      : 'border border-outline-variant'
                  }`}
                >
                  {/* font-size: 16px prevents Safari zoom on focus */}
                  <input
                    ref={(el) => { inputRefs.current[index] = el }}
                    type="text"
                    inputMode="numeric"
                    maxLength={4}
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    style={{ fontSize: '16px' }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-text z-10"
                  />
                  {isFilled ? (
                    <span className="text-2xl font-headline font-bold text-on-surface pointer-events-none">
                      {digit}
                    </span>
                  ) : (
                    <span className={`w-2 h-2 rounded-full pointer-events-none transition-colors ${isActive ? 'bg-on-surface' : 'bg-on-surface-variant/30'}`} />
                  )}
                </div>
              )
            })}
          </div>
        </motion.section>

        {/* ── Bottom actions — always pinned above keyboard ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-auto pb-6 flex flex-col items-center gap-6 shrink-0"
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

          <div className="text-center">
            <button
              onClick={handleResend}
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
        </motion.div>

      </main>

      {/* Glassmorphism blobs */}
      <div className="fixed top-[-5%] right-[-5%] w-[300px] h-[300px] bg-primary/5 rounded-full blur-[80px] -z-10 pointer-events-none" />
      <div className="fixed bottom-[-5%] left-[-5%] w-[250px] h-[250px] bg-primary/5 rounded-full blur-[60px] -z-10 pointer-events-none" />
    </motion.div>
  )
}
