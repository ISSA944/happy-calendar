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

  if (isChecking || isSubscribed) return null

  return (
    <div className="mt-4 rounded-xl bg-surface-container-low px-4 py-4">
      <p className="font-semibold text-sm text-on-surface">
        На этом устройстве уведомления не подключены
      </p>
      <p className="mt-1 text-xs leading-relaxed text-on-surface-variant">
        Подключите уведомления, чтобы получать выбранные напоминания на этом устройстве.
      </p>

      {hookError && <p className="mt-3 text-xs text-error">{hookError}</p>}
      <button
        type="button"
        onClick={() => void subscribe()}
        disabled={isLoading}
        className="mt-4 w-full rounded-full bg-primary px-4 py-3 text-sm font-semibold text-on-primary transition-opacity disabled:opacity-60"
      >
        {isLoading ? 'Подключаем…' : 'Подключить уведомления'}
      </button>
    </div>
  )
}
