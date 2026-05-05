import { lazy, Suspense } from 'react'
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { BottomNav } from './components/BottomNav'
import { useAppStore } from './store'
import { useFirebaseForegroundNotifications } from './hooks/useFirebasePush'

// App-shell tabs — static imports so Suspense never flashes a blank screen
// when switching between Home / Bookmarks / Settings.
import { HomePage } from './pages/HomePage'
import { BookmarksPage } from './pages/BookmarksPage'
import { SettingsPage } from './pages/SettingsPage'
import { NotificationsListPage } from './pages/NotificationsListPage'

// WelcomePage is static — it's the first screen new users see, no lazy flash.
import { WelcomePage } from './pages/WelcomePage'

// Remaining auth pages are lazy (loaded once per session).
const NotificationsPage = lazy(() => import('./pages/NotificationsPage').then(m => ({ default: m.NotificationsPage })))
const OtpPage = lazy(() => import('./pages/OtpPage').then(m => ({ default: m.OtpPage })))
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage').then(m => ({ default: m.PrivacyPolicyPage })))
const ProfileSetupPage = lazy(() => import('./pages/ProfileSetupPage').then(m => ({ default: m.ProfileSetupPage })))
const RegistrationPage = lazy(() => import('./pages/RegistrationPage').then(m => ({ default: m.RegistrationPage })))

const APP_SHELL_ROUTES: readonly string[] = ['/home', '/bookmarks', '/settings', '/notifications-list']

function PageFallback() {
  return <div className="h-[100dvh] w-full" style={{ background: '#fcf9f4' }} />
}

function RootGuard() {
  const hasCompletedOnboarding = useAppStore(s => s.hasCompletedOnboarding)
  return hasCompletedOnboarding ? <Navigate to="/home" replace /> : <WelcomePage />
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

function AppRoutes() {
  const location = useLocation()

  // Stable key for all app-shell routes → AppLayout never remounts on tab switch.
  const routeKey = APP_SHELL_ROUTES.includes(location.pathname) ? 'app-shell' : location.key

  return (
    <Routes location={location} key={routeKey}>
      <Route path="/" element={<RootGuard />} />
      <Route path="/register" element={<RegistrationPage />} />
      <Route path="/otp" element={<OtpPage />} />
      <Route path="/notifications" element={<NotificationsPage />} />
      <Route path="/profile-setup" element={<ProfileSetupPage />} />
      <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
      <Route element={<AppLayout />}>
        <Route path="/home" element={null} />
        <Route path="/bookmarks" element={null} />
        <Route path="/settings" element={null} />
        <Route path="/notifications-list" element={null} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  useFirebaseForegroundNotifications()

  return (
    <BrowserRouter>
      <div
        className="relative w-full h-[100dvh] overflow-hidden"
        style={{ background: '#fcf9f4' }}
      >
        <Suspense fallback={<PageFallback />}>
          <AppRoutes />
        </Suspense>
      </div>
    </BrowserRouter>
  )
}
