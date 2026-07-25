import { useCallback, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMoodImage } from '../../services/content.service'
import { SectionEyebrow, GiftCtaBlock } from './LandingShared'

// Реальный набор настроений и иконок — см. src/features/mood/MoodSheet.tsx.
const MOODS = [
  { id: 'Спокойна', icon: 'waves' },
  { id: 'Нормально', icon: 'fiber_manual_record' },
  { id: 'Устала', icon: 'nights_stay' },
  { id: 'Тревожна', icon: 'cloud' },
  { id: 'Грустна', icon: 'water_drop' },
]

// Демо-текст поддержки на каждое настроение — без сервера (до регистрации нет знака/настроения
// пользователя), но меняется вместе со свайпом карточки настроения, как в реальном приложении.
const MOOD_PHRASES: Record<string, string> = {
  'Спокойна': 'Тишина внутри — лучший советчик. Сегодня можно просто быть, без лишних усилий.',
  'Нормально': 'Обычный день — тоже хороший день. Не всё должно быть особенным, чтобы иметь значение.',
  'Устала': 'Я рядом, и тебе не нужно сейчас быть сильной на сто процентов. Достаточно пройти этот день шаг за шагом — с заботой о себе.',
  'Тревожна': 'Дыши медленнее — тревога проходит быстрее, чем кажется. Ты уже в безопасности.',
  'Грустна': 'Грусть — тоже часть заботы о себе. Позволь себе прожить её, не торопясь.',
}

/** Настроение — одна широкая карточка за раз (свайп), синхронизированная с блоком
 * поддержки ниже (ТЗ п.2.7, п.5, гибридный мув настроения — см. CLAUDE.md). */
export function LandingMood() {
  const navigate = useNavigate()
  const [activeIdx, setActiveIdx] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)

  const handleScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const idx = Math.round(el.scrollLeft / el.clientWidth)
    setActiveIdx(Math.max(0, Math.min(MOODS.length - 1, idx)))
  }, [])

  const activeMood = MOODS[activeIdx]

  return (
    // В горизонтали: заголовок на всю ширину, ниже карусель слева и карточка поддержки справа —
    // так виден сам «гибридный мув» настроения (свайп слева → текст справа) без прокрутки.
    <section className="bg-surface-container-low relative overflow-hidden pt-8 pb-6 space-y-10 landscape:max-w-[860px] landscape:mx-auto landscape:px-6 landscape:space-y-0 landscape:grid landscape:grid-cols-2 landscape:gap-x-6 landscape:gap-y-6">
      <div className="max-w-sm mx-auto text-center space-y-5 px-6 landscape:px-0 landscape:w-full landscape:col-span-2 landing-fade-in-scroll">
        <SectionEyebrow>КАК ТЫ СЕГОДНЯ?</SectionEyebrow>
        <h2 className="font-headline text-3xl font-bold text-primary leading-tight">
          Поддержка подстраивается под твоё состояние
        </h2>
        <p className="text-[15px] text-on-surface-variant leading-relaxed px-4">
          Выбери настроение — и приложение мягко поддержит именно так, как нужно сейчас.
        </p>
      </div>

      {/* landscape:mx-0 обязателен: mx-auto на grid-элементе отключает stretch по колонке
          (ширина считается по контенту), и карусель со слайдами w-full схлопывается. */}
      <div className="max-w-sm mx-auto px-6 landing-fade-in-scroll landscape:px-0 landscape:max-w-none landscape:mx-0 landscape:w-full landscape:col-start-1 landscape:row-start-2">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex overflow-x-auto no-scrollbar snap-x snap-mandatory rounded-[2.5rem] shadow-xl shadow-black/5"
        >
          {MOODS.map((m) => (
            <div key={m.id} className="snap-center shrink-0 w-full aspect-[16/10] relative overflow-hidden">
              <img src={getMoodImage(m.id)} alt="" className="absolute inset-0 w-full h-full object-cover" />
              {/* Лёгкий оверлей, как на реальном баннере настроения (HomePage.tsx) — не тёмная плашка. */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
              <div className="absolute top-4 left-4 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow-sm">
                <span className="material-symbols-outlined text-primary text-base">{m.icon}</span>
              </div>
              <span className="absolute bottom-4 left-4 bg-white/90 text-primary px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm">
                {m.id}
              </span>
            </div>
          ))}
        </div>
        <div className="flex justify-center gap-1.5 mt-3">
          {MOODS.map((m, i) => (
            <span
              key={m.id}
              className={`h-1.5 rounded-full transition-all ${i === activeIdx ? 'w-5 bg-primary' : 'w-1.5 bg-primary/20'}`}
            />
          ))}
        </div>
      </div>

      <div className="px-6 max-w-sm mx-auto landing-fade-in-scroll landscape:px-0 landscape:max-w-none landscape:mx-0 landscape:w-full landscape:col-start-2 landscape:row-start-2">
        <div className="bg-surface rounded-[3rem] p-9 landscape:p-6 shadow-2xl shadow-black/[0.04] border border-surface-container-high space-y-6 landscape:space-y-4">
          <div className="flex justify-between items-start">
            <h3 className="font-headline text-2xl font-bold text-on-surface">Поддержка на сегодня</h3>
            <div className="bg-accent/10 px-4 py-1.5 rounded-full border border-accent/20">
              <span className="text-[11px] font-bold text-primary uppercase tracking-widest">{activeMood.id}</span>
            </div>
          </div>
          <p className="text-lg text-on-surface-variant leading-relaxed italic font-light">
            {MOOD_PHRASES[activeMood.id]}
          </p>
          <button
            onClick={() => navigate('/register')}
            className="w-full landing-cta-gradient text-white py-4 rounded-full font-bold text-sm shadow-lg active:scale-95 transition-transform"
          >
            Получить поддержку
          </button>
        </div>
      </div>

      <div className="px-6 max-w-sm mx-auto -mt-2 landing-fade-in-scroll landscape:px-0 landscape:mt-0 landscape:w-full landscape:col-span-2 landscape:row-start-3">
        <GiftCtaBlock />
      </div>
    </section>
  )
}
