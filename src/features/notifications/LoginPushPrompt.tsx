import { useEffect, useState } from 'react'
import { useWebPush } from '../../hooks/useWebPush'
import {
  clearPendingLoginPushCheck,
  hasPendingLoginPushCheck,
} from './loginPushPrompt.storage'

function isIosDevice() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent)
}

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches
}

interface PromptContentProps {
  onComplete: () => void
}

function PromptContent({ onComplete }: PromptContentProps) {
  const { isChecking, isSubscribed, isLoading, permission, isSupported, error, subscribe } = useWebPush()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const iosBrowser = isIosDevice() && !isStandalone()

  useEffect(() => {
    if (!isChecking && isSubscribed) onComplete()
  }, [isChecking, isSubscribed, onComplete])

  if (isChecking || isSubscribed) return null

  let title = 'На этом устройстве уведомления ещё не подключены'
  let description = 'Разрешите уведомления, чтобы получать выбранные напоминания на этом устройстве.'
  let canSubscribe = isSupported && permission !== 'denied'

  if (iosBrowser) {
    title = 'Откройте YoYoJoy с домашнего экрана'
    description = 'На iPhone уведомления подключаются только в установленном приложении. Откройте YoYoJoy с домашнего экрана и продолжите настройку там.'
    canSubscribe = false
  } else if (permission === 'denied') {
    title = 'Уведомления заблокированы в настройках устройства'
    description = 'Разрешите уведомления для YoYoJoy в настройках устройства или браузера, затем войдите снова.'
    canSubscribe = false
  } else if (!isSupported) {
    title = 'Уведомления не поддерживаются на этом устройстве'
    description = 'Текущий браузер не позволяет подключить Web Push. Используйте поддерживаемый браузер или установленное приложение.'
    canSubscribe = false
  }

  const handleSubscribe = async () => {
    setSubmitError(null)
    const connected = await subscribe()
    if (connected) {
      onComplete()
      return
    }
    setSubmitError('Не удалось подключить уведомления. Попробуйте ещё раз.')
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center bg-black/35 px-4 pb-6 sm:items-center" role="presentation">
      <section
        aria-describedby="login-push-prompt-description"
        aria-labelledby="login-push-prompt-title"
        aria-modal="true"
        className="w-full max-w-md rounded-[32px] bg-[#fffdf9] p-6 shadow-2xl"
        role="dialog"
      >
        <h2 id="login-push-prompt-title" className="text-xl font-bold text-[#18211f]">{title}</h2>
        <p id="login-push-prompt-description" className="mt-3 text-base leading-6 text-[#65706d]">{description}</p>
        {(submitError || error) && <p className="mt-3 text-sm text-red-600">{submitError || error}</p>}
        <div className="mt-6 grid gap-3">
          {canSubscribe && (
            <button
              className="rounded-full bg-[#087f73] px-5 py-3 font-semibold text-white disabled:opacity-60"
              disabled={isLoading}
              onClick={handleSubscribe}
              type="button"
            >
              {isLoading ? 'Подключаем…' : 'Разрешить уведомления'}
            </button>
          )}
          <button className="rounded-full px-5 py-3 font-semibold text-[#087f73]" onClick={onComplete} type="button">
            Настроить позже
          </button>
        </div>
      </section>
    </div>
  )
}

export function LoginPushPrompt() {
  const [pending, setPending] = useState(hasPendingLoginPushCheck)

  if (!pending) return null

  const complete = () => {
    clearPendingLoginPushCheck()
    setPending(false)
  }

  return <PromptContent onComplete={complete} />
}
