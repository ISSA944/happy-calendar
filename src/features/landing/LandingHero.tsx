import welcomeOrbImg from '../../assets/images/welcome-orb.webp'

const FEATURES = [
  { icon: 'auto_awesome', label: 'Гороскоп по твоему знаку' },
  { icon: 'favorite', label: 'Поддержка в моменте по настроению', fill: true },
  { icon: 'celebration', label: 'Праздники и тёплые открытки' },
  { icon: 'self_improvement', label: 'Тёплые дни заботы о себе' },
  { icon: 'target', label: 'Твои цели и мягкий прогресс' },
]

// Силуэты леса на фоне hero — каждое дерево своя маленькая абсолютно позиционированная SVG
// (НЕ общий viewBox на всю секцию — на мобильном карточка занимает почти всю ширину экрана,
// общий viewBox с preserveAspectRatio="slice" обреза́л деревья по бокам за пределы кадра).
// Только полоса НАД карточкой — нижняя полоса на мобильном (карточка вертикально центрирована
// в min-h-[100svh]) физически уезжала за нижний край экрана и была не видна, убрана целиком.
interface TreeSpec {
  leftPct: number
  size: number
  tone: string
  delay: string
  duration: string
}

const FOREST_TREES: TreeSpec[] = [
  { leftPct: 2, size: 60, tone: 'rgba(0,106,101,0.45)', delay: '0s', duration: '7s' },
  { leftPct: 21, size: 82, tone: 'rgba(47,167,160,0.6)', delay: '-2.4s', duration: '5.5s' },
  { leftPct: 42, size: 52, tone: 'rgba(0,106,101,0.4)', delay: '-3.6s', duration: '6.6s' },
  { leftPct: 58, size: 68, tone: 'rgba(0,106,101,0.45)', delay: '-1s', duration: '6.2s' },
  { leftPct: 79, size: 84, tone: 'rgba(47,167,160,0.6)', delay: '-4s', duration: '6.5s' },
  { leftPct: 96, size: 58, tone: 'rgba(0,106,101,0.42)', delay: '-1.8s', duration: '7.3s' },
]

/** Одно дерево: ствол + слоистая хвойная крона (2 сужающихся яруса), качается от корня
 * (transform-origin: bottom, см. index.css). Ярусы вместо трёх кружков — читается именно
 * как дерево, а не как «шарики на палке». */
function ForestTree({ leftPct, size, tone, delay, duration }: TreeSpec) {
  return (
    <div
      className="absolute top-3 animate-landing-tree-sway pointer-events-none"
      style={{ left: `${leftPct}%`, width: size, height: size, animationDelay: delay, animationDuration: duration }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 80 100" className="w-full h-full">
        <rect x="36" y="78" width="8" height="20" rx="2" fill={tone} />
        <path d="M40 8 L64 46 L54 46 L72 74 L8 74 L26 46 L16 46 Z" fill={tone} />
      </svg>
    </div>
  )
}

/**
 * Hero — «Здесь можно выдохнуть». Орб и фон — те же, что были на старом WelcomePage
 * (см. историю src/pages/WelcomePage.tsx): сплошной градиентный круг с welcome-orb.webp
 * поверх mix-blend-overlay + белая иконка spa, фон — hero-gradient (index.css). Над карточкой —
 * лёгкий лес (силуэты деревьев, покачивающиеся от ветерка), см. FOREST_TREES выше.
 */
export function LandingHero() {
  return (
    <section
      className="relative min-h-[100svh] flex flex-col items-center justify-center overflow-hidden px-6 hero-gradient"
      id="hero"
    >
      {FOREST_TREES.map((t, i) => (
        <ForestTree key={i} {...t} />
      ))}

      {/* Дышащее пятно за карточкой — декоративное движение фона, без стекла на самой карточке. */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] rounded-full bg-accent/15 blur-[90px] animate-landing-breathe pointer-events-none"
        aria-hidden="true"
      />
      <div className="relative z-20 w-full max-w-sm bg-surface-container-lowest p-10 rounded-[2.5rem] shadow-[0_4px_20px_rgba(0,0,0,0.03)] text-center space-y-8 landing-fade-in-scroll landing-visible">
        <h1 className="font-headline text-4xl font-extrabold text-primary leading-tight">Здесь можно выдохнуть</h1>

        <div className="relative flex justify-center items-center py-2">
          <div className="absolute w-36 h-36 rounded-full border border-primary/10 animate-landing-slow-pulse" />
          <div className="absolute w-28 h-28 rounded-full border border-secondary/10" />
          {/* from-primary/to-accent НЕ используем: у .from-primary в index.css есть ручной override,
              который жёстко фиксирует --tw-gradient-to на прозрачный primary и глушит любой to-*
              после него — тот же приём (произвольные hex), что был в старом WelcomePage. */}
          <div className="relative w-24 h-24 rounded-full bg-gradient-to-tr from-[#006a65] to-[#2fa7a0] shadow-2xl shadow-[#2fa7a0]/30 flex items-center justify-center overflow-hidden">
            <img src={welcomeOrbImg} alt="" className="w-full h-full object-cover mix-blend-overlay opacity-60" />
            <span className="absolute material-symbols-outlined text-white text-4xl opacity-90" style={{ fontVariationSettings: "'FILL' 1" }}>spa</span>
          </div>
        </div>

        <div className="space-y-4 text-left px-1">
          {FEATURES.map((f) => (
            <div key={f.label} className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center text-primary shrink-0">
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
