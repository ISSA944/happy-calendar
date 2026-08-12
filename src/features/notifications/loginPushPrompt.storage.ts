const LOGIN_PUSH_CHECK_KEY = 'yoyojoy:login-push-check'

export function markLoginPushCheckPending() {
  try {
    window.sessionStorage.setItem(LOGIN_PUSH_CHECK_KEY, 'pending')
  } catch {
    // Browsers can deny sessionStorage in restricted/private contexts.
  }
}

export function hasPendingLoginPushCheck() {
  try {
    return window.sessionStorage.getItem(LOGIN_PUSH_CHECK_KEY) === 'pending'
  } catch {
    return false
  }
}

export function clearPendingLoginPushCheck() {
  try {
    window.sessionStorage.removeItem(LOGIN_PUSH_CHECK_KEY)
  } catch {
    // The prompt is best-effort; auth must not fail on storage restrictions.
  }
}
