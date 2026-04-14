import axios from 'axios'

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
