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

  const registration = await navigator.serviceWorker.ready;

  // Use VAPID key from env or default
  const publicKey = import.meta.env.VITE_WEB_PUSH_PUBLIC_KEY || DEFAULT_VAPID_PUBLIC_KEY;
  const applicationServerKey = urlBase64ToUint8Array(publicKey);

  try {
    // Unsubscribe existing first to avoid VAPID key mismatch
    const existing = await registration.pushManager.getSubscription();
    if (existing) {
      await existing.unsubscribe();
    }

    return await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: applicationServerKey as BufferSource,
    });
  } catch (error) {
    console.error('[Push] Failed to subscribe to push notifications:', error);
    return null;
  }
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
