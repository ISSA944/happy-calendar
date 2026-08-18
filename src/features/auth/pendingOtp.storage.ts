export type PendingOtpFlow = 'registration' | 'login'

export type PendingOtpContext = {
  email: string
  flow: PendingOtpFlow
  giftEmailAccepted: boolean
  expiresAt: number
}

const STORAGE_KEY = 'yoyojoy-pending-otp'
const CONTEXT_TTL_MS = 30 * 60 * 1000

export function savePendingOtpContext(input: Omit<PendingOtpContext, 'expiresAt'>) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      ...input,
      expiresAt: Date.now() + CONTEXT_TTL_MS,
    }),
  )
}

export function readPendingOtpContext(): PendingOtpContext | null {
  if (typeof window === 'undefined') return null

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const value = JSON.parse(raw) as Partial<PendingOtpContext>
    const valid =
      typeof value.email === 'string' &&
      value.email.length > 0 &&
      (value.flow === 'registration' || value.flow === 'login') &&
      typeof value.giftEmailAccepted === 'boolean' &&
      typeof value.expiresAt === 'number' &&
      value.expiresAt > Date.now()

    if (!valid) {
      window.localStorage.removeItem(STORAGE_KEY)
      return null
    }
    return value as PendingOtpContext
  } catch {
    window.localStorage.removeItem(STORAGE_KEY)
    return null
  }
}

export function clearPendingOtpContext() {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(STORAGE_KEY)
}
