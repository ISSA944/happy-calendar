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

/** Prepare before the click: awaiting fetch inside share loses mobile user activation. */
export async function prepareShareFile(imageUrl: string, signal?: AbortSignal): Promise<File | null> {
  const controller = new AbortController()
  const abort = () => controller.abort()
  const timer = setTimeout(abort, 8000)
  signal?.addEventListener('abort', abort, { once: true })
  if (signal?.aborted) abort()
  try {
    const response = await fetch(imageUrl, { signal: controller.signal })
    if (!response.ok) return null
    const blob = await response.blob()
    if (!blob.type.startsWith('image/')) return null
    const filename = new URL(imageUrl, 'https://yoyojoy.online').pathname.split('/').pop() || 'yoyojoy-postcard.webp'
    return new File([blob], filename, { type: blob.type })
  } catch {
    return null
  } finally {
    clearTimeout(timer)
    signal?.removeEventListener('abort', abort)
  }
}

/** true also means the user cancelled: never reopen a second share dialog. */
export async function nativeShare(title: string, text: string, imageUrl?: string, file?: File): Promise<boolean> {
  if (!navigator.share) return false
  try {
    const payload: ShareData = file && navigator.canShare?.({ files: [file] })
      ? { title, text, files: [file] }
      : { title, text, ...(imageUrl ? { url: imageUrl } : {}) }
    await navigator.share(payload)
    return true
  } catch (err) {
    // AbortError — пользователь закрыл системный шит, это не ошибка.
    if (err instanceof Error && err.name === 'AbortError') return true
    return false
  }
}

/** Открывает конкретный канал (фолбэк, когда navigator.share недоступен). */
export async function shareViaChannel(channel: ShareChannel['id'], title: string, text: string, imageUrl?: string): Promise<boolean> {
  const textWithLink = imageUrl ? `${text}\n${imageUrl}` : text
  const enc = encodeURIComponent(textWithLink)
  switch (channel) {
    case 'telegram':
      window.open(`https://t.me/share/url?url=${encodeURIComponent(imageUrl ?? 'https://yoyojoy.online')}&text=${encodeURIComponent(text)}`, '_blank')
      return true
    case 'whatsapp':
      window.open(`https://wa.me/?text=${enc}`, '_blank')
      return true
    case 'email':
      window.location.href = `mailto:?subject=${encodeURIComponent(title)}&body=${enc}`
      return true
    case 'max':
    case 'copy':
      return copyToClipboard(textWithLink)
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
