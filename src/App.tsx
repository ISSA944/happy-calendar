import { useEffect, useRef } from 'react'
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

function AppLayout() {
  const location = useLocation()
  const mainRef = useRef<HTMLElement>(null)

  // Reset scroll to top on every tab switch
  useEffect(() => {
    if (mainRef.current) mainRef.current.scrollTop = 0
  }, [location.pathname])

  return (
    <div className="bg-surface text-on-surface antialiased h-[100dvh] w-full max-w-full overflow-hidden">
      <div className="w-full max-w-[390px] mx-auto h-full relative shadow-sm bg-background flex flex-col overflow-hidden">

        {/* Page content crossfades — BottomNav sits below and never remounts */}
        <main
          ref={mainRef}
          className="flex-1 w-full overflow-y-auto pb-24 touch-pan-y overscroll-y-contain"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {/* mode="wait": one page in DOM at a time, pure opacity crossfade */}
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.1 }}
              style={{ willChange: 'opacity' }}
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

  return (
    <Routes location={location}>
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
