// Шеринг открытки (ТЗ п. 5.3/8): готовый WebP → Web Share API → публичная ссылка/каналы.

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
export async function nativeShare(title: string, text: string, imageUrl?: string): Promise<boolean> {
  if (!navigator.share) return false
  try {
    if (imageUrl) {
      try {
        const response = await fetch(imageUrl)
        if (response.ok) {
          const blob = await response.blob()
          const filename = new URL(imageUrl).pathname.split('/').pop() || 'yoyojoy-postcard.webp'
          const file = new File([blob], filename, { type: blob.type || 'image/webp' })
          if (navigator.canShare?.({ files: [file] })) {
            await navigator.share({ title, text, files: [file] })
            return true
          }
        }
      } catch {
        // Если картинку нельзя скачать как File, ниже всё равно делимся её публичной ссылкой.
      }
      await navigator.share({ title, text, url: imageUrl })
      return true
    }

    await navigator.share({ title, text })
    return true
  } catch (err) {
    // AbortError — пользователь закрыл системный шит, это не ошибка.
    if (err instanceof Error && err.name === 'AbortError') return true
    return false
  }
}

/** Открывает конкретный канал (фолбэк, когда navigator.share недоступен). */
export function shareViaChannel(channel: ShareChannel['id'], title: string, text: string, imageUrl?: string) {
  const textWithLink = imageUrl ? `${text}\n${imageUrl}` : text
  const enc = encodeURIComponent(textWithLink)
  switch (channel) {
    case 'telegram':
      window.open(`https://t.me/share/url?url=${encodeURIComponent(imageUrl ?? 'https://yoyojoy.online')}&text=${encodeURIComponent(text)}`, '_blank')
      return
    case 'whatsapp':
      window.open(`https://wa.me/?text=${enc}`, '_blank')
      return
    case 'email':
      window.location.href = `mailto:?subject=${encodeURIComponent(title)}&body=${enc}`
      return
    case 'max':
    case 'copy':
      void copyToClipboard(textWithLink)
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
