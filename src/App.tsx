import { lazy, Suspense } from 'react'
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom'
import { BottomNav } from './components/BottomNav'
import { useAppStore } from './store'

const WelcomePage = lazy(() => import('./pages/WelcomePage').then(m => ({ default: m.WelcomePage })))
const HomePage = lazy(() => import('./pages/HomePage').then(m => ({ default: m.HomePage })))
const BookmarksPage = lazy(() => import('./pages/BookmarksPage').then(m => ({ default: m.BookmarksPage })))
const SettingsPage = lazy(() => import('./pages/SettingsPage').then(m => ({ default: m.SettingsPage })))
const NotificationsListPage = lazy(() => import('./pages/NotificationsListPage').then(m => ({ default: m.NotificationsListPage })))
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

  // No shared fade — each page owns its own first-visit fade via module-level flag.
  // Tab switches are now instant at the outlet level; the page component decides
  // whether to animate on its own mount.
  return (
    <div
      className="absolute inset-0 w-full h-full overflow-y-auto pb-24 touch-pan-y overscroll-y-contain"
      style={{ background: '#fcf9f4' }}
    >
      {pathname === '/home' && <HomePage />}
      {pathname === '/bookmarks' && <BookmarksPage />}
      {pathname === '/settings' && <SettingsPage />}
      {pathname === '/notifications-list' && <NotificationsListPage />}
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
