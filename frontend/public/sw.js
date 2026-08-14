/* ============================================================
   TradeThiopia - Push Notification Service Worker
   Handles background push events & displays OS-level notifications
   ============================================================ */

const CACHE_NAME = "tradethiopia-v1";
const NOTIFICATION_ICON = "/logo.png";
const NOTIFICATION_BADGE = "/logo.png";

// ─── Push Event ───────────────────────────────────────────────
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "TradeThiopia", body: event.data ? event.data.text() : "" };
  }

  const title  = data.title  || "TradeThiopia Notification";
  const body   = data.body   || "";
  const icon   = data.icon   || NOTIFICATION_ICON;
  const badge  = data.badge  || NOTIFICATION_BADGE;
  const tag    = data.tag    || "tradethiopia";
  const url    = (data.data && data.data.url) || "/";

  const options = {
    body,
    icon,
    badge,
    tag,
    renotify: true,
    requireInteraction: false,
    silent: false,
    data: { url },
    actions: [
      { action: "open",    title: "Open App" },
      { action: "dismiss", title: "Dismiss" }
    ],
    vibrate: [200, 100, 200],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// ─── Notification Click ───────────────────────────────────────
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "dismiss") return;

  const url = (event.notification.data && event.notification.data.url) || "/";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        // If app is already open, focus it and navigate
        for (const client of windowClients) {
          if ("focus" in client) {
            client.focus();
            if ("navigate" in client) client.navigate(url);
            return;
          }
        }
        // Otherwise open a new window
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});

// ─── Background Sync (future-proof) ───────────────────────────
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-followups") {
    console.log("[SW] Background sync: sync-followups");
  }
});

self.addEventListener("install",  () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(clients.claim()));
