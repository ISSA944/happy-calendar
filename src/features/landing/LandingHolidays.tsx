import { useState } from 'react'
import { SectionEyebrow, GiftCtaBlock } from './LandingShared'
import { ThemeArt } from '../holidays/ThemeArt'
import { nativeShare, shareViaChannel, type ShareChannel } from '../../utils/share'

type Tone = 'cute' | 'humor' | 'cynical'

const TONES: { id: Tone; label: string }[] = [
  { id: 'cute', label: 'Милая' },
  { id: 'humor', label: 'С юмором' },
  { id: 'cynical', label: 'Циничная' },
]

// Демо-текст для мокапа открытки — та же логика тона, что в реальной PostcardSheet
// (см. src/features/holidays/PostcardSheet.tsx): картинка не зависит от тона, меняется только текст.
const POSTCARD_DEMO: Record<Tone, string> = {
  cute: '«С Днём пикника! Пусть этот день будет тёплым, лёгким и вкусным, как плед на зелёной траве.»',
  humor: '«День пикника! Муравьи приходят без приглашения, но ведут себя приличнее некоторых гостей.»',
  cynical: '«Идеальный день для пикника. На улице, конечно, дождь — значит, плед, чай и окно тоже считается.»',
}

// Подмножество SHARE_CHANNELS для строки-демо на лендинге — те же 4, что в ТЗ (без «Копировать»).
const LANDING_SHARE_CHANNELS: { id: ShareChannel['id']; label: string }[] = [
  { id: 'telegram', label: 'Телеграм' },
  { id: 'whatsapp', label: 'Вотсап' },
  { id: 'max', label: 'МАКС' },
  { id: 'email', label: 'Почта' },
]

/** Праздники — календарные (открытка+тон) и дни заботы о себе (ТЗ п.2.5, п.4 интерактив).
 * Иллюстрации — реальный ThemeArt, как в PostcardSheet/PersonalCareSheet, не эмодзи. */
export function LandingHolidays() {
  const [tone, setTone] = useState<Tone>('humor')

  // Реальный шеринг демо-открытки: иконка — системный Web Share (если поддерживается),
  // клик по названию конкретного канала — сразу туда, как в реальной PostcardSheet.
  const shareTitle = 'YoYoJoy · День пикника'
  const handleNativeShare = () => void nativeShare(shareTitle, POSTCARD_DEMO[tone])
  const handleChannelShare = (channel: ShareChannel['id']) => shareViaChannel(channel, shareTitle, POSTCARD_DEMO[tone])

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
            <div className="h-24"><ThemeArt themeKey="Еда и вкусности" className="w-full h-full" /></div>
            <div className="bg-white p-3"><p className="text-[12px] leading-snug text-on-surface">{POSTCARD_DEMO[tone]}</p></div>
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

          <div className="flex items-center flex-wrap gap-x-1.5 gap-y-1 text-primary text-[12px] font-bold pt-1">
            <button
              onClick={handleNativeShare}
              aria-label="Поделиться"
              className="w-8 h-8 -ml-1 flex items-center justify-center rounded-full active:scale-90 transition-transform"
            >
              <span className="material-symbols-outlined text-2xl">ios_share</span>
            </button>
            Поделиться:
            {LANDING_SHARE_CHANNELS.map((c, i) => (
              <span key={c.id} className="contents">
                <button onClick={() => handleChannelShare(c.id)} className="underline decoration-primary/30 active:opacity-60">
                  {c.label}
                </button>
                {i < LANDING_SHARE_CHANNELS.length - 1 && <span className="text-on-surface-variant font-normal">·</span>}
              </span>
            ))}
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
            <div className="h-16 rounded-2xl overflow-hidden"><ThemeArt themeKey="Забота о себе и спокойствие" className="w-full h-full" /></div>
            <p className="text-[13px] font-bold text-on-surface">Твой личный день спокойствия</p>
            <p className="text-[12px] text-on-surface-variant leading-snug">
              «Сегодня выдели 5 минут, чтобы замедлиться и почувствовать своё тело — как спокойствие мягко
              разливается внутри.»
            </p>
            <span className="inline-flex items-center gap-1 landing-cta-gradient text-white text-[11px] font-bold px-4 py-2 rounded-full">
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
              Я сделала это
            </span>
          </div>
        </div>

        <GiftCtaBlock />
      </div>
    </section>
  )
}
