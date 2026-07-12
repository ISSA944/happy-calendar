import { useState } from 'react'
import { TimePickerSheet } from '../auth/TimePickerSheet'
import { Toggle } from '../../components/ui/Toggle'

export interface NotificationCategory {
  id: 'horoscope' | 'support' | 'holidays' | 'personalCare'
  icon: string
  title: string
  sub: string
  enabled: boolean
  time: string
  onToggle: () => void
  onTimeChange: (time: string) => void
}

interface NotificationCategoriesEditorProps {
  categories: NotificationCategory[]
}

/**
 * 4 категории уведомлений, у каждой свой тумблер и время (ТЗ п. 4.2/4.5/8).
 * Переиспользуется в онбординге (шаг 2) и в Настройках.
 */
export function NotificationCategoriesEditor({ categories }: NotificationCategoriesEditorProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const editing = categories.find((c) => c.id === editingId) ?? null

  return (
    <div className="flex flex-col gap-1">
      {categories.map((cat) => (
        <div key={cat.id} className="flex items-center gap-3 py-3">
          <div className="w-10 h-10 flex-shrink-0 rounded-xl bg-surface-container-low flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-lg">{cat.icon}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-on-surface">{cat.title}</p>
            <p className="text-xs text-on-surface-variant">{cat.sub}</p>
          </div>
          <button
            type="button"
            onClick={() => cat.enabled && setEditingId(cat.id)}
            disabled={!cat.enabled}
            aria-label={`Изменить время: ${cat.title}`}
            className={`flex items-center gap-1 text-sm font-semibold tabular-nums pl-2 pr-2.5 py-1.5 rounded-full border transition-colors ${
              cat.enabled
                ? 'text-primary bg-surface-container-low border-outline-variant/30 active:bg-primary/10'
                : 'text-on-surface-variant/40 bg-transparent border-transparent'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">schedule</span>
            {cat.time}
          </button>
          <Toggle
            checked={cat.enabled}
            onChange={cat.onToggle}
            aria-label={`${cat.enabled ? 'Выключить' : 'Включить'} ${cat.title}`}
          />
        </div>
      ))}

      {editing && (
        <TimePickerSheet
          isOpen={Boolean(editing)}
          initialTime={editing.time}
          categoryLabel={editing.title}
          onSave={(time) => {
            editing.onTimeChange(time)
            setEditingId(null)
          }}
          onCancel={() => setEditingId(null)}
        />
      )}
    </div>
  )
}
