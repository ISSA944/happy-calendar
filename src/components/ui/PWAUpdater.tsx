import { useEffect, useRef } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'

// Раньше юзер должен был сам тапнуть тост «Обновить» — если не замечал его, приложение молча
// зависало на закэшированном service worker'ом бандле после каждого деплоя (источник большинства
// "баг всё ещё не пофикшен" репортов, хотя код на сервере уже был верным). Теперь при обнаружении
// новой версии applyем её сами, без участия юзера.
const AUTO_RELOAD_DELAY_MS = 1500

export function PWAUpdater() {
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null)

  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      if (r) {
        registrationRef.current = r
        // Проверяем наличие обновлений каждый час...
        setInterval(() => r.update(), 60 * 60 * 1000)
      }
    },
    onRegisterError(error) {
      console.error('SW registration error', error)
    },
  })

  useEffect(() => {
    // ...и ещё сразу, как только приложение возвращается на передний план — иначе после деплоя
    // юзер может часами сидеть на закэшированной версии.
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        void registrationRef.current?.update()
      }
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [])

  useEffect(() => {
    if (!needRefresh) return
    const timer = setTimeout(() => void updateServiceWorker(true), AUTO_RELOAD_DELAY_MS)
    return () => clearTimeout(timer)
  }, [needRefresh, updateServiceWorker])

  if (!needRefresh) return null

  return (
    <div className="fixed bottom-24 inset-x-4 z-[9999] flex justify-center pointer-events-none">
      <div className="bg-surface-container-high border border-primary/20 shadow-xl rounded-2xl p-4 w-full max-w-sm flex items-center gap-3 pointer-events-none">
        <p className="font-headline font-bold text-sm text-on-surface">Обновляем приложение…</p>
      </div>
    </div>
  )
}
