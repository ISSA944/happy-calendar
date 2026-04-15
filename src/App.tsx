import { useEffect } from 'react'
import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  BookmarksPage,
  HomePage,
  NotificationsListPage,
  NotificationsPage,
  OtpPage,
  ProfileSetupPage,
  RegistrationPage,
  SettingsPage,
  WelcomePage,
} from './pages'
import { useAppStore } from './store'
import { BottomNav } from './components/BottomNav'

// Routes that live inside the persistent AppLayout shell
const APP_SHELL_ROUTES = ['/home', '/bookmarks', '/settings', '/notifications-list']

function AppLayout() {
  const location = useLocation()
  const isHydrated = useAppStore((state) => state.isHydrated)
  const setHydrated = useAppStore((state) => state.setHydrated)

  useEffect(() => {
    setHydrated(true)
  }, [setHydrated])

  return (
    <div className="bg-surface text-on-surface antialiased h-[100dvh] w-full max-w-full overflow-hidden">
      <div className="w-full max-w-[390px] mx-auto h-full relative shadow-sm bg-background flex flex-col overflow-hidden">

        {/* Only the page content fades — BottomNav never remounts */}
        <main
          className="flex-1 w-full overflow-y-auto pb-24 touch-pan-y overscroll-y-contain"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          <AnimatePresence mode="sync" initial={false}>
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15, ease: 'easeInOut' }}
              style={{ willChange: 'opacity' }}
            >
              {isHydrated
                ? <Outlet />
                : <div style={{ background: '#fcf9f4', height: '100%' }} />
              }
            </motion.div>
          </AnimatePresence>
        </main>

        <BottomNav />
      </div>
    </div>
  )
}

function AppRoutes() {
  const location = useLocation()

  // App-shell routes share one stable key → AppLayout never remounts on tab switches.
  // Standalone pages each get a unique key → full crossfade between them.
  const routeKey = APP_SHELL_ROUTES.includes(location.pathname)
    ? 'app-shell'
    : location.key

  return (
    <AnimatePresence mode="sync" initial={false}>
      <Routes location={location} key={routeKey}>
        <Route path="/" element={<WelcomePage />} />
        <Route path="/register" element={<RegistrationPage />} />
        <Route path="/otp" element={<OtpPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/profile-setup" element={<ProfileSetupPage />} />
        <Route element={<AppLayout />}>
          <Route path="/home" element={<HomePage />} />
          <Route path="/bookmarks" element={<BookmarksPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/notifications-list" element={<NotificationsListPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="relative w-full h-[100dvh] overflow-hidden bg-background">
        <AppRoutes />
      </div>
    </BrowserRouter>
  )
}
