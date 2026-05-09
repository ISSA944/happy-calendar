import { useRegisterSW } from 'virtual:pwa-register/react'

export function PWAUpdater() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      if (r) {
        // Проверяем наличие обновлений каждый час
        setInterval(() => r.update(), 60 * 60 * 1000)
      }
    },
    onRegisterError(error) {
      console.error('SW registration error', error)
    },
  })

  if (!needRefresh) return null

  return (
    <div className="fixed bottom-24 inset-x-4 z-[9999] flex justify-center pointer-events-none">
      <div className="bg-surface-container-high border border-primary/20 shadow-xl rounded-2xl p-4 w-full max-w-sm flex items-center justify-between gap-4 pointer-events-auto">
        <div className="flex flex-col">
          <p className="font-headline font-bold text-sm text-on-surface">Доступно обновление</p>
          <p className="font-body text-xs text-on-surface-variant">Приложение будет перезагружено</p>
        </div>
        <button
          onClick={() => updateServiceWorker(true)}
          className="bg-primary text-on-primary px-4 py-2 rounded-full font-bold text-sm shadow-md active:scale-95 transition-transform"
        >
          Обновить
        </button>
      </div>
    </div>
  )
}
