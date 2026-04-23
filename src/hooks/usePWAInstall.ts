import { useState, useEffect, useCallback } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

interface UsePWAInstall {
  isInstallable: boolean
  isInstalled: boolean
  isIOS: boolean
  triggerInstall: () => Promise<void>
}

function getIsStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in window.navigator && (window.navigator as { standalone?: boolean }).standalone === true)
  )
}

function detectIOS(): boolean {
  return (
    /iphone|ipad|ipod/i.test(navigator.userAgent) &&
    !(window as { MSStream?: unknown }).MSStream &&
    !getIsStandalone()
  )
}

export function usePWAInstall(): UsePWAInstall {
  const [isIOS] = useState(() => detectIOS())
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstallable, setIsInstallable] = useState(() => isIOS)
  const [isInstalled, setIsInstalled] = useState(() => getIsStandalone())

  useEffect(() => {
    // iOS Safari never fires beforeinstallprompt — handle separately
    if (isIOS) return

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setIsInstallable(true)
    }

    const handleAppInstalled = () => {
      setIsInstallable(false)
      setIsInstalled(true)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [isIOS])

  const triggerInstall = useCallback(async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setIsInstallable(false)
      setDeferredPrompt(null)
    }
  }, [deferredPrompt])

  return { isInstallable, isInstalled, isIOS, triggerInstall }
}
