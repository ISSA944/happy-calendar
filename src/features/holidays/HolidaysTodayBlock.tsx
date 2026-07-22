import { useState } from 'react'
import { useAppStore } from '../../store'
import { ThemeArt } from './ThemeArt'
import { HolidayListSheet } from './HolidayListSheet'
import { PersonalCareListSheet } from '../personal-care/PersonalCareListSheet'

/** «Праздники сегодня» — 2 карточки: календарный праздник + персональный день заботы (ТЗ п. 4.3). */
export function HolidaysTodayBlock() {
  const todayHolidays = useAppStore((s) => s.todayHolidays)
  const careItems = useAppStore((s) => s.personalCareToday)

  const [isListOpen, setIsListOpen] = useState(false)
  const [isCareOpen, setIsCareOpen] = useState(false)

  const main = todayHolidays[0]
  const extra = todayHolidays.length - 1

  const careMain = careItems[0]
  const careExtra = careItems.length - 1

  return (
    <section className="flex flex-col gap-3">
      {/* Тип 1: календарный праздник. Карточки друг под другом на полную ширину — рядом (grid-cols-2)
          картинка и подписи были слишком мелкими и тесными на мобильном экране. */}
      <button
        onClick={() => main && setIsListOpen(true)}
        disabled={!main}
        className="flex flex-col text-left bg-surface-container-lowest rounded-[1.5rem] overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.03)] active:scale-[0.98] transition-transform disabled:active:scale-100"
      >
        <div className="h-32 overflow-hidden shrink-0">
          {main?.imageUrl
            ? <img src={main.imageUrl} alt="" className="block w-full h-full object-cover" />
            : <ThemeArt themeKey={main?.themeKey ?? 'Уютные пустяки и радости'} className="w-full h-full" />
          }
        </div>
        <div className="p-3">
          <p className="text-[10px] font-bold text-primary uppercase tracking-wide">Праздник дня</p>
          <p className="text-[13px] font-bold text-on-surface leading-tight mt-1 line-clamp-2">
            {main ? main.title : 'Сегодня без праздников'}
          </p>
          {extra > 0 && (
            <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-primary mt-1">
              Ещё {extra}
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            </span>
          )}
        </div>
      </button>

      {/* Тип 2: персональный день заботы — при >1 активной цели показываем "Ещё N", тап открывает
          список целей (PersonalCareListSheet), как и у календарных праздников выше. */}
      <button
        onClick={() => careMain && setIsCareOpen(true)}
        disabled={!careMain}
        className="flex flex-col text-left bg-surface-container-lowest rounded-[1.5rem] overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.03)] active:scale-[0.98] transition-transform relative disabled:active:scale-100"
      >
        <div className="h-32 overflow-hidden relative shrink-0">
          {careMain?.imageUrl
            ? <img src={careMain.imageUrl} alt="" className="block w-full h-full object-cover" />
            : <ThemeArt themeKey={careMain?.themeKey ?? 'Забота о себе и спокойствие'} className="w-full h-full" />
          }
          {careMain?.doneToday && (
            <span className="absolute top-2 right-2 bg-white text-primary text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm flex items-center gap-0.5">
              <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              Сделано
            </span>
          )}
        </div>
        <div className="p-3">
          <p className="text-[10px] font-bold text-primary uppercase tracking-wide">Забота о себе</p>
          <p className="text-[13px] font-bold text-on-surface leading-tight mt-1 line-clamp-2">
            {careMain ? careMain.title : '—'}
          </p>
          {careExtra > 0 && (
            <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-primary mt-1">
              Ещё {careExtra}
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            </span>
          )}
        </div>
      </button>

      <HolidayListSheet isOpen={isListOpen} onClose={() => setIsListOpen(false)} holidays={todayHolidays} />
      <PersonalCareListSheet isOpen={isCareOpen} onClose={() => setIsCareOpen(false)} items={careItems} />
    </section>
  )
}
