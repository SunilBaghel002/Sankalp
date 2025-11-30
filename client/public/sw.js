// public/sw.js
const CACHE_NAME = "sankalp-v1";
const OFFLINE_URL = "/offline.html";

// Assets to cache
const STATIC_ASSETS = [
  "/",
  "/offline.html",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
  "/icons/badge-72x72.png",
];

// Install event
self.addEventListener("install", (event) => {
  console.log("[SW] Installing service worker...");

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[SW] Caching static assets");
      return cache.addAll(STATIC_ASSETS);
    })
  );

  self.skipWaiting();
});

// Activate event
self.addEventListener("activate", (event) => {
  console.log("[SW] Activating service worker...");

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );

  self.clients.claim();
});

// Fetch event (for offline support)
self.addEventListener("fetch", (event) => {
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(OFFLINE_URL);
      })
    );
  }
});

// Push event - Handle incoming push notifications
self.addEventListener("push", (event) => {
  console.log("[SW] Push received:", event);

  let data = {
    title: "Sankalp",
    body: "You have a new notification",
    icon: "/icons/icon-192x192.png",
    badge: "/icons/badge-72x72.png",
    tag: "default",
    data: { url: "/daily" },
  };

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch (e) {
      console.error("[SW] Error parsing push data:", e);
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || "/icons/icon-192x192.png",
    badge: data.badge || "/icons/badge-72x72.png",
    tag: data.tag || "default",
    data: data.data || { url: "/daily" },
    actions: data.actions || [],
    requireInteraction: data.requireInteraction || false,
    silent: data.silent || false,
    vibrate: [200, 100, 200],
    timestamp: data.timestamp ? new Date(data.timestamp).getTime() : Date.now(),
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// Notification click event
self.addEventListener("notificationclick", (event) => {
  console.log("[SW] Notification clicked:", event);

  const notification = event.notification;
  const action = event.action;
  const data = notification.data || {};

  notification.close();

  // Handle different actions
  if (action === "complete") {
    // Mark habit as complete
    event.waitUntil(handleCompleteAction(data));
  } else if (action === "snooze") {
    // Snooze for 10 minutes
    event.waitUntil(handleSnoozeAction(data));
  } else if (action === "dismiss") {
    // Just close the notification
    return;
  } else {
    // Default: Open the app
    event.waitUntil(openApp(data.url || "/daily"));
  }
});

// Notification close event
self.addEventListener("notificationclose", (event) => {
  console.log("[SW] Notification closed:", event);
});

// Helper functions
async function openApp(url) {
  const urlToOpen = new URL(url, self.location.origin).href;

  const windowClients = await self.clients.matchAll({
    type: "window",
    includeUncontrolled: true,
  });

  // Check if app is already open
  for (const client of windowClients) {
    if (client.url === urlToOpen && "focus" in client) {
      return client.focus();
    }
  }

  // Open new window
  if (self.clients.openWindow) {
    return self.clients.openWindow(urlToOpen);
  }
}

async function handleCompleteAction(data) {
  // Try to mark habit as complete via API
  try {
    const response = await fetch("/api/quick-complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        habit_name: data.habit_name,
        date: new Date().toISOString().split("T")[0],
      }),
      credentials: "include",
    });

    if (response.ok) {
      // Show success notification
      self.registration.showNotification("✅ Habit Completed!", {
        body: `${data.habit_name} marked as done!`,
        icon: "/icons/icon-192x192.png",
        tag: "complete-success",
        silent: true,
      });
    }
  } catch (error) {
    console.error("[SW] Error completing habit:", error);
    // Open app instead
    await openApp("/daily");
  }
}

async function handleSnoozeAction(data) {
  // Schedule a new notification for 10 minutes later
  // Note: This requires background sync or a server-side solution

  // For now, just show a confirmation
  self.registration.showNotification("⏰ Reminder Snoozed", {
    body: `We'll remind you about ${
      data.habit_name || "your habit"
    } in 10 minutes`,
    icon: "/icons/icon-192x192.png",
    tag: "snooze-confirm",
    silent: true,
  });

  // TODO: Implement actual snooze via server-side scheduling
}

// Message handler for communication with the main app
self.addEventListener("message", (event) => {
  console.log("[SW] Message received:", event.data);

  if (event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
