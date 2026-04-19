import { useEffect, useState, type ReactNode } from 'react'
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import {
  BookmarksPage,
  HomePage,
  NotificationsListPage,
  NotificationsPage,
  OtpPage,
  PrivacyPolicyPage,
  ProfileSetupPage,
  RegistrationPage,
  SettingsPage,
  WelcomePage,
} from './pages'
import { BottomNav } from './components/BottomNav'
import { useAppStore } from './store'

const APP_SHELL_ROUTES = ['/home', '/bookmarks', '/settings', '/notifications-list']

function RootGuard() {
  const hasCompletedOnboarding = useAppStore(s => s.hasCompletedOnboarding)
  return hasCompletedOnboarding ? <Navigate to="/home" replace /> : <WelcomePage />
}

// Keep-alive tab: mounts once on first visit, then stays in DOM. Zero remount cost.
function ShellTab({ visible, children }: { visible: boolean; children: ReactNode }) {
  const [hasMounted, setHasMounted] = useState(visible)

  useEffect(() => {
    if (visible && !hasMounted) setHasMounted(true)
  }, [visible, hasMounted])

  if (!hasMounted) return null

  return (
    <div
      aria-hidden={!visible}
      className="absolute inset-0 w-full h-full overflow-y-auto pb-24 touch-pan-y overscroll-y-contain bg-background"
      style={{
        background: '#fcf9f4',
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? 'auto' : 'none',
        transition: 'opacity 0.18s ease-out',
        WebkitOverflowScrolling: 'touch',
        touchAction: 'manipulation',
        willChange: 'opacity',
        zIndex: visible ? 1 : 0,
      }}
    >
      {children}
    </div>
  )
}

function AppLayout() {
  const location = useLocation()
  const { pathname } = location

  return (
    <div
      className="bg-background text-on-surface antialiased h-[100dvh] w-full max-w-full overflow-hidden"
      style={{ background: '#fcf9f4' }}
    >
      <div
        className="w-full max-w-[430px] mx-auto h-full relative bg-background flex flex-col overflow-hidden"
        style={{ background: '#fcf9f4' }}
      >
        <main
          className="flex-1 w-full relative overflow-hidden bg-background"
          style={{ background: '#fcf9f4' }}
        >
          <ShellTab visible={pathname === '/home'}><HomePage /></ShellTab>
          <ShellTab visible={pathname === '/bookmarks'}><BookmarksPage /></ShellTab>
          <ShellTab visible={pathname === '/settings'}><SettingsPage /></ShellTab>
          <ShellTab visible={pathname === '/notifications-list'}><NotificationsListPage /></ShellTab>
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
    <AnimatePresence mode="wait" initial={false}>
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
    </AnimatePresence>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <div
        className="relative w-full h-[100dvh] overflow-hidden bg-background"
        style={{ background: '#fcf9f4' }}
      >
        <AppRoutes />
      </div>
    </BrowserRouter>
  )
}
