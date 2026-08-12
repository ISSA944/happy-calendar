import { Suspense, useEffect, useState, type ReactNode } from 'react'
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { BottomNav } from './components/BottomNav'
import { LoginPushPrompt } from './features/notifications/LoginPushPrompt'
import { ErrorBoundary } from './components/ErrorBoundary'
import { PageLoader } from './components/ui/PageLoader'
import { useAppStore } from './store'
import { getAccessToken } from './auth/token-storage'
import { PWAUpdater } from './components/ui/PWAUpdater'

// All pages eagerly loaded — no Suspense flashes on first navigation.
import { LandingPage } from './pages/LandingPage'
import { HomePage } from './pages/HomePage'
import { RegistrationPage } from './pages/RegistrationPage'
import { LoginPage } from './pages/LoginPage'
import { OtpPage } from './pages/OtpPage'
import { ProfileSetupPage } from './pages/ProfileSetupPage'
import { BookmarksPage } from './pages/BookmarksPage'
import { SettingsPage } from './pages/SettingsPage'
import { NotificationsListPage } from './pages/NotificationsListPage'
import { NotificationsPage } from './pages/NotificationsPage'
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage'
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

  if (!hasToken) return <LandingPage />
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
          className="absolute inset-0 w-full h-full overflow-y-auto touch-pan-y overscroll-y-contain"
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
  const navigate = useNavigate()
  const syncProfile = useAppStore(s => s.syncProfile)
  const initDailyPack = useAppStore(s => s.initDailyPack)
  const processOfflineQueue = useAppStore(s => s.processOfflineQueue)

  useEffect(() => {
    lastSyncAt = Date.now()
    void syncProfile()
    void initDailyPack()
    void processOfflineQueue()

    // Push nav: app was closed → opened via /?push_nav=/home (iOS + Android)
    const params = new URLSearchParams(window.location.search)
    const pushNavParam = params.get('push_nav')
    if (pushNavParam) {
      window.history.replaceState({}, '', '/')
      setTimeout(() => navigate(decodeURIComponent(pushNavParam)), 200)
    }

    // Push nav: app was open → SW sends postMessage (iOS + Android)
    const handleSwMessage = (event: MessageEvent) => {
      if (event.data?.type === 'PUSH_NAV' && event.data?.url) {
        setTimeout(() => navigate(event.data.url as string), 100)
      }
    }
    navigator.serviceWorker?.addEventListener('message', handleSwMessage)

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Push nav: iOS PWA — check localStorage for pending navigation
        const pendingNav = localStorage.getItem('push_pending_nav')
        if (pendingNav) {
          localStorage.removeItem('push_pending_nav')
          navigate(pendingNav)
          return
        }
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
      navigator.serviceWorker?.removeEventListener('message', handleSwMessage)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('online', handleOnline)
    }
  }, [syncProfile, initDailyPack, processOfflineQueue, navigate])

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
      <LoginPushPrompt />
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
        <Route path="/login" element={<PageTransition><LoginPage /></PageTransition>} />
        <Route path="/otp" element={<PageTransition><OtpPage /></PageTransition>} />
        <Route path="/notifications" element={<PageTransition><RequireAuth><NotificationsPage /></RequireAuth></PageTransition>} />
        <Route path="/change-email" element={<PageTransition><RequireAuth><ChangeEmailPage /></RequireAuth></PageTransition>} />
        <Route path="/change-email-otp" element={<PageTransition><RequireAuth><ChangeEmailOtpPage /></RequireAuth></PageTransition>} />
        <Route path="/profile-setup" element={<PageTransition><RequireAuth><ProfileSetupPage /></RequireAuth></PageTransition>} />
        <Route path="/politika" element={<PageTransition><PrivacyPolicyPage /></PageTransition>} />
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
        <ErrorBoundary>
          <Suspense fallback={<PageFallback />}>
            <AppRoutes />
          </Suspense>
        </ErrorBoundary>
        <PWAUpdater />
      </div>
    </BrowserRouter>
  )
}
