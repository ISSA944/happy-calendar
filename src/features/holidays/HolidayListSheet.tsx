import { useState } from 'react'
import { BottomSheet } from '../../components/ui/BottomSheet'
import type { HolidayCard } from '../../store/app.store'
import { PostcardSheet } from './PostcardSheet'
import { ThemeArt } from './ThemeArt'

interface HolidayListSheetProps {
  isOpen: boolean
  onClose: () => void
  holidays: HolidayCard[]
}

/** Список праздников на дату (ТЗ п. 5.1) — тап по строке открывает открытку. */
export function HolidayListSheet({ isOpen, onClose, holidays }: HolidayListSheetProps) {
  const [selected, setSelected] = useState<HolidayCard | null>(null)

  const hasRu = holidays.some((h) => h.scope === 'ru')
  const note = hasRu ? 'Российские праздники на сегодня.' : 'Сегодня нет российских праздников — показываем международные.'

  return (
    <>
      <BottomSheet isOpen={isOpen && !selected} onClose={onClose} title="Праздники сегодня">
        <div className="px-5 pb-6 flex flex-col gap-3">
          <p className="text-sm text-on-surface-variant -mt-1">{note}</p>
          {holidays.map((h) => (
            <button
              key={h.id}
              onClick={() => setSelected(h)}
              className="flex items-center gap-3 bg-white rounded-2xl p-4 shadow-[0_2px_10px_rgba(0,0,0,0.04)] active:scale-[0.98] transition-transform text-left"
            >
              <div className="w-11 h-11 flex-shrink-0 rounded-xl overflow-hidden">
                <ThemeArt themeKey={h.themeKey} className="w-full h-full" />
              </div>
              <span className="flex-1 min-w-0 font-semibold text-sm text-on-surface truncate">{h.title}</span>
              {h.scope === 'intl' && (
                <span className="text-[10px] font-bold text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full flex-shrink-0">
                  Международный
                </span>
              )}
              <span className="material-symbols-outlined text-on-surface-variant text-lg flex-shrink-0">chevron_right</span>
            </button>
          ))}
        </div>
      </BottomSheet>

      <PostcardSheet holiday={selected} onClose={() => { setSelected(null); onClose() }} onBack={() => setSelected(null)} />
    </>
  )
}
