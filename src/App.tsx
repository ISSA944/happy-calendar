import { useEffect } from 'react'
import {
  BrowserRouter,
  Navigate,
  Outlet,
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
  ProfileSetupPage,
  RegistrationPage,
  SettingsPage,
  WelcomePage,
} from './pages'
import { useAppStore } from './store'
import { BottomNav } from './components/BottomNav'

function AppLayout() {
  const isHydrated = useAppStore((state) => state.isHydrated)
  const setHydrated = useAppStore((state) => state.setHydrated)

  useEffect(() => {
    setHydrated(true)
  }, [setHydrated])

  return (
    <div className="bg-surface text-on-surface antialiased h-[100dvh] w-full max-w-full overflow-hidden">
      {/* Mobile container constraint */}
      <div className="w-full max-w-[390px] mx-auto h-full relative shadow-sm bg-background flex flex-col overflow-hidden">

        {/* Main Content Area — sole scroll container, pb-24 clears the fixed BottomNav */}
        <main
          className="flex-1 w-full overflow-y-auto pb-24 touch-pan-y overscroll-y-contain"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {isHydrated
            ? <Outlet />
            : <div style={{ background: '#fcf9f4', height: '100%' }} />
          }
        </main>

        <BottomNav />
      </div>
    </div>
  )
}

function AppRoutes() {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
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
