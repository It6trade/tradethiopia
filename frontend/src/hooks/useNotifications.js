/**
 * useNotifications.js
 * React hook that:
 *  - Initialises push subscription on first use
 *  - Watches scheduled customers and triggers OS notifications
 *  - Provides a {subscribe, unsubscribe, isEnabled, notify} API to components
 */

import { useState, useEffect, useCallback, useRef } from "react";
import {
  initPushNotifications,
  requestAndSubscribe,
  unsubscribe as pushUnsubscribe,
  showLocalNotification,
  isSubscribed,
} from "../services/notificationService";

const CHECK_INTERVAL_MS = 60 * 1000; // Check every 60 s
const NOTIFIED_KEY = "push_notified_ids"; // localStorage key for dedup

function getNotifiedSet() {
  try { return new Set(JSON.parse(localStorage.getItem(NOTIFIED_KEY) || "[]")); }
  catch { return new Set(); }
}
function addNotified(id) {
  const s = getNotifiedSet(); s.add(id);
  localStorage.setItem(NOTIFIED_KEY, JSON.stringify([...s].slice(-200)));
}

export function useNotifications(customers = [], tasks = []) {
  const [enabled, setEnabled]       = useState(false);
  const [permission, setPermission]  = useState(Notification.permission || "default");
  const [isLoading, setIsLoading]    = useState(false);
  const intervalRef = useRef(null);

  // Init on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      await initPushNotifications();
      if (!mounted) return;
      const sub = await isSubscribed();
      setEnabled(sub);
      setPermission(Notification.permission || "default");
    })();
    return () => { mounted = false; };
  }, []);

  // Today date string
  const todayStr = useCallback(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  }, []);

  // Scan customers & tasks and fire local notifications if needed
  const checkAndNotify = useCallback(() => {
    if (Notification.permission !== "granted") return;

    const today = todayStr();
    const notified = getNotifiedSet();

    // 1. Customer Follow-up Reminders
    if (Array.isArray(customers) && customers.length > 0) {
      const dueToday = customers.filter((c) => {
        if (!c.scheduledDate) return false;
        if ((c.followupStatus || "").toLowerCase() === "completed") return false;
        return c.scheduledDate.slice(0, 10) === today;
      });

      const overdue = customers.filter((c) => {
        if (!c.scheduledDate) return false;
        if ((c.followupStatus || "").toLowerCase() === "completed") return false;
        return c.scheduledDate.slice(0, 10) < today;
      });

      // Fire one bundled notification for "due today" batch
      if (dueToday.length > 0) {
        const batchKey = `today_${today}`;
        if (!notified.has(batchKey)) {
          const names = dueToday.slice(0, 3).map((c) => c.customerName).join(", ");
          const extra = dueToday.length > 3 ? ` +${dueToday.length - 3} more` : "";
          showLocalNotification(
            `📞 Today's Follow-ups (${dueToday.length})`,
            `Scheduled today: ${names}${extra}`,
            { tag: "today-followup", url: "/sales/agent/followup" }
          );
          addNotified(batchKey);
        }
      }

      // Fire one bundled notification for overdue
      if (overdue.length > 0) {
        const overdueKey = `overdue_${today}`;
        if (!notified.has(overdueKey)) {
          showLocalNotification(
            `⚠️ Overdue Follow-ups (${overdue.length})`,
            `${overdue.length} prospect(s) past their scheduled date.`,
            { tag: "overdue-followup", url: "/sales/agent/followup" }
          );
          addNotified(overdueKey);
        }
      }
    }

    // 2. Task Reminders
    if (Array.isArray(tasks) && tasks.length > 0) {
      const tasksDueToday = tasks.filter((t) => {
        if (!t.dueDate) return false;
        if (t.status === "Completed") return false;
        return t.dueDate.slice(0, 10) === today;
      });

      const tasksOverdue = tasks.filter((t) => {
        if (!t.dueDate) return false;
        if (t.status === "Completed") return false;
        return t.dueDate.slice(0, 10) < today;
      });

      // Fire notification for tasks due today
      if (tasksDueToday.length > 0) {
        const tBatchKey = `tasks_today_${today}`;
        if (!notified.has(tBatchKey)) {
          const titles = tasksDueToday.slice(0, 2).map((t) => t.title).join(", ");
          const extra = tasksDueToday.length > 2 ? ` +${tasksDueToday.length - 2} more` : "";
          showLocalNotification(
            `📋 Tasks Due Today (${tasksDueToday.length})`,
            `Due today: ${titles}${extra}`,
            { tag: "tasks-today", url: "/sales/agent/tasks" }
          );
          addNotified(tBatchKey);
        }
      }

      // Fire notification for overdue tasks
      if (tasksOverdue.length > 0) {
        const tOverdueKey = `tasks_overdue_${today}`;
        if (!notified.has(tOverdueKey)) {
          showLocalNotification(
            `⚠️ Overdue Tasks (${tasksOverdue.length})`,
            `You have ${tasksOverdue.length} unfinished tasks past their due date.`,
            { tag: "tasks-overdue", url: "/sales/agent/tasks" }
          );
          addNotified(tOverdueKey);
        }
      }
    }
  }, [customers, tasks, todayStr]);

  // Run check on change and on interval
  useEffect(() => {
    checkAndNotify();
    intervalRef.current = setInterval(checkAndNotify, CHECK_INTERVAL_MS);
    return () => clearInterval(intervalRef.current);
  }, [checkAndNotify]);

  // Subscribe handler
  const subscribe = useCallback(async () => {
    setIsLoading(true);
    try {
      const ok = await requestAndSubscribe();
      setEnabled(ok);
      setPermission(Notification.permission || "default");
      return ok;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Unsubscribe handler
  const unsubscribe = useCallback(async () => {
    setIsLoading(true);
    try {
      await pushUnsubscribe();
      setEnabled(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Ad-hoc notify helper (for use inside components)
  const notify = useCallback((title, body, options = {}) => {
    showLocalNotification(title, body, options);
  }, []);

  return { enabled, permission, isLoading, subscribe, unsubscribe, notify };
}
