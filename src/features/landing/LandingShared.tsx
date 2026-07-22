import { useNavigate } from 'react-router-dom'

/** Повторяется после секций «О приложении», «Праздники», «Цели», «Настроение» и в Trust (ТЗ п.2). */
export function GiftCtaBlock() {
  const navigate = useNavigate()
  return (
    <div className="mt-8 landing-fade-in-scroll">
      <button
        onClick={() => navigate('/register')}
        className="w-full landing-cta-gradient text-white py-5 rounded-full font-headline font-bold text-lg shadow-xl active:scale-95 hover:scale-[1.02] transition-transform animate-landing-button-pulse"
      >
        Попробовать сейчас
      </button>
      <div className="mt-4 bg-surface rounded-3xl p-5 border border-surface-container-high shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <span className="material-symbols-outlined text-accent">redeem</span>
          <p className="text-[13px] font-bold text-on-surface">Подарок за регистрацию — пришлём на почту</p>
        </div>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center text-accent shrink-0">
              <span className="material-symbols-outlined text-lg">calendar_month</span>
            </div>
            <p className="text-[12px] text-on-surface-variant leading-snug [text-wrap:balance]">
              <b className="text-on-surface">Трекер привычек на месяц</b> — даёт структуру и опору.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center text-accent shrink-0">
              <span className="material-symbols-outlined text-lg">checklist</span>
            </div>
            <p className="text-[12px] text-on-surface-variant leading-snug [text-wrap:balance]">
              <b className="text-on-surface">Чек-лист «30 дней заботы о себе»</b> — маленький ритуал на каждый день.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[11px] font-bold tracking-[0.25em] text-accent uppercase bg-accent/10 px-5 py-2 rounded-full">
      {children}
    </span>
  )
}
