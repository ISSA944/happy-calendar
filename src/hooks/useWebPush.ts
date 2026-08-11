import { useCallback, useEffect, useState } from 'react';
import { apiClient } from '../api';
import { getAccessToken } from '../auth/token-storage';
import { getPushSubscription, isPushSupported, subscribeToPush, unsubscribeFromPush } from '../lib/push';

type PushSubscriptionSyncResponse = {
  subscribed: boolean;
  reason?: string;
};

export function useWebPush() {
  const [permission, setPermission] = useState<NotificationPermission>(() => {
    if (typeof Notification === 'undefined') return 'default';
    return Notification.permission;
  });
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const syncSubscription = useCallback(async (subscription: PushSubscription) => {
    const accessToken = getAccessToken();
    if (!accessToken) return false;

    try {
      const { data } = await apiClient.post<PushSubscriptionSyncResponse>('push/subscribe', {
        subscription: subscription.toJSON(),
        user_agent: navigator.userAgent,
      });
      if (data.subscribed !== true) {
        setIsSubscribed(false);
        setError('Не удалось сохранить push-подписку. Попробуйте ещё раз.');
        console.error('[Push] Backend rejected subscription:', data.reason || 'unknown-reason');
        return false;
      }
      setIsSubscribed(true);
      console.info('[Push] Subscription synced with backend.');
      return true;
    } catch (error) {
      setIsSubscribed(false);
      setError('Не удалось сохранить push-подписку. Попробуйте ещё раз.');
      console.error('[Push] Failed to sync subscription with backend:', error);
      return false;
    }
  }, []);

  // Check initial subscription status & Auto-sync
  useEffect(() => {
    let cancelled = false;
    const checkInitialSubscription = async () => {
      try {
        const subscription = await getPushSubscription();
        if (cancelled) return;

        if (subscription) {
          // Auto-sync existing subscription with backend just in case
          await syncSubscription(subscription);
        } else {
          setIsSubscribed(false);
        }
      } catch (error) {
        if (!cancelled) {
          setIsSubscribed(false);
          setError('Не удалось проверить состояние push-подписки. Попробуйте ещё раз.');
          console.error('[Push] Failed to check initial subscription:', error);
        }
      } finally {
        if (!cancelled) {
          setIsChecking(false);
        }
      }
    };

    void checkInitialSubscription();
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

      const { data } = await apiClient.get<{ publicKey: string }>('push/public-key');
      const result = await subscribeToPush(data.publicKey);
      if (result.success && result.subscription) return syncSubscription(result.subscription);
      
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
    isChecking,
    isLoading,
    error,
    subscribe,
    unsubscribe,
    isSupported: isPushSupported(),
  };
}
