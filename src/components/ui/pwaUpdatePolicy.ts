const FORM_ROUTES = new Set([
  '/register',
  '/login',
  '/otp',
  '/profile-setup',
  '/change-email',
  '/change-email-otp',
])

export function shouldApplyPwaUpdateImmediately(pathname: string) {
  return !FORM_ROUTES.has(pathname)
}
