// Шеринг открытки (ТЗ п. 5.3/8): Web Share API → фолбэк на конкретные каналы.
// Картинка 1080×1080 — не в этом этапе (нет реальных фоновых изображений), делимся текстом.

export interface ShareChannel {
  id: 'telegram' | 'whatsapp' | 'max' | 'email' | 'copy'
  label: string
  icon: string
}

export const SHARE_CHANNELS: ShareChannel[] = [
  { id: 'telegram', label: 'Телеграм', icon: 'send' },
  { id: 'whatsapp', label: 'Вотсап', icon: 'chat' },
  { id: 'max', label: 'МАКС', icon: 'forum' },
  { id: 'email', label: 'Почта', icon: 'mail' },
  { id: 'copy', label: 'Копировать', icon: 'content_copy' },
]

/** Пытается системный Web Share; возвращает true если сработал (в т.ч. пользователь просто отменил). */
export async function nativeShare(title: string, text: string): Promise<boolean> {
  if (!navigator.share) return false
  try {
    await navigator.share({ title, text })
    return true
  } catch (err) {
    // AbortError — пользователь закрыл системный шит, это не ошибка.
    if (err instanceof Error && err.name === 'AbortError') return true
    return false
  }
}

/** Открывает конкретный канал (фолбэк, когда navigator.share недоступен). */
export function shareViaChannel(channel: ShareChannel['id'], title: string, text: string) {
  const enc = encodeURIComponent(text)
  switch (channel) {
    case 'telegram':
      window.open(`https://t.me/share/url?url=${encodeURIComponent('yoyojoy.online')}&text=${enc}`, '_blank')
      return
    case 'whatsapp':
      window.open(`https://wa.me/?text=${enc}`, '_blank')
      return
    case 'email':
      window.location.href = `mailto:?subject=${encodeURIComponent(title)}&body=${enc}`
      return
    case 'max':
    case 'copy':
      void copyToClipboard(text)
      return
  }
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}
