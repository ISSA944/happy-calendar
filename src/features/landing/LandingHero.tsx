const FEATURES = [
  { icon: 'auto_awesome', label: 'Гороскоп по твоему знаку' },
  { icon: 'favorite', label: 'Поддержка в моменте по настроению', fill: true },
  { icon: 'celebration', label: 'Праздники и тёплые открытки' },
  { icon: 'self_improvement', label: 'Тёплые дни заботы о себе' },
  { icon: 'target', label: 'Твои цели и мягкий прогресс' },
]

/** Hero — «Здесь можно выдохнуть»: дышащий орб + 5 фич-строк (ТЗ п.2.3, п.5 Hero). */
export function LandingHero() {
  return (
    <section
      className="relative min-h-[100svh] flex flex-col items-center justify-center overflow-hidden px-6"
      id="hero"
    >
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div
          className="landing-parallax-bg absolute inset-0 w-full h-full animate-landing-sea-breathe scale-110"
          style={{ background: 'radial-gradient(circle at 30% 20%, #2FA7A044 0%, transparent 55%), radial-gradient(circle at 80% 75%, #00393608 0%, transparent 60%), #fcf9f4' }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-surface/30 via-transparent to-surface/40" />
        <div className="absolute top-[20%] left-[-20%] w-[140%] h-[60%] bg-accent/10 blur-[120px] animate-landing-fog-drift rounded-full" />
      </div>

      <div className="relative z-20 w-full max-w-sm landing-glass-panel p-10 rounded-[4rem] shadow-2xl shadow-black/5 text-center space-y-8 landing-fade-in-scroll landing-visible">
        <h1 className="font-headline text-4xl font-extrabold text-primary leading-tight">Здесь можно выдохнуть</h1>

        <div className="relative flex justify-center items-center py-2">
          <div className="absolute w-36 h-36 rounded-full border-2 border-accent/10 animate-landing-orb-ring" />
          <div className="absolute w-36 h-36 rounded-full border border-accent/5 animate-landing-orb-ring" style={{ animationDelay: '2.5s' }} />
          <div className="relative w-24 h-24 rounded-full bg-accent/10 flex items-center justify-center animate-landing-slow-pulse">
            <div className="w-20 h-20 rounded-full bg-accent/20 flex items-center justify-center backdrop-blur-md shadow-inner shadow-white/40">
              <span className="material-symbols-outlined text-accent text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>spa</span>
            </div>
          </div>
        </div>

        <div className="space-y-4 text-left px-1">
          {FEATURES.map((f) => (
            <div key={f.label} className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-white/70 flex items-center justify-center text-accent shadow-sm shrink-0">
                <span className="material-symbols-outlined text-xl" style={f.fill ? { fontVariationSettings: "'FILL' 1" } : undefined}>{f.icon}</span>
              </div>
              <span className="text-on-surface font-medium text-sm">{f.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
