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
  const [error, setError] = useState<string | null>(null);

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

  // Check initial subscription status & Auto-sync
  useEffect(() => {
    let cancelled = false;
    void getPushSubscription().then((sub) => {
      if (cancelled) return;
      if (sub) {
        setIsSubscribed(true);
        // Auto-sync existing subscription with backend just in case
        void syncSubscription(sub);
      } else {
        setIsSubscribed(false);
      }
    });
    return () => { cancelled = true; };
  }, [syncSubscription]);

  const subscribe = useCallback(async () => {
    if (!isPushSupported()) return false;

    setIsLoading(true);
    setError(null);
    try {
      if (Notification.permission === 'default') {
        const result = await Notification.requestPermission();
        setPermission(result);
      }

      const result = await subscribeToPush();
      if (result.success && result.subscription) {
        await syncSubscription(result.subscription);
        return true;
      }
      
      if (Notification.permission === 'denied') {
        setError('Уведомления заблокированы в настройках.');
      } else {
        setError(result.error || 'Ошибка подключения.');
      }
      return false;
    } catch (error: unknown) {
      console.error('[Push] Subscription fatal:', error);
      setError('Ошибка подключения.');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [syncSubscription]);

  const unsubscribe = useCallback(async () => {
    setIsLoading(true);
    try {
      const existing = await getPushSubscription();
      const endpoint = existing?.endpoint;
      const success = await unsubscribeFromPush();
      if (success) {
        setIsSubscribed(false);
        if (endpoint && getAccessToken()) {
          await apiClient.delete('push/unsubscribe', { data: { endpoint } }).catch(() => {
            // Non-fatal — backend cleans up on next 410 Gone anyway
          });
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    permission,
    isSubscribed,
    isLoading,
    error,
    subscribe,
    unsubscribe,
    isSupported: isPushSupported(),
  };
}
