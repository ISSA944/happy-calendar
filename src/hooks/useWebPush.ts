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
      const currentPermission = Notification.permission;
      
      if (currentPermission === 'denied') {
        setError('Уведомления заблокированы в настройках браузера. Пожалуйста, разрешите их в настройках сайта.');
        setIsLoading(false);
        return false;
      }

      if (currentPermission === 'default') {
        const result = await Notification.requestPermission();
        setPermission(result);
        if (result !== 'granted') {
          setError('Доступ к уведомлениям отклонен пользователем.');
          setIsLoading(false);
          return false;
        }
      }

      const result = await subscribeToPush();
      if (result.success && result.subscription) {
        await syncSubscription(result.subscription);
        return true;
      } else {
        const msg = result.errorType === 'timeout' 
          ? 'Превышено время ожидания. Попробуйте еще раз или обновите страницу.'
          : `Ошибка подключения: ${result.error || 'неизвестная ошибка'}`;
        setError(msg);
      }
      return false;
    } catch (error: any) {
      console.error('[Push] Subscription fatal:', error);
      setError(error?.message || 'Что-то пошло не так');
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
    error,
    subscribe,
    unsubscribe,
    isSupported: isPushSupported(),
  };
}
