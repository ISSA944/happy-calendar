const ACCESS_TOKEN_KEY = 'yoyojoy-access-token'
const REFRESH_TOKEN_KEY = 'yoyojoy-refresh-token'

function hasWindow() {
  return typeof window !== 'undefined'
}

export function getAccessToken() {
  if (!hasWindow()) return null
  return window.localStorage.getItem(ACCESS_TOKEN_KEY)
}

export function getRefreshToken() {
  if (!hasWindow()) return null
  return window.localStorage.getItem(REFRESH_TOKEN_KEY)
}

export function setAuthTokens(accessToken: string, refreshToken: string) {
  if (!hasWindow()) return
  window.localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
  window.localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
}

export function clearAuthTokens() {
  if (!hasWindow()) return
  window.localStorage.removeItem(ACCESS_TOKEN_KEY)
  window.localStorage.removeItem(REFRESH_TOKEN_KEY)
}
