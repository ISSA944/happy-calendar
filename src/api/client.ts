import axios from 'axios'
import { getAccessToken } from '../auth/token-storage'

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Simulate realistic network latency in development only
if (import.meta.env.DEV) {
  apiClient.interceptors.request.use(async (config) => {
    await new Promise<void>((r) => setTimeout(r, 600 + Math.random() * 400))
    return config
  })
}

apiClient.interceptors.request.use((config) => {
  const accessToken = getAccessToken()

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }

  return config
})
