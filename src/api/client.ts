import axios, { AxiosError, type AxiosRequestConfig, type InternalAxiosRequestConfig } from 'axios'
import { clearAuthTokens, getAccessToken, getRefreshToken, setAuthTokens } from '../auth/token-storage'

const baseURL = import.meta.env.VITE_API_BASE_URL ?? '/api'

export const apiClient = axios.create({
  baseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.request.use((config) => {
  const accessToken = getAccessToken()
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  return config
})

// ── Auto-refresh on 401 ─────────────────────────────────────────────────────
// Single-flight: parallel 401s share one /auth/refresh call instead of firing N.
// `_retry` flag prevents infinite loops (a request can attempt refresh at most once).

type RetryableConfig = InternalAxiosRequestConfig & { _retry?: boolean }

let refreshPromise: Promise<string> | null = null

async function performRefresh(): Promise<string> {
  const refreshToken = getRefreshToken()
  if (!refreshToken) throw new Error('No refresh token')

  const { data } = await axios.post<{ accessToken: string; refreshToken: string }>(
    `${baseURL.replace(/\/$/, '')}/auth/refresh`,
    { refresh_token: refreshToken },
    { headers: { 'Content-Type': 'application/json' } },
  )

  setAuthTokens(data.accessToken, data.refreshToken)
  return data.accessToken
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetryableConfig | undefined
    const status = error.response?.status

    // Bail out: not a 401, no config, already retried, or refresh request itself failed
    if (
      status !== 401 ||
      !original ||
      original._retry ||
      original.url?.includes('/auth/refresh') ||
      original.url?.includes('/auth/register') ||
      original.url?.includes('/auth/verify-otp') ||
      !getRefreshToken()
    ) {
      return Promise.reject(error)
    }

    original._retry = true

    try {
      // Single-flight: all parallel 401s wait for the same refresh promise
      if (!refreshPromise) {
        refreshPromise = performRefresh().finally(() => {
          refreshPromise = null
        })
      }
      const newAccessToken = await refreshPromise
      original.headers.Authorization = `Bearer ${newAccessToken}`
      return apiClient(original as AxiosRequestConfig)
    } catch (refreshError) {
      // Refresh failed — session is dead, kick the user back to start
      clearAuthTokens()
      if (typeof window !== 'undefined') {
        window.location.replace('/')
      }
      return Promise.reject(refreshError)
    }
  },
)
