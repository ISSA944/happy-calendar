import { useState } from 'react'
import { TimePickerSheet } from '../auth/TimePickerSheet'

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
            className={`text-sm font-semibold tabular-nums px-2 py-1 rounded-lg transition-colors ${
              cat.enabled ? 'text-primary active:bg-primary/10' : 'text-on-surface-variant/40'
            }`}
          >
            {cat.time}
          </button>
          <button
            type="button"
            onClick={cat.onToggle}
            aria-label={`${cat.enabled ? 'Выключить' : 'Включить'} ${cat.title}`}
            className={`w-11 h-6 rounded-full relative transition-colors duration-200 flex-shrink-0 ${
              cat.enabled ? 'bg-primary' : 'bg-surface-container-highest'
            }`}
          >
            <span
              className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200"
              style={{ transform: cat.enabled ? 'translateX(24px)' : 'translateX(4px)' }}
            />
          </button>
        </div>
      ))}

      {editing && (
        <TimePickerSheet
          isOpen={Boolean(editing)}
          initialTime={editing.time}
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
