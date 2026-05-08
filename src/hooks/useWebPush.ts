import { useCallback, useEffect, useState } from 'react';
import { apiClient } from '../api';
import { getAccessToken } from '../auth/token-storage';
import { getPushSubscription, isPushSupported, subscribeToPush, unsubscribeFromPush } from '../lib/push';

export function useWebPush() {
  const [permission, setPermission] = useState<NotificationPermission>(() => {
    if (typeof Notification === 'undefined') return 'default';
    return Notification.permission;
  });
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Check initial subscription status
  useEffect(() => {
    let cancelled = false;
    void getPushSubscription().then((sub) => {
      if (cancelled) return;
      setIsSubscribed(!!sub);
    });
    return () => { cancelled = true; };
  }, []);

  const syncSubscription = useCallback(async (subscription: PushSubscription) => {
    const accessToken = getAccessToken();
    if (!accessToken) return;

    try {
      await apiClient.post('push/subscribe', {
        subscription: subscription.toJSON(),
        user_agent: navigator.userAgent,
      });
      setIsSubscribed(true);
      console.info('[Push] Subscription synced with backend.');
    } catch (error) {
      console.error('[Push] Failed to sync subscription with backend:', error);
    }
  }, []);

  const subscribe = useCallback(async () => {
    if (!isPushSupported()) return false;

    setIsLoading(true);
    try {
      let currentPermission = Notification.permission;
      if (currentPermission === 'default') {
        currentPermission = await Notification.requestPermission();
        setPermission(currentPermission);
      }

      if (currentPermission !== 'granted') {
        console.warn('[Push] Permission not granted.');
        setIsLoading(false);
        return false;
      }

      const subscription = await subscribeToPush();
      if (subscription) {
        await syncSubscription(subscription);
        return true;
      }
      return false;
    } catch (error) {
      console.error('[Push] Subscription failed:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [syncSubscription]);

  const unsubscribe = useCallback(async () => {
    setIsLoading(true);
    try {
      const success = await unsubscribeFromPush();
      if (success) {
        setIsSubscribed(false);
        // We don't necessarily need to tell the backend right away, 
        // as standard web-push is cleaned up on 410 Gone responses.
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    permission,
    isSubscribed,
    isLoading,
    subscribe,
    unsubscribe,
    isSupported: isPushSupported(),
  };
}
