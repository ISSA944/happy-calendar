import { FirebaseError, getApp, getApps, initializeApp } from 'firebase/app'
import {
  getMessaging,
  getToken,
  isSupported,
  onMessage,
  type MessagePayload,
  type Messaging,
} from 'firebase/messaging'

const FCM_TOKEN_KEY = 'yoyojoy-fcm-token'
const APP_SW_PATH = '/sw.js'

type FirebaseMessagingContext = {
  messaging: Messaging
  vapidKey: string
  serviceWorkerRegistration: ServiceWorkerRegistration
}

function getFirebaseConfig() {
  const {
    VITE_FIREBASE_API_KEY,
    VITE_FIREBASE_AUTH_DOMAIN,
    VITE_FIREBASE_PROJECT_ID,
    VITE_FIREBASE_STORAGE_BUCKET,
    VITE_FIREBASE_MESSAGING_SENDER_ID,
    VITE_FIREBASE_APP_ID,
    VITE_FIREBASE_MEASUREMENT_ID,
    VITE_FIREBASE_VAPID_KEY,
  } = import.meta.env

  if (
    !VITE_FIREBASE_API_KEY ||
    !VITE_FIREBASE_AUTH_DOMAIN ||
    !VITE_FIREBASE_PROJECT_ID ||
    !VITE_FIREBASE_STORAGE_BUCKET ||
    !VITE_FIREBASE_MESSAGING_SENDER_ID ||
    !VITE_FIREBASE_APP_ID ||
    !VITE_FIREBASE_VAPID_KEY
  ) {
    return null
  }

  return {
    config: {
      apiKey: VITE_FIREBASE_API_KEY,
      authDomain: VITE_FIREBASE_AUTH_DOMAIN,
      projectId: VITE_FIREBASE_PROJECT_ID,
      storageBucket: VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: VITE_FIREBASE_APP_ID,
      measurementId: VITE_FIREBASE_MEASUREMENT_ID,
    },
    vapidKey: VITE_FIREBASE_VAPID_KEY,
  }
}

function getFirebaseApp() {
  const firebase = getFirebaseConfig()
  if (!firebase) return null
  return getApps().length ? getApp() : initializeApp(firebase.config)
}

async function getMessagingContext(): Promise<FirebaseMessagingContext | null> {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return null
  }

  const firebase = getFirebaseConfig()
  if (!firebase) return null

  const supported = await isSupported()
  if (!supported) return null

  const app = getFirebaseApp()
  if (!app) return null

  await navigator.serviceWorker.register(APP_SW_PATH)
  const serviceWorkerRegistration = await navigator.serviceWorker.ready

  const messaging = getMessaging(app)

  return {
    messaging,
    vapidKey: firebase.vapidKey,
    serviceWorkerRegistration,
  }
}

export function getStoredFcmToken() {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem(FCM_TOKEN_KEY)
}

export function setStoredFcmToken(token: string) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(FCM_TOKEN_KEY, token)
}

export function clearStoredFcmToken() {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(FCM_TOKEN_KEY)
}

export async function getFirebaseMessagingToken() {
  try {
    const context = await getMessagingContext()
    if (!context) return null

    const token = await getToken(context.messaging, {
      vapidKey: context.vapidKey,
      serviceWorkerRegistration: context.serviceWorkerRegistration,
    })

    return token || null
  } catch (error) {
    if (error instanceof FirebaseError) {
      console.warn(`[FCM] ${error.code}: ${error.message}`)
      return null
    }

    console.warn('[FCM] Unexpected error while requesting token', error)
    return null
  }
}

export function isFirebaseMessagingConfigured() {
  return Boolean(getFirebaseConfig())
}

export async function onFirebaseForegroundMessage(
  callback: (payload: MessagePayload) => void | Promise<void>,
) {
  try {
    const context = await getMessagingContext()
    if (!context) return undefined
    return onMessage(context.messaging, callback)
  } catch (error) {
    console.warn('[FCM] Unable to attach foreground message handler', error)
    return undefined
  }
}
