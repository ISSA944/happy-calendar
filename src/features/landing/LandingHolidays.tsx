import { useState } from 'react'
import { SectionEyebrow, GiftCtaBlock } from './LandingShared'

type Tone = 'cute' | 'humor' | 'cynical'

const TONES: { id: Tone; label: string }[] = [
  { id: 'cute', label: '🤍 Милая' },
  { id: 'humor', label: '😄 С юмором' },
  { id: 'cynical', label: '🙃 Циничная' },
]

// Демо-текст для мокапа открытки — тот же приём тона, что в реальной PostcardSheet (см. src/features/holidays/PostcardSheet.tsx).
const POSTCARD_DEMO: Record<Tone, { text: string; gradient: string }> = {
  cute: { text: '«С Днём пикника! Пусть этот день будет тёплым, лёгким и вкусным, как плед на зелёной траве 🧺»', gradient: 'linear-gradient(135deg,#2FA7A044,#2FA7A0)' },
  humor: { text: '«День пикника! Муравьи приходят без приглашения, но ведут себя приличнее некоторых гостей 🐜»', gradient: 'linear-gradient(135deg,#FBE3A1,#F2C14E)' },
  cynical: { text: '«Идеальный день для пикника. На улице, конечно, дождь — значит, плед, чай и окно тоже считается ☔»', gradient: 'linear-gradient(135deg,#CBD3D0,#97A39E)' },
}

/** Праздники — календарные (открытка+тон) и дни заботы о себе (ТЗ п.2.5, п.4 интерактив). */
export function LandingHolidays() {
  const [tone, setTone] = useState<Tone>('humor')
  const demo = POSTCARD_DEMO[tone]

  return (
    <section className="bg-surface-container-low relative overflow-hidden py-24 px-6">
      <div className="max-w-sm mx-auto text-center space-y-5 mb-14 landing-fade-in-scroll">
        <SectionEyebrow>ПРАЗДНИКИ</SectionEyebrow>
        <h2 className="font-headline text-3xl font-bold text-primary leading-tight">
          Два вида праздников — и тёплые открытки
        </h2>
        <p className="text-[15px] text-on-surface-variant leading-relaxed px-2">
          Календарные даты и личные дни заботы. Поздравь близких открыткой в своём тоне.
        </p>
      </div>

      <div className="max-w-sm mx-auto space-y-6">
        {/* Календарные праздники + мокап открытки */}
        <div className="bg-surface rounded-[2.5rem] p-7 shadow-xl shadow-black/[0.04] border border-surface-container-high space-y-4 landing-fade-in-scroll">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-accent/10 flex items-center justify-center text-accent">
              <span className="material-symbols-outlined">celebration</span>
            </div>
            <h3 className="text-lg font-bold font-headline text-on-surface">Календарные праздники</h3>
          </div>
          <p className="text-[14px] text-on-surface-variant leading-relaxed">
            Российские и международные. На одну дату — список праздников. Выбирай открытку по настроению и делись.
          </p>

          <div className="rounded-3xl overflow-hidden border border-surface-container-high">
            <div className="h-24 flex items-center justify-center text-4xl transition-all" style={{ background: demo.gradient }}>🧺</div>
            <div className="bg-white p-3"><p className="text-[12px] leading-snug text-on-surface">{demo.text}</p></div>
          </div>

          <div className="flex gap-2">
            {TONES.map((t) => (
              <button
                key={t.id}
                onClick={() => setTone(t.id)}
                className={`flex-1 text-center text-[11px] font-bold py-2 rounded-xl border transition-colors ${
                  tone === t.id ? 'bg-accent/10 text-primary border-accent/30' : 'bg-surface-container text-on-surface border-surface-container-high'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 text-primary text-[12px] font-bold pt-1">
            <span className="material-symbols-outlined text-base">ios_share</span> Поделиться: Телеграм · Вотсап · МАКС · Почта
          </div>
        </div>

        {/* Дни заботы о себе */}
        <div className="bg-surface rounded-[2.5rem] p-7 shadow-xl shadow-black/[0.04] border border-surface-container-high space-y-4 landing-fade-in-scroll">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-accent/10 flex items-center justify-center text-accent">
              <span className="material-symbols-outlined">self_improvement</span>
            </div>
            <h3 className="text-lg font-bold font-headline text-on-surface">Дни заботы о себе</h3>
          </div>
          <p className="text-[14px] text-on-surface-variant leading-relaxed">
            Каждый день — простое, посильное задание заботы. Маленькие тёплые шаги, после которых на душе
            становится спокойнее.
          </p>
          <div className="rounded-3xl bg-accent/10 p-4 border border-accent/20 space-y-2">
            <div className="h-16 rounded-2xl bg-gradient-to-br from-primary/40 to-primary flex items-center justify-center text-3xl">🌿</div>
            <p className="text-[13px] font-bold text-on-surface">Твой личный день спокойствия</p>
            <p className="text-[12px] text-on-surface-variant leading-snug">
              «Сегодня выдели 5 минут, чтобы замедлиться и почувствовать своё тело — как спокойствие мягко
              разливается внутри.»
            </p>
            <span className="inline-block landing-cta-gradient text-white text-[11px] font-bold px-4 py-2 rounded-full">Я сделала это 🤍</span>
          </div>
        </div>

        <GiftCtaBlock />
      </div>
    </section>
  )
}
