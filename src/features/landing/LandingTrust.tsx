import { useNavigate } from 'react-router-dom'

/** Trust — соц. доказательство + финальный CTA (ТЗ п.2.8, п.5). Флэт-карточка и hero-gradient
 * фон — тот же приём, что в Hero, без стекла/блюра. */
export function LandingTrust() {
  const navigate = useNavigate()
  return (
    <section className="relative min-h-[100svh] w-full flex flex-col items-center justify-center overflow-hidden pt-8 pb-10 px-6 hero-gradient" id="trust-screen">
      <div className="relative z-10 w-full max-w-sm flex flex-col items-center space-y-16">
        <div className="w-full bg-surface-container-lowest rounded-[2.5rem] p-10 flex flex-col items-center space-y-10 text-center shadow-[0_4px_20px_rgba(0,0,0,0.03)] landing-fade-in-scroll">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full landing-cta-gradient flex items-center justify-center text-white">
              <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>spa</span>
            </div>
            <span className="font-headline text-3xl font-bold text-primary">YoYoJoy</span>
          </div>
          <p className="text-on-surface/90 text-xl font-light leading-relaxed px-1">
            Уже более
            <span className="block text-6xl font-bold text-primary my-4 animate-landing-soft-glow-text relative">
              3 500
              <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-24 h-2 bg-accent/20 rounded-full" />
            </span>
            человек получают персональную поддержку, гороскоп и заботу о себе каждый день
          </p>
          <button
            onClick={() => navigate('/register')}
            className="w-full landing-cta-gradient px-14 py-6 rounded-full text-white font-headline font-bold text-lg shadow-xl active:scale-95 transition-transform animate-landing-button-pulse"
          >
            Присоединиться
          </button>
          <div className="w-full bg-accent/10 rounded-3xl p-4 border border-accent/20 text-left">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-accent text-lg">redeem</span>
              <p className="text-[12px] font-bold text-on-surface">Подарок за регистрацию — на почту</p>
            </div>
            <p className="text-[11px] text-on-surface-variant leading-snug [text-wrap:balance]">
              <b className="text-on-surface">Трекер привычек на месяц</b> и <b className="text-on-surface">чек-лист «30 дней заботы о себе»</b> —
              структура и тёплый ритуал на каждый день.
            </p>
          </div>
        </div>

        <div className="landing-fade-in-scroll text-center py-4" style={{ transitionDelay: '0.3s' }}>
          <p className="text-on-surface/60 text-xl font-light italic leading-relaxed">
            Иногда достаточно просто<br />
            <span className="text-4xl mt-6 block font-normal tracking-[0.2em] text-on-surface uppercase not-italic">выдохнуть.</span>
          </p>
        </div>
      </div>
    </section>
  )
}
