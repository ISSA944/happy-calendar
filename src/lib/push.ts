/**
 * Utilities for Web Push notifications using standard browser APIs.
 */

// Default VAPID public key (should be overridden by VITE_WEB_PUSH_PUBLIC_KEY)
const DEFAULT_VAPID_PUBLIC_KEY = 'BEtV1AcnWgeAjXLfOP-5yxBB40pxq8RCNXzbJzi1zSisAWmbiZbWsY__BRFaRngpcxgF9e7raeiuanaf_br4OBk';

/**
 * Converts a base64 string to a Uint8Array.
 * Required for subscribing to push notifications with a VAPID key.
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Checks if the browser supports Push Notifications.
 */
export function isPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

/**
 * Gets the current push subscription if it exists.
 */
export async function getPushSubscription(): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null;
  const registration = await navigator.serviceWorker.ready;
  return registration.pushManager.getSubscription();
}

/**
 * Subscribes the user to push notifications.
 */
export async function subscribeToPush(): Promise<PushSubscription | null> {
  if (!isPushSupported()) {
    console.warn('[Push] Browser does not support push notifications.');
    return null;
  }

  // 5 second timeout is enough for a good UX
  const TIMEOUT_MS = 5000;
  
  return new Promise(async (resolve) => {
    const timeoutId = setTimeout(() => {
      console.error('[Push] Subscription timed out after 5s');
      resolve(null);
    }, TIMEOUT_MS);

    try {
      console.info('[Push] Getting service worker registration...');
      // Try to get existing registration first
      let registration = await navigator.serviceWorker.getRegistration();
      
      if (!registration) {
        console.info('[Push] No active registration, waiting for ready...');
        registration = await navigator.serviceWorker.ready;
      }

      if (!registration) {
        console.error('[Push] Failed to get SW registration');
        clearTimeout(timeoutId);
        return resolve(null);
      }

      const publicKey = import.meta.env.VITE_WEB_PUSH_PUBLIC_KEY || DEFAULT_VAPID_PUBLIC_KEY;
      const applicationServerKey = urlBase64ToUint8Array(publicKey);

      console.info('[Push] Checking for existing subscription...');
      const existing = await registration.pushManager.getSubscription();
      if (existing) {
        console.info('[Push] Unsubscribing existing to refresh...');
        await existing.unsubscribe();
      }

      console.info('[Push] Calling subscribe()...');
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey as BufferSource,
      });

      console.info('[Push] Successfully subscribed!');
      clearTimeout(timeoutId);
      resolve(subscription);
    } catch (error) {
      console.error('[Push] Subscription process error:', error);
      clearTimeout(timeoutId);
      resolve(null);
    }
  });
}

/**
 * Unsubscribes the user from push notifications.
 */
export async function unsubscribeFromPush(): Promise<boolean> {
  if (!isPushSupported()) return false;

  const subscription = await getPushSubscription();
  if (subscription) {
    return subscription.unsubscribe();
  }
  return true;
}
