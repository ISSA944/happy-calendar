import { useState } from 'react'
import { apiClient } from '../../api'
import { useWebPush } from '../../hooks/useWebPush'

export function PushDeviceStatus() {
  const { isChecking, isSubscribed, isLoading, error: hookError, subscribe } = useWebPush()
  const [isSendingTest, setIsSendingTest] = useState(false)
  const [testSent, setTestSent] = useState(false)
  const [testError, setTestError] = useState<string | null>(null)

  const sendTest = async () => {
    setIsSendingTest(true)
    setTestSent(false)
    setTestError(null)
    try {
      await apiClient.post<{ sent: number; total: number }>('push/test')
      setTestSent(true)
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
      {testSent && <p className="mt-3 text-xs text-primary">Тестовый push отправлен</p>}
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
