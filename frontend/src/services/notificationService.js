/**
 * notificationService.js
 * Manages Web Push subscription lifecycle and provides base notification API operations.
 */

import axiosInstance from "./axiosInstance";

// --- Original Notification APIs ---
export const getNotifications = async () => {
  const response = await axiosInstance.get('/notifications');
  return response.data;
};

export const markNotificationAsRead = async (id) => {
  const response = await axiosInstance.put(`/notifications/${id}`);
  return response.data;
};

export const getTaskNotifications = async () => {
  const response = await axiosInstance.get('/notifications');
  return response.data.filter(notification => notification.type === 'task');
};

export const markAllNotificationsAsRead = async () => {
  const response = await axiosInstance.put('/notifications/mark-all-read');
  return response.data;
};

const SW_PATH = "/sw.js";
const API_BASE = "/api/push";

// ─── Helper: convert VAPID public key ──────────────────────────
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64  = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData  = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

// ─── Register Service Worker ────────────────────────────────────
export async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    console.warn("[Push] Service Workers not supported in this browser.");
    return null;
  }
  try {
    const registration = await navigator.serviceWorker.register(SW_PATH, { scope: "/" });
    console.log("[Push] Service Worker registered:", registration.scope);
    return registration;
  } catch (err) {
    console.error("[Push] SW registration failed:", err);
    return null;
  }
}

// ─── Request Permission + Subscribe ────────────────────────────
export async function requestAndSubscribe() {
  if (!("PushManager" in window)) {
    console.warn("[Push] Push API not supported.");
    return false;
  }

  // Ask permission
  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    console.info("[Push] Notification permission denied.");
    return false;
  }

  try {
    // Get VAPID public key from backend
    const { data } = await axiosInstance.get(`${API_BASE}/vapid-public-key`);
    const applicationServerKey = urlBase64ToUint8Array(data.publicKey);

    // Get current SW registration
    const reg = await navigator.serviceWorker.ready;

    // Subscribe
    const subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey,
    });

    // Save to backend
    await axiosInstance.post(`${API_BASE}/subscribe`, {
      subscription: subscription.toJSON(),
      userAgent: navigator.userAgent,
    });

    console.log("[Push] Successfully subscribed to push notifications.");
    localStorage.setItem("pushSubscribed", "true");
    return true;
  } catch (err) {
    console.error("[Push] Subscribe error:", err);
    return false;
  }
}

// ─── Unsubscribe ────────────────────────────────────────────────
export async function unsubscribe() {
  try {
    const reg = await navigator.serviceWorker.ready;
    const subscription = await reg.pushManager.getSubscription();
    if (!subscription) return;

    await axiosInstance.delete(`${API_BASE}/unsubscribe`, {
      data: { endpoint: subscription.endpoint },
    });
    await subscription.unsubscribe();
    localStorage.removeItem("pushSubscribed");
    console.log("[Push] Unsubscribed.");
  } catch (err) {
    console.error("[Push] Unsubscribe error:", err);
  }
}

// ─── Show a LOCAL instant notification (no server needed) ────────
export function showLocalNotification(title, body, options = {}) {
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  // Via SW for best compatibility (shows even if tab is not focused)
  navigator.serviceWorker.ready.then((reg) => {
    reg.showNotification(title, {
      body,
      icon: "/logo.png",
      badge: "/logo.png",
      tag: options.tag || "local",
      data: { url: options.url || window.location.href },
      requireInteraction: false,
      silent: false,
      vibrate: [100, 50, 100],
      ...options,
    });
  });
}

// ─── Check if already subscribed ───────────────────────────────
export async function isSubscribed() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return false;
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    return !!sub;
  } catch {
    return false;
  }
}

// ─── Init (call once at app boot) ──────────────────────────────
export async function initPushNotifications() {
  await registerServiceWorker();
  const alreadySubscribed = await isSubscribed();
  if (!alreadySubscribed && Notification.permission === "granted") {
    await requestAndSubscribe();
  }
}

