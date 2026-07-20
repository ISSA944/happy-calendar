import { SectionEyebrow, GiftCtaBlock } from './LandingShared'
import { GOALS } from '../goals/goals.constant'

// Мокап прогресса — тот же визуальный паттерн, что в реальном GoalsProgress.tsx
// (иконка в bg-primary/10, прогресс-бар bg-primary на surface-container-high).
const DEMO_GOALS = [
  { id: GOALS[0].id, title: GOALS[0].title, icon: GOALS[0].icon, days: 10, pct: 65, note: '10 дней позади — забота о себе становится привычкой 💛' },
  { id: GOALS[1].id, title: GOALS[1].title, icon: GOALS[1].icon, days: 7, pct: 40, note: 'Целых 5 дней заботы! Ты готова к переменам 🌿' },
]

/** Твои цели — мокап прогресса + вехи (ТЗ п.2.6, п.5). */
export function LandingGoals() {
  return (
    <section className="bg-surface relative overflow-hidden py-24 px-6">
      <div className="max-w-sm mx-auto text-center space-y-5 mb-14 landing-fade-in-scroll">
        <SectionEyebrow>ТВОИ ЦЕЛИ</SectionEyebrow>
        <h2 className="font-headline text-3xl font-bold text-primary leading-tight">Мягкий прогресс к себе настоящей</h2>
        <p className="text-[15px] text-on-surface-variant leading-relaxed px-2">
          Выбери, что хочешь улучшить — и задания мягко подстроятся под тебя. Мы будем рядом и поддержим на
          каждом шаге.
        </p>
      </div>

      <div className="max-w-sm mx-auto space-y-6">
        <div className="bg-surface-container-lowest rounded-[2.5rem] p-6 shadow-xl shadow-black/[0.04] border border-surface-container-high space-y-5 landing-fade-in-scroll">
          {DEMO_GOALS.map((g) => (
            <div key={g.id} className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-primary text-lg">{g.icon}</span>
                </div>
                <span className="flex-1 text-[14px] font-semibold text-on-surface">{g.title}</span>
                <span className="text-[12px] text-on-surface-variant font-semibold whitespace-nowrap">{g.days} дней</span>
              </div>
              <div className="h-2 rounded-full bg-surface-container-high overflow-hidden">
                <div className="h-full bg-primary" style={{ width: `${g.pct}%` }} />
              </div>
              <div className="text-[12px] text-primary bg-primary/[0.07] rounded-xl px-3 py-2">{g.note}</div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-4 bg-accent/10 rounded-3xl p-5 border border-accent/20 landing-fade-in-scroll">
          <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-2xl shadow-sm">🌿</div>
          <div>
            <p className="text-[13px] font-bold text-on-surface">Поздравляем на каждой вехе</p>
            <p className="text-[12px] text-on-surface-variant leading-snug">5, 10, 15, 20 дней… — push с тёплыми словами и наградой.</p>
          </div>
        </div>

        <GiftCtaBlock />
      </div>
    </section>
  )
}
