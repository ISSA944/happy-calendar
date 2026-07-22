import { SectionEyebrow, GiftCtaBlock } from './LandingShared'
import { ThemeArt } from '../holidays/ThemeArt'
import { getGreeting, getTodayFormatted, getMoodImage } from '../../services/content.service'

const FEATURES = [
  { icon: 'stars', title: 'Гороскоп', text: 'Прогноз по твоему знаку — кратко и по делу.', delay: '0s' },
  { icon: 'favorite', title: 'Поддержка', text: 'Тёплые слова под твоё настроение.', delay: '-2s' },
  { icon: 'celebration', title: 'Праздники', text: 'Готовые открытки-поздравления — выбирай и делись.', delay: '-4s' },
  { icon: 'target', title: 'Цели', text: 'Прогресс к себе настоящей, шаг за шагом.', delay: '-6s' },
]

/** О приложении — 2x2 сетка карточек-фичей НАД телефоном (не поверх него — на реальном узком
 * мобильном экране абсолютно позиционированные карточки вокруг телефона перекрывали его и делали
 * содержимое нечитаемым, см. историю правок) + телефон-мокап крупнее и с более крупным текстом
 * внутри, чем раньше — тоже ради читаемости на реальном устройстве. Корпус телефона — реальный
 * контур iPhone 14/15 Pro Max (Figma Community "Flat Design Device Mockups", node 15:70),
 * отрисован inline-SVG поверх экрана; мини-карточки внутри телефона — реальный ThemeArt. */
export function LandingAbout() {
  return (
    <section className="relative px-6 overflow-hidden bg-surface pt-8 pb-6">
      <div className="max-w-sm mx-auto text-center space-y-6 mb-10 landing-fade-in-scroll">
        <SectionEyebrow>О ПРИЛОЖЕНИИ</SectionEyebrow>
        <h2 className="font-headline text-3xl font-bold text-primary leading-tight">
          Твой личный помощник для гармонии и заботы о себе
        </h2>
        <p className="text-[15px] text-on-surface-variant leading-relaxed px-2">
          Гороскопы, поддержка по настроению, праздники с открытками и маленькие шаги заботы — чтобы тебе
          становилось теплее каждый день.
        </p>
      </div>

      <div className="max-w-sm mx-auto grid grid-cols-2 gap-3 mb-10 landing-fade-in-scroll">
        {FEATURES.map((f) => (
          <div
            key={f.title}
            className="landing-glass-card p-3.5 rounded-2xl shadow-lg shadow-black/5 animate-landing-float-slow"
            style={{ animationDelay: f.delay }}
          >
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-primary text-base">{f.icon}</span>
              </div>
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-on-surface leading-tight">{f.title}</h4>
            </div>
            <p className="text-[10px] text-on-surface-variant leading-normal">{f.text}</p>
          </div>
        ))}
      </div>

      <div className="flex justify-center landing-fade-in-scroll">
        {/* Телефон-мокап — корпус iPhone 14/15 Pro Max, контур из Figma (node 15:70), 477x972 */}
        <div className="relative w-72 aspect-[477/972] drop-shadow-2xl">
          <div className="absolute inset-[2.06%_5.03%_2.06%_4.82%] rounded-[30px] overflow-hidden bg-surface">
            {/* Мини-копия реального HomePage.tsx — тот же порядок блоков и стили (просто в масштабе),
                не абстрактное приближение: шапка (аватар/дата/колокольчик) → приветствие+знак →
                Праздники сегодня (2 карточки) → Твои цели → баннер настроения. */}
            <div className="pt-8 px-3.5 pb-3.5 space-y-3 text-left">
              {/* Шапка — HomePage.tsx: аватар слева, дата по центру, колокольчик справа */}
              <div className="flex items-center justify-between">
                <div className="w-6 h-6 rounded-full bg-surface-container-high flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-outline-variant" style={{ fontSize: '13px' }}>person</span>
                </div>
                <span className="text-[8px] font-semibold text-on-surface-variant font-headline">Сегодня — {getTodayFormatted()}</span>
                <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: '13px' }}>notifications</span>
              </div>

              {/* Приветствие + знак зодиака */}
              <div className="space-y-1.5">
                <h3 className="text-[17px] font-extrabold text-on-surface leading-none font-headline tracking-tight">{getGreeting()}</h3>
                <span className="inline-flex items-center px-2 py-0.5 bg-surface-container rounded-full text-[8px] font-medium text-on-surface-variant">
                  Твой знак: Стрелец
                </span>
              </div>

              {/* Праздники сегодня — 2 карточки в ряд, как HolidaysTodayBlock.tsx */}
              <div>
                <p className="text-[9px] font-bold text-on-surface mb-1 font-headline">Праздники сегодня</p>
                <div className="grid grid-cols-2 gap-1.5">
                  <div className="bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm">
                    <div className="h-8"><ThemeArt themeKey="Уютные пустяки и радости" className="w-full h-full" /></div>
                    <div className="p-1.5">
                      <p className="text-[7px] font-bold text-primary uppercase tracking-wide">Праздник дня</p>
                      <p className="text-[8px] font-bold leading-tight text-on-surface">Открытки сегодня</p>
                    </div>
                  </div>
                  <div className="bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm">
                    <div className="h-8"><ThemeArt themeKey="Забота о себе и спокойствие" className="w-full h-full" /></div>
                    <div className="p-1.5">
                      <p className="text-[7px] font-bold text-primary uppercase tracking-wide">Забота о себе</p>
                      <p className="text-[8px] font-bold leading-tight text-on-surface">День спокойствия</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Твои цели — заголовок+«Изменить» пилюля, потом карточка с рядами, как GoalsProgressBlock/GoalsProgress */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[9px] font-bold text-on-surface font-headline">Твои цели</p>
                  <span className="text-[7px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">Изменить</span>
                </div>
                <div className="bg-surface-container-lowest rounded-xl p-2 shadow-sm space-y-2">
                  <div>
                    <div className="flex items-center gap-1 mb-0.5">
                      <span className="material-symbols-outlined text-primary" style={{ fontSize: '9px' }}>spa</span>
                      <span className="flex-1 text-[8px] font-semibold text-on-surface truncate">Стать спокойнее</span>
                      <span className="text-[7px] font-semibold text-on-surface-variant whitespace-nowrap">11 дней</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-surface-container-high overflow-hidden"><div className="h-full bg-primary" style={{ width: '60%' }} /></div>
                  </div>
                  <div>
                    <div className="flex items-center gap-1 mb-0.5">
                      <span className="material-symbols-outlined text-primary" style={{ fontSize: '9px' }}>favorite</span>
                      <span className="flex-1 text-[8px] font-semibold text-on-surface truncate">Научиться слышать себя</span>
                      <span className="text-[7px] font-semibold text-on-surface-variant whitespace-nowrap">7 дней</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-surface-container-high overflow-hidden"><div className="h-full bg-primary" style={{ width: '40%' }} /></div>
                  </div>
                </div>
              </div>

              {/* Баннер настроения — как в HomePage.tsx (картинка + бейдж настроения в углу) */}
              <div className="rounded-xl overflow-hidden relative h-10">
                <img src={getMoodImage('Спокойна')} alt="" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
                <span className="absolute top-1.5 right-1.5 bg-white/90 text-primary px-2 py-0.5 rounded-full text-[7px] font-bold uppercase tracking-wide">Спокойна</span>
              </div>
            </div>
          </div>

          {/* Корпус — evenodd-контур: сплошная заливка только по рамке, центр (экран) прозрачный */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none z-20"
            viewBox="0 0 477 972"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M11.2835 41.4967C3 57.754 3 79.036 3 121.6V171H2C0.895431 171 0 171.895 0 173V204C0 205.105 0.895431 206 2 206H3V235H2C0.895431 235 0 235.895 0 237V301C0 302.105 0.895431 303 2 303H3V322H2C0.895431 322 0 322.895 0 324V388C0 389.105 0.895431 390 2 390H3V850.4C3 892.964 3 914.246 11.2835 930.503C18.5699 944.804 30.1964 956.43 44.4967 963.716C60.754 972 82.036 972 124.6 972H351.4C393.964 972 415.246 972 431.503 963.716C445.804 956.43 457.43 944.804 464.716 930.503C473 914.246 473 892.964 473 850.4V388H475C476.105 388 477 387.105 477 386V284C477 282.895 476.105 282 475 282H473V121.6C473 79.036 473 57.754 464.716 41.4967C457.43 27.1964 445.804 15.5699 431.503 8.2835C415.246 0 393.964 0 351.4 0H124.6C82.036 0 60.754 0 44.4967 8.2835C30.1964 15.5699 18.5699 27.1964 11.2835 41.4967ZM29.1036 50.5765C23 62.5556 23 78.237 23 109.6V862.4C23 893.763 23 909.444 29.1036 921.423C34.4725 931.961 43.0395 940.527 53.5765 945.896C65.5556 952 81.2371 952 112.6 952H363.4C394.763 952 410.444 952 422.423 945.896C432.961 940.527 441.527 931.961 446.896 921.423C453 909.444 453 893.763 453 862.4V109.6C453 78.2371 453 62.5556 446.896 50.5765C441.527 40.0395 432.961 31.4725 422.423 26.1036C410.444 20 394.763 20 363.4 20H112.6C81.2371 20 65.5556 20 53.5765 26.1036C43.0395 31.4725 34.4725 40.0395 29.1036 50.5765Z"
              fill="#1c1c19"
            />
          </svg>

          {/* Dynamic Island */}
          <div className="absolute inset-[2.98%_36.69%_93.11%_36.9%] z-30" aria-hidden="true">
            <svg viewBox="0 0 126 38" fill="none" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <path d="M0 19C0 8.50659 8.50659 0 19 0H107C117.493 0 126 8.50659 126 19C126 29.4934 117.493 38 107 38H19C8.50659 38 0 29.4934 0 19Z" fill="#1c1c19" />
              <circle cx="107" cy="19" r="6" fill="#444445" />
            </svg>
          </div>
        </div>
      </div>

      <div className="max-w-sm mx-auto mt-10">
        <GiftCtaBlock />
      </div>
    </section>
  )
}
