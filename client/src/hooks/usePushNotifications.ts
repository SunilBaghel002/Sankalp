// src/hooks/usePushNotifications.ts
import { useState, useEffect, useCallback } from "react";

interface PushSubscriptionState {
  isSupported: boolean;
  isSubscribed: boolean;
  isLoading: boolean;
  permission: NotificationPermission;
  error: string | null;
}

interface NotificationPreferences {
  push_enabled: boolean;
  morning_motivation: boolean;
  habit_reminders: boolean;
  streak_alerts: boolean;
  evening_reminder: boolean;
  achievement_alerts: boolean;
  sleep_reminders: boolean;
}

const defaultPreferences: NotificationPreferences = {
  push_enabled: true,
  morning_motivation: true,
  habit_reminders: true,
  streak_alerts: true,
  evening_reminder: true,
  achievement_alerts: true,
  sleep_reminders: true,
};

export function usePushNotifications() {
  const [state, setState] = useState<PushSubscriptionState>({
    isSupported: false,
    isSubscribed: false,
    isLoading: true,
    permission: "default",
    error: null,
  });

  const [preferences, setPreferences] =
    useState<NotificationPreferences>(defaultPreferences);
  const [vapidKey, setVapidKey] = useState<string | null>(null);

  // Check support and current status
  useEffect(() => {
    checkSupport();
  }, []);

  const checkSupport = async () => {
    try {
      const isSupported =
        "serviceWorker" in navigator &&
        "PushManager" in window &&
        "Notification" in window;

      if (!isSupported) {
        setState((prev) => ({
          ...prev,
          isSupported: false,
          isLoading: false,
          error: "Push notifications are not supported in this browser",
        }));
        return;
      }

      // Get VAPID public key
      const keyResponse = await fetch(
        "http://localhost:8000/push/vapid-public-key",
        {
          credentials: "include",
        }
      );

      if (keyResponse.ok) {
        const { publicKey } = await keyResponse.json();
        setVapidKey(publicKey);
      }

      // Check current permission
      const permission = Notification.permission;

      // Check if already subscribed
      const statusResponse = await fetch("http://localhost:8000/push/status", {
        credentials: "include",
      });

      if (statusResponse.ok) {
        const data = await statusResponse.json();
        setState((prev) => ({
          ...prev,
          isSupported: true,
          isSubscribed: data.subscribed,
          permission,
          isLoading: false,
        }));
        setPreferences({ ...defaultPreferences, ...data.preferences });
      } else {
        setState((prev) => ({
          ...prev,
          isSupported: true,
          permission,
          isLoading: false,
        }));
      }
    } catch (error) {
      console.error("Error checking push support:", error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: "Failed to check notification status",
      }));
    }
  };

  const registerServiceWorker =
    async (): Promise<ServiceWorkerRegistration> => {
      if (!("serviceWorker" in navigator)) {
        throw new Error("Service workers not supported");
      }

      // Register service worker
      const registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
      });

      // Wait for the service worker to be ready
      await navigator.serviceWorker.ready;

      return registration;
    };

  const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
  };

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!vapidKey) {
      setState((prev) => ({ ...prev, error: "VAPID key not available" }));
      return false;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // Request permission
      const permission = await Notification.requestPermission();

      if (permission !== "granted") {
        setState((prev) => ({
          ...prev,
          permission,
          isLoading: false,
          error:
            permission === "denied"
              ? "Notification permission denied. Please enable in browser settings."
              : "Notification permission not granted",
        }));
        return false;
      }

      // Register service worker
      const registration = await registerServiceWorker();

      // Subscribe to push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });

      // Send subscription to server
      const response = await fetch("http://localhost:8000/push/subscribe", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription.toJSON()),
      });

      if (!response.ok) {
        throw new Error("Failed to save subscription on server");
      }

      setState((prev) => ({
        ...prev,
        isSubscribed: true,
        permission: "granted",
        isLoading: false,
      }));

      return true;
    } catch (error: any) {
      console.error("Error subscribing to push:", error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error.message || "Failed to enable notifications",
      }));
      return false;
    }
  }, [vapidKey]);

  const unsubscribe = useCallback(async (): Promise<boolean> => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        // Unsubscribe from push manager
        await subscription.unsubscribe();

        // Remove from server
        await fetch("http://localhost:8000/push/unsubscribe", {
          method: "DELETE",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(subscription.toJSON()),
        });
      }

      setState((prev) => ({
        ...prev,
        isSubscribed: false,
        isLoading: false,
      }));

      return true;
    } catch (error: any) {
      console.error("Error unsubscribing:", error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error.message || "Failed to disable notifications",
      }));
      return false;
    }
  }, []);

  const sendTestNotification = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch("http://localhost:8000/push/test", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "🔔 Test Notification",
          body: "Push notifications are working! 🎉",
        }),
      });

      return response.ok;
    } catch (error) {
      console.error("Error sending test notification:", error);
      return false;
    }
  }, []);

  const updatePreferences = useCallback(
    async (
      newPreferences: Partial<NotificationPreferences>
    ): Promise<boolean> => {
      try {
        const updated = { ...preferences, ...newPreferences };

        const response = await fetch("http://localhost:8000/push/preferences", {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updated),
        });

        if (response.ok) {
          setPreferences(updated);
          return true;
        }
        return false;
      } catch (error) {
        console.error("Error updating preferences:", error);
        return false;
      }
    },
    [preferences]
  );

  return {
    ...state,
    preferences,
    subscribe,
    unsubscribe,
    sendTestNotification,
    updatePreferences,
    refreshStatus: checkSupport,
  };
}
