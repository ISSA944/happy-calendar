import { Suspense, useEffect, useState, type ComponentType } from 'react'
import { AnimatePresence, useIsPresent } from 'framer-motion'
import * as m from 'framer-motion/m'

type PageModule = { default: ComponentType }
type PageLoader = () => Promise<PageModule>

// Imports only: warming must never mount pages or trigger their API effects.
// eslint-disable-next-line react-refresh/only-export-components
export function cachedPageLoader(load: PageLoader): PageLoader {
  let pending: Promise<PageModule> | undefined
  return () => {
    pending ??= load().catch(error => { pending = undefined; throw error })
    return pending
  }
}

function TabSurface({ Page }: { Page: ComponentType }) {
  const present = useIsPresent()
  return <m.div
    initial={{ x: 15, opacity: 0 }}
    animate={{ x: 0, opacity: 1 }}
    // Keep an opaque old surface under the entering screen until it is ready.
    exit={{ x: -15, opacity: 1 }}
    transition={{ duration: 0.2, ease: 'easeOut' }}
    inert={!present}
    aria-hidden={!present}
    className="absolute inset-0 overflow-y-auto touch-pan-y overscroll-y-contain bg-[#fcf9f4]"
  ><Page /></m.div>
}

export function ReadyTabOutlet({ path, loaders }: { path: string; loaders: Record<string, PageLoader> }) {
  const [shown, setShown] = useState<{ path: string; Page: ComponentType } | null>(null)
  const [failed, setFailed] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    let cancelled = false
    void loaders[path]().then(module => {
      if (!cancelled) { setShown({ path, Page: module.default }); setFailed(null) }
    }).catch(() => { if (!cancelled) setFailed(path) })
    return () => { cancelled = true }
  }, [path, loaders, attempt])

  return <div className="absolute inset-0 overflow-hidden bg-[#fcf9f4]">
    <Suspense fallback={<p role="status" className="p-6">Загружаем экран…</p>}>
      <AnimatePresence initial={false} mode="sync">
        {shown && <TabSurface key={shown.path} Page={shown.Page} />}
      </AnimatePresence>
    </Suspense>
    {!shown && failed !== path && <p role="status" className="p-6">Загружаем экран…</p>}
    {failed === path && <div role="alert" className="absolute bottom-4 inset-x-4 z-10 rounded-2xl bg-white p-4 shadow-lg">
      Не удалось открыть экран. Проверьте соединение.
      <button className="block min-h-11 text-primary underline" onClick={() => setAttempt(n => n + 1)}>Повторить переход</button>
    </div>}
  </div>
}
