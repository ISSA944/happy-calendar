import { Suspense, useEffect, useState, type ReactNode } from 'react'
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { BottomNav } from './components/BottomNav'
import { PageLoader } from './components/ui/PageLoader'
import { useAppStore } from './store'
import { getAccessToken } from './auth/token-storage'
import { PWAUpdater } from './components/ui/PWAUpdater'

// Home stays static because it is the primary post-onboarding screen.
import { HomePage } from './pages/HomePage'
import { BookmarksPage } from './pages/BookmarksPage'
import { SettingsPage } from './pages/SettingsPage'
import { NotificationsListPage } from './pages/NotificationsListPage'

// WelcomePage is static — it's the first screen new users see, no lazy flash.
import { WelcomePage } from './pages/WelcomePage'

// All core auth and onboarding pages are eagerly loaded to prevent white flashes (Suspense fallbacks)
import { NotificationsPage } from './pages/NotificationsPage'
import { OtpPage } from './pages/OtpPage'
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage'
import { ProfileSetupPage } from './pages/ProfileSetupPage'
import { RegistrationPage } from './pages/RegistrationPage'
import { ChangeEmailPage } from './pages/ChangeEmailPage'
import { ChangeEmailOtpPage } from './pages/ChangeEmailOtpPage'

const APP_SHELL_ROUTES: readonly string[] = ['/home', '/bookmarks', '/settings', '/notifications-list']

let lastSyncAt = 0

function PageFallback() {
  return <div className="h-[100dvh] w-full" style={{ background: '#fcf9f4' }} />
}

function RootGuard() {
  const hasCompletedOnboarding = useAppStore(s => s.hasCompletedOnboarding)
  const syncProfile = useAppStore(s => s.syncProfile)
  const [hasCheckedProfile, setHasCheckedProfile] = useState(false)
  const hasToken = !!getAccessToken()
  const needsProfileCheck = hasToken && !hasCompletedOnboarding && !hasCheckedProfile

  useEffect(() => {
    if (!needsProfileCheck) return
    let cancelled = false
    void syncProfile().finally(() => {
      if (!cancelled) setHasCheckedProfile(true)
    })
    return () => { cancelled = true }
  }, [needsProfileCheck, syncProfile])

  if (!hasToken) return <WelcomePage />
  if (needsProfileCheck) return <PageFallback />
  return hasCompletedOnboarding ? <Navigate to="/home" replace /> : <Navigate to="/profile-setup" replace />
}

function RequireAuth({ children }: { children: ReactNode }) {
  if (!getAccessToken()) return <Navigate to="/" replace />
  return children
}

function RequireAppReady({ children }: { children: ReactNode }) {
  const hasCompletedOnboarding = useAppStore(s => s.hasCompletedOnboarding)
  const syncProfile = useAppStore(s => s.syncProfile)
  const [hasCheckedProfile, setHasCheckedProfile] = useState(false)
  const hasToken = !!getAccessToken()
  const needsProfileCheck = hasToken && !hasCompletedOnboarding && !hasCheckedProfile

  useEffect(() => {
    if (!needsProfileCheck) return
    let cancelled = false
    void syncProfile().finally(() => {
      if (!cancelled) setHasCheckedProfile(true)
    })
    return () => { cancelled = true }
  }, [needsProfileCheck, syncProfile])

  if (!hasToken) return <Navigate to="/" replace />
  if (needsProfileCheck) return <PageFallback />
  if (!hasCompletedOnboarding) return <Navigate to="/profile-setup" replace />
  return children
}

function TabOutlet() {
  const { pathname } = useLocation()

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden" style={{ background: '#fcf9f4' }}>
      <AnimatePresence mode="wait">
        <motion.div
          key={pathname}
          initial={{ opacity: 0, x: 15 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -15 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="absolute inset-0 w-full h-full overflow-y-auto pb-24 touch-pan-y overscroll-y-contain"
        >
          {pathname === '/home' && <HomePage />}
          {pathname === '/bookmarks' && <BookmarksPage />}
          {pathname === '/settings' && <SettingsPage />}
          {pathname === '/notifications-list' && <NotificationsListPage />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

function AppLayout() {
  const syncProfile = useAppStore(s => s.syncProfile)
  const initDailyPack = useAppStore(s => s.initDailyPack)
  const processOfflineQueue = useAppStore(s => s.processOfflineQueue)

  useEffect(() => {
    lastSyncAt = Date.now()
    void syncProfile()
    void initDailyPack()
    void processOfflineQueue()

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const now = Date.now()
        if (now - lastSyncAt > 5 * 60 * 1000) {
          lastSyncAt = now
          void syncProfile()
          void initDailyPack()
        }
      }
    }

    const handleOnline = () => {
      void processOfflineQueue()
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('online', handleOnline)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('online', handleOnline)
    }
  }, [syncProfile, initDailyPack, processOfflineQueue])

  return (
    <div
      className="bg-background text-on-surface antialiased h-[100dvh] w-full max-w-full overflow-hidden"
      style={{ background: '#fcf9f4' }}
    >
      <div
        className="w-full max-w-[430px] landscape:max-w-[860px] mx-auto h-full relative flex flex-col overflow-hidden"
        style={{ background: '#fcf9f4' }}
      >
        <main className="flex-1 w-full relative overflow-hidden" style={{ background: '#fcf9f4' }}>
          <TabOutlet />
        </main>

        <BottomNav />
      </div>
    </div>
  )
}

function PageTransition({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="absolute inset-0 w-full h-full overflow-hidden"
      style={{ background: '#fcf9f4' }}
    >
      {children}
    </motion.div>
  )
}

function AppRoutes() {
  const location = useLocation()

  // Stable key for all app-shell routes → AppLayout never remounts on tab switch.
  const routeKey = APP_SHELL_ROUTES.includes(location.pathname) ? 'app-shell' : location.key

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={routeKey}>
        <Route path="/" element={<PageTransition><RootGuard /></PageTransition>} />
        <Route path="/register" element={<PageTransition><RegistrationPage /></PageTransition>} />
        <Route path="/otp" element={<PageTransition><OtpPage /></PageTransition>} />
        <Route path="/notifications" element={<PageTransition><RequireAuth><NotificationsPage /></RequireAuth></PageTransition>} />
        <Route path="/change-email" element={<PageTransition><RequireAuth><ChangeEmailPage /></RequireAuth></PageTransition>} />
        <Route path="/change-email-otp" element={<PageTransition><RequireAuth><ChangeEmailOtpPage /></RequireAuth></PageTransition>} />
        <Route path="/profile-setup" element={<PageTransition><RequireAuth><ProfileSetupPage /></RequireAuth></PageTransition>} />
        <Route path="/privacy-policy" element={<PageTransition><PrivacyPolicyPage /></PageTransition>} />
        <Route element={<RequireAppReady><AppLayout /></RequireAppReady>}>
          <Route path="/home" element={null} />
          <Route path="/bookmarks" element={null} />
          <Route path="/settings" element={null} />
          <Route path="/notifications-list" element={null} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  )
}

export default function App() {
  const showOnboardingLoader = useAppStore(s => s.showOnboardingLoader)

  useEffect(() => {
    const img = new Image()
    img.src = '/loader-lotus.png'
  }, [])

  return (
    <BrowserRouter>
      <div
        className="relative w-full h-[100dvh] overflow-hidden"
        style={{ background: '#fcf9f4' }}
      >
        <PageLoader show={showOnboardingLoader} />
        <Suspense fallback={<PageFallback />}>
          <AppRoutes />
        </Suspense>
        <PWAUpdater />
      </div>
    </BrowserRouter>
  )
}
