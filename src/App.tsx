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
import { BottomNav } from './components/BottomNav'
import { useAppStore } from './store'

const APP_SHELL_ROUTES = ['/home', '/bookmarks', '/settings', '/notifications-list']

// Redirect to /home if onboarding is already complete
function RootGuard() {
  const hasCompletedOnboarding = useAppStore(s => s.hasCompletedOnboarding)
  return hasCompletedOnboarding ? <Navigate to="/home" replace /> : <WelcomePage />
}

function AppLayout() {
  const location = useLocation()

  return (
    <div className="bg-background text-on-surface antialiased h-[100dvh] w-full max-w-full overflow-hidden" style={{ background: '#fcf9f4' }}>
      <div className="w-full max-w-[430px] mx-auto h-full relative bg-background flex flex-col overflow-hidden" style={{ background: '#fcf9f4' }}>

        {/* Main area: pages absolutely positioned, crossfade synchronously on top of each other */}
        <main
          className="flex-1 w-full relative overflow-hidden bg-background"
          style={{ background: '#fcf9f4' }}
        >
          <AnimatePresence initial={false}>
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              className="absolute inset-0 w-full h-full overflow-y-auto pb-24 touch-pan-y overscroll-y-contain bg-background"
              style={{
                WebkitOverflowScrolling: 'touch',
                background: '#fcf9f4',
                willChange: 'opacity',
                transform: 'translateZ(0)',
              }}
            >
              <Outlet />
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

  // Stable key for app-shell routes → AppLayout never remounts on tab switch.
  // Unique key for standalone pages → AnimatePresence can coordinate their exit.
  const routeKey = APP_SHELL_ROUTES.includes(location.pathname) ? 'app-shell' : location.key

  return (
    <Routes location={location} key={routeKey}>
      <Route path="/" element={<RootGuard />} />
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
