import { useState } from 'react'
import { apiClient } from '../../api'
import { useWebPush } from '../../hooks/useWebPush'

export function PushDeviceStatus() {
  const {
    permission,
    isSupported,
    isChecking,
    isSubscribed,
    isLoading,
    error: hookError,
    subscribe,
  } = useWebPush()
  const [isSendingTest, setIsSendingTest] = useState(false)
  const [testError, setTestError] = useState<string | null>(null)

  const sendTest = async () => {
    setIsSendingTest(true)
    setTestError(null)
    try {
      const { data } = await apiClient.post<{ sent: number; total: number }>('push/test')
      if (data.sent <= 0) {
        setTestError('Не удалось отправить тестовый push. Попробуйте ещё раз.')
      }
    } catch {
      setTestError('Не удалось отправить тестовый push. Попробуйте ещё раз.')
    } finally {
      setIsSendingTest(false)
    }
  }

  const handleRecovery = async () => {
    if (await subscribe()) {
      await sendTest()
    }
  }

  if (!isSupported) {
    return (
      <div className="mt-4 rounded-xl bg-surface-container-low px-4 py-4">
        <p className="font-semibold text-sm text-on-surface">
          Push-уведомления не поддерживаются этим браузером.
        </p>
      </div>
    )
  }

  if (permission === 'denied') {
    return (
      <div className="mt-4 rounded-xl bg-surface-container-low px-4 py-4">
        <p className="font-semibold text-sm text-on-surface">
          Уведомления заблокированы в настройках браузера.
        </p>
        <p className="mt-1 text-xs leading-relaxed text-on-surface-variant">
          Разрешите уведомления для этого сайта, затем вернитесь сюда.
        </p>
      </div>
    )
  }

  if (isChecking) {
    return (
      <div className="mt-4 rounded-xl bg-surface-container-low px-4 py-3 text-sm text-on-surface-variant">
        Проверяем подключение уведомлений…
      </div>
    )
  }

  const isBusy = isLoading || isSendingTest

  return (
    <div className="mt-4 rounded-xl bg-surface-container-low px-4 py-4">
      <p className="font-semibold text-sm text-on-surface">
        {isSubscribed
          ? 'На этом устройстве уведомления подключены'
          : 'На этом устройстве уведомления не подключены'}
      </p>
      <p className="mt-1 text-xs leading-relaxed text-on-surface-variant">
        {isSubscribed
          ? 'Можно отправить тестовый push, чтобы проверить доставку у провайдера.'
          : 'Подключите уведомления на этом устройстве и сразу отправьте тестовый push.'}
      </p>

      {hookError && <p className="mt-3 text-xs text-error">{hookError}</p>}
      {testError && <p className="mt-3 text-xs text-error">{testError}</p>}

      <button
        type="button"
        onClick={isSubscribed ? sendTest : handleRecovery}
        disabled={isBusy}
        className="mt-4 w-full rounded-full bg-primary px-4 py-3 text-sm font-semibold text-on-primary transition-opacity disabled:opacity-60"
      >
        {isBusy
          ? (isLoading ? 'Подключаем…' : 'Отправляем…')
          : (isSubscribed ? 'Отправить тестовый push' : 'Подключить и проверить')}
      </button>
    </div>
  )
}
