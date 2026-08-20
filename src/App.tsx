import { lazy, Suspense, useCallback, useEffect, useState, type ReactNode } from 'react'
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router-dom'
import { AnimatePresence, domAnimation, LazyMotion } from 'framer-motion'
import * as m from 'framer-motion/m'
import { ErrorBoundary } from './components/ErrorBoundary'
import { useAppStore } from './store'
import { getAccessToken } from './auth/token-storage'
import { PWAUpdater } from './components/ui/PWAUpdater'

import { LandingPage } from './pages/LandingPage'

const HomePage = lazy(() => import('./pages/HomePage').then(module => ({ default: module.HomePage })))
const RegistrationPage = lazy(() => import('./pages/RegistrationPage').then(module => ({ default: module.RegistrationPage })))
const LoginPage = lazy(() => import('./pages/LoginPage').then(module => ({ default: module.LoginPage })))
const OtpPage = lazy(() => import('./pages/OtpPage').then(module => ({ default: module.OtpPage })))
const ProfileSetupPage = lazy(() => import('./pages/ProfileSetupPage').then(module => ({ default: module.ProfileSetupPage })))
const BookmarksPage = lazy(() => import('./pages/BookmarksPage').then(module => ({ default: module.BookmarksPage })))
const SettingsPage = lazy(() => import('./pages/SettingsPage').then(module => ({ default: module.SettingsPage })))
const NotificationsListPage = lazy(() => import('./pages/NotificationsListPage').then(module => ({ default: module.NotificationsListPage })))
const NotificationsPage = lazy(() => import('./pages/NotificationsPage').then(module => ({ default: module.NotificationsPage })))
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage').then(module => ({ default: module.PrivacyPolicyPage })))
const ChangeEmailPage = lazy(() => import('./pages/ChangeEmailPage').then(module => ({ default: module.ChangeEmailPage })))
const ChangeEmailOtpPage = lazy(() => import('./pages/ChangeEmailOtpPage').then(module => ({ default: module.ChangeEmailOtpPage })))
const BottomNav = lazy(() => import('./components/BottomNav').then(module => ({ default: module.BottomNav })))
const LoginPushPrompt = lazy(() => import('./features/notifications/LoginPushPrompt').then(module => ({ default: module.LoginPushPrompt })))
const PageLoader = lazy(() => import('./components/ui/PageLoader').then(module => ({ default: module.PageLoader })))

const APP_SHELL_ROUTES: readonly string[] = ['/home', '/bookmarks', '/settings', '/notifications-list']

let lastSyncAt = 0

function PageFallback() {
  return <div className="h-[100dvh] w-full" style={{ background: '#fcf9f4' }} />
}

function ProfileLoadError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex h-[100dvh] w-full items-center justify-center bg-background px-6 text-center">
      <div className="w-full max-w-sm rounded-[32px] bg-white p-7 shadow-sm">
        <h1 className="font-headline text-2xl font-bold text-on-surface">Не удалось загрузить профиль</h1>
        <p className="mt-3 text-sm leading-6 text-on-surface-variant">
          Проверьте интернет-соединение и повторите загрузку.
        </p>
        <button
          className="mt-6 h-12 w-full rounded-full bg-primary font-headline font-bold text-white"
          onClick={onRetry}
          type="button"
        >
          Попробовать снова
        </button>
      </div>
    </div>
  )
}

function useProfileBootstrap(hasToken: boolean) {
  const hasCompletedOnboarding = useAppStore(s => s.hasCompletedOnboarding)
  const syncProfile = useAppStore(s => s.syncProfile)
  const [status, setStatus] = useState<'checking' | 'ready' | 'error'>(() =>
    hasToken && !hasCompletedOnboarding ? 'checking' : 'ready',
  )

  const checkProfile = useCallback(() => setStatus('checking'), [])

  useEffect(() => {
    if (status !== 'checking') return
    let cancelled = false
    void syncProfile().then((result) => {
      if (!cancelled) setStatus(result === null ? 'error' : 'ready')
    })
    return () => { cancelled = true }
  }, [status, syncProfile])

  return { hasCompletedOnboarding, status, checkProfile }
}

function RootGuard() {
  const hasToken = !!getAccessToken()
  const { hasCompletedOnboarding, status, checkProfile } = useProfileBootstrap(hasToken)

  if (!hasToken) return <LandingPage />
  if (status === 'checking') return <PageFallback />
  if (status === 'error') return <ProfileLoadError onRetry={checkProfile} />
  return hasCompletedOnboarding ? <Navigate to="/home" replace /> : <Navigate to="/profile-setup" replace />
}

function RequireAuth({ children }: { children: ReactNode }) {
  if (!getAccessToken()) return <Navigate to="/" replace />
  return children
}

function RequireAppReady({ children }: { children: ReactNode }) {
  const hasToken = !!getAccessToken()
  const { hasCompletedOnboarding, status, checkProfile } = useProfileBootstrap(hasToken)

  if (!hasToken) return <Navigate to="/" replace />
  if (status === 'checking') return <PageFallback />
  if (status === 'error') return <ProfileLoadError onRetry={checkProfile} />
  if (!hasCompletedOnboarding) return <Navigate to="/profile-setup" replace />
  return children
}

function TabOutlet() {
  const { pathname } = useLocation()

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden" style={{ background: '#fcf9f4' }}>
      <AnimatePresence mode="wait">
        <m.div
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
        </m.div>
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
    <m.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="absolute inset-0 w-full h-full overflow-hidden"
      style={{ background: '#fcf9f4' }}
    >
      {children}
    </m.div>
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

  return (
    <BrowserRouter>
      <LazyMotion features={domAnimation}>
        <div
          className="relative w-full h-[100dvh] overflow-hidden"
          style={{ background: '#fcf9f4' }}
        >
          {showOnboardingLoader && (
            <Suspense fallback={null}>
              <PageLoader show />
            </Suspense>
          )}
          <ErrorBoundary>
            <Suspense fallback={<PageFallback />}>
              <AppRoutes />
            </Suspense>
          </ErrorBoundary>
          <PWAUpdater />
        </div>
      </LazyMotion>
    </BrowserRouter>
  )
}
