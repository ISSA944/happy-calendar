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

/** Настроение — лента реальных карточек настроений + демо «Поддержка на сегодня» (ТЗ п.2.7, п.5). */
export function LandingMood() {
  return (
    <section className="bg-surface-container-low relative overflow-hidden py-24 space-y-12">
      <div className="max-w-sm mx-auto text-center space-y-5 px-6 landing-fade-in-scroll">
        <SectionEyebrow>КАК ТЫ СЕГОДНЯ?</SectionEyebrow>
        <h2 className="font-headline text-3xl font-bold text-primary leading-tight">
          Поддержка подстраивается под твоё состояние
        </h2>
        <p className="text-[15px] text-on-surface-variant leading-relaxed px-4">
          Выбери настроение — и приложение мягко поддержит именно так, как нужно сейчас.
        </p>
      </div>

      <div className="relative w-full overflow-hidden landing-fade-in-scroll">
        <div className="flex overflow-x-auto no-scrollbar gap-4 px-8 snap-x snap-mandatory">
          {MOODS.map((m) => (
            <div
              key={m.id}
              className="snap-center shrink-0 w-44 aspect-[3/4] relative rounded-[2.5rem] overflow-hidden shadow-xl shadow-black/5"
            >
              <img src={getMoodImage(m.id)} alt="" className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
              <span className="absolute top-5 left-5 material-symbols-outlined text-white text-3xl drop-shadow">{m.icon}</span>
              <span className="absolute bottom-5 left-5 text-[13px] font-bold text-white uppercase tracking-widest drop-shadow">{m.id}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="px-6 max-w-sm mx-auto landing-fade-in-scroll">
        <div className="bg-surface rounded-[3rem] p-9 shadow-2xl shadow-black/[0.04] border border-surface-container-high space-y-6">
          <div className="flex justify-between items-start">
            <h3 className="font-headline text-2xl font-bold text-on-surface">Поддержка на сегодня</h3>
            <div className="bg-accent/10 px-4 py-1.5 rounded-full border border-accent/20">
              <span className="text-[11px] font-bold text-primary uppercase tracking-widest">Спокойна</span>
            </div>
          </div>
          <p className="text-lg text-on-surface-variant leading-relaxed italic font-light">
            Я рядом, и тебе не нужно сейчас быть сильной на сто процентов. Достаточно пройти этот день шаг
            за шагом — с заботой о себе.
          </p>
          <div className="flex gap-3">
            <button className="flex-1 landing-cta-gradient text-white py-4 rounded-full font-bold text-sm shadow-lg pointer-events-none">Другая фраза</button>
            <button className="flex-1 bg-surface-container text-on-surface py-4 rounded-full font-bold text-sm pointer-events-none">Сохранить</button>
          </div>
        </div>
      </div>

      <div className="px-6 max-w-sm mx-auto -mt-2 landing-fade-in-scroll">
        <GiftCtaBlock />
      </div>
    </section>
  )
}
