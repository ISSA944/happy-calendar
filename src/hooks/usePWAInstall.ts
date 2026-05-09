import { useState, useEffect, useCallback } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

interface UsePWAInstall {
  isInstallable: boolean
  isInstalled: boolean
  isIOS: boolean
  isAndroid: boolean
  triggerInstall: () => Promise<boolean>
}

function getIsStandalone(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in window.navigator && (window.navigator as { standalone?: boolean }).standalone === true)
  )
}

function detectIOS(): boolean {
  if (typeof navigator === 'undefined') return false
  return /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as { MSStream?: unknown }).MSStream
}

function detectAndroid(): boolean {
  if (typeof navigator === 'undefined') return false
  return /android/i.test(navigator.userAgent)
}

export function usePWAInstall(): UsePWAInstall {
  const [isIOS] = useState(() => detectIOS())
  const [isAndroid] = useState(() => detectAndroid())
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  
  const [isInstalled, setIsInstalled] = useState(() => getIsStandalone())
  // Always "installable" on mobile if not already installed, so we can show our own UI
  const [isInstallable, setIsInstallable] = useState(() => (isIOS || isAndroid) && !getIsStandalone())

  useEffect(() => {
    // If already installed, nothing to do
    if (isInstalled) return

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
  }, [isInstalled])

  const triggerInstall = useCallback(async (): Promise<boolean> => {
    if (!deferredPrompt) {
      // Return false to indicate native prompt is NOT available (show manual instructions)
      return false
    }
    
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    
    if (outcome === 'accepted') {
      setIsInstallable(false)
      setDeferredPrompt(null)
      return true
    }
    return false
  }, [deferredPrompt])

  return { isInstallable, isInstalled, isIOS, isAndroid, triggerInstall }
}
