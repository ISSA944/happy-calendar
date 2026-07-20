import { SectionEyebrow, GiftCtaBlock } from './LandingShared'

const FLOATING_CARDS = [
  { icon: 'stars', title: 'Гороскоп', text: 'Прогноз по твоему знаку — кратко и по делу.', pos: 'top-4 -left-6', delay: '0s' },
  { icon: 'favorite', title: 'Поддержка', text: 'Тёплые слова под твоё настроение.', pos: 'top-20 -right-4', delay: '-2s' },
  { icon: 'celebration', title: 'Праздники', text: 'Готовые открытки-поздравления — выбирай и делись.', pos: 'bottom-24 -left-8', delay: '-4s' },
  { icon: 'target', title: 'Цели', text: 'Прогресс к себе настоящей, шаг за шагом.', pos: 'bottom-10 -right-6', delay: '-6s' },
]

/** О приложении — плавающий телефон-мокап + мини-версия главного экрана (ТЗ п.2.4, п.5). */
export function LandingAbout() {
  return (
    <section className="relative px-6 overflow-hidden bg-surface py-24">
      <div className="max-w-sm mx-auto text-center space-y-6 mb-20 landing-fade-in-scroll">
        <SectionEyebrow>О ПРИЛОЖЕНИИ</SectionEyebrow>
        <h2 className="font-headline text-3xl font-bold text-primary leading-tight">
          Твой личный помощник для гармонии и заботы о себе
        </h2>
        <p className="text-[15px] text-on-surface-variant leading-relaxed px-2">
          Гороскопы, поддержка по настроению, праздники с открытками и маленькие шаги заботы — чтобы тебе
          становилось теплее каждый день.
        </p>
      </div>

      <div className="relative max-w-sm mx-auto h-[580px] flex items-center justify-center">
        {FLOATING_CARDS.map((c) => (
          <div
            key={c.title}
            className={`absolute ${c.pos} z-30 w-44 landing-glass-card p-4 rounded-3xl shadow-xl shadow-black/5 animate-landing-float-slow`}
            style={{ animationDelay: c.delay }}
          >
            <div className="flex items-center gap-3 mb-1.5">
              <span className="material-symbols-outlined text-accent text-lg">{c.icon}</span>
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-on-surface">{c.title}</h4>
            </div>
            <p className="text-[10px] text-on-surface-variant leading-normal">{c.text}</p>
          </div>
        ))}

        {/* Телефон-мокап */}
        <div className="relative z-10 w-64 aspect-[9/19.5] bg-[#1c1c19] rounded-[3.5rem] p-3 shadow-2xl shadow-black/30 border-4 border-[#31302d]">
          <div className="w-full h-full rounded-[2.8rem] overflow-hidden bg-surface relative">
            <div className="absolute top-0 inset-x-0 h-6 flex justify-center items-end z-30">
              <div className="w-24 h-5 bg-black rounded-b-2xl" />
            </div>
            <div className="pt-8 px-3 space-y-2.5 text-left">
              <p className="text-[9px] text-center text-on-surface-variant">Сегодня — 17 июня</p>
              <h3 className="text-lg font-bold text-primary leading-none font-headline">Добрый день</h3>
              <div className="flex flex-wrap gap-1">
                <span className="text-[7px] font-bold bg-surface-container text-on-surface-variant px-1.5 py-0.5 rounded-full">♐ Стрелец</span>
                <span className="text-[7px] font-bold bg-accent/10 text-primary px-1.5 py-0.5 rounded-full">Спокойна</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <div className="bg-white rounded-2xl p-2 shadow-sm">
                  <div className="h-8 rounded-lg bg-gradient-to-br from-accent/40 to-accent mb-1 flex items-center justify-center text-base">🌍</div>
                  <p className="text-[7px] font-bold text-accent uppercase">Праздник</p>
                  <p className="text-[8px] font-bold leading-tight text-on-surface">Открытки сегодня</p>
                </div>
                <div className="bg-white rounded-2xl p-2 shadow-sm">
                  <div className="h-8 rounded-lg bg-gradient-to-br from-primary/40 to-primary mb-1 flex items-center justify-center text-base">🌿</div>
                  <p className="text-[7px] font-bold text-accent uppercase">Забота</p>
                  <p className="text-[8px] font-bold leading-tight text-on-surface">День спокойствия</p>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-2 shadow-sm">
                <p className="text-[8px] font-bold mb-1 text-on-surface">Твои цели</p>
                <div className="flex items-center gap-1 mb-1">
                  <span className="text-[8px]">🌿</span>
                  <div className="flex-1 h-1 rounded-full bg-surface-container-high overflow-hidden"><div className="h-full bg-primary" style={{ width: '60%' }} /></div>
                  <span className="text-[7px] text-on-surface-variant">11</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[8px]">👁</span>
                  <div className="flex-1 h-1 rounded-full bg-surface-container-high overflow-hidden"><div className="h-full bg-primary" style={{ width: '40%' }} /></div>
                  <span className="text-[7px] text-on-surface-variant">7</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-sm mx-auto">
        <GiftCtaBlock />
      </div>
    </section>
  )
}
