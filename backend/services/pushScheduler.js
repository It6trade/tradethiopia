const cron = require("node-cron");
const SalesCustomer = require("../sales/models/SalesCustomer");
const PushSubscription = require("../models/PushSubscription");
const { sendPushToUser } = require("../controllers/pushController");

/**
 * Build a "today date" string in YYYY-MM-DD
 */
const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

/**
 * Get Mon and Sun of the current week
 */
const weekRange = () => {
  const now = new Date();
  const day = now.getDay();
  const diffToMon = day === 0 ? -6 : 1 - day;
  const mon = new Date(now);
  mon.setDate(now.getDate() + diffToMon);
  mon.setHours(0, 0, 0, 0);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  sun.setHours(23, 59, 59, 999);
  return [mon, sun];
};

/**
 * Send daily "Today's Schedule" notification to all agents who have
 * customers pinned for today.  Runs every day at 08:00 AM server time.
 */
const scheduleDailyReminders = () => {
  // Run at 08:00 every day
  cron.schedule("0 8 * * *", async () => {
    console.log("[PushCron] Running daily followup reminder...");
    try {
      const today = todayStr();

      // Find all SalesCustomer records where scheduledDate == today and not Completed
      const dueTodayRaw = await SalesCustomer.find({
        scheduledDate: {
          $gte: new Date(today + "T00:00:00.000Z"),
          $lte: new Date(today + "T23:59:59.999Z"),
        },
        followupStatus: { $ne: "Completed" },
        agentId: { $exists: true, $ne: null },
      }).select("customerName agentId leadSource");

      if (!dueTodayRaw.length) {
        console.log("[PushCron] No follow-ups due today.");
        return;
      }

      // Group by agentId
      const byAgent = {};
      dueTodayRaw.forEach((c) => {
        if (!byAgent[c.agentId]) byAgent[c.agentId] = [];
        byAgent[c.agentId].push(c);
      });

      for (const [agentId, customers] of Object.entries(byAgent)) {
        const names = customers
          .slice(0, 3)
          .map((c) => c.customerName)
          .join(", ");
        const extra = customers.length > 3 ? ` +${customers.length - 3} more` : "";

        const payload = JSON.stringify({
          type: "followup_reminder",
          title: `?? Today's Follow-ups (${customers.length})`,
          body: `Scheduled today: ${names}${extra}`,
          icon: "/logo.png",
          badge: "/logo.png",
          tag: "daily-followup",
          data: { url: "/sales/agent/followup" },
        });

        // Find user doc by agentId string (userId stored as string in agentId field)
        let userId;
        try {
          const mongoose = require("mongoose");
          userId = mongoose.Types.ObjectId.isValid(agentId)
            ? mongoose.Types.ObjectId.createFromHexString(agentId)
            : null;
        } catch {
          userId = null;
        }
        if (!userId) continue;

        await sendPushToUser(userId, payload);
        console.log(`[PushCron] Sent daily reminder to agent ${agentId} (${customers.length} follow-ups)`);
      }
    } catch (err) {
      console.error("[PushCron] Daily reminder error:", err.message);
    }
  });

  // Overdue reminder – runs every day at 09:00 AM
  cron.schedule("0 9 * * *", async () => {
    console.log("[PushCron] Running overdue followup scan...");
    try {
      const today = todayStr();

      const overdueRaw = await SalesCustomer.find({
        scheduledDate: { $lt: new Date(today + "T00:00:00.000Z") },
        followupStatus: { $ne: "Completed" },
        agentId: { $exists: true, $ne: null },
      }).select("customerName agentId");

      if (!overdueRaw.length) return;

      const byAgent = {};
      overdueRaw.forEach((c) => {
        if (!byAgent[c.agentId]) byAgent[c.agentId] = [];
        byAgent[c.agentId].push(c);
      });

      for (const [agentId, customers] of Object.entries(byAgent)) {
        const payload = JSON.stringify({
          type: "overdue_reminder",
          title: `?? Overdue Follow-ups (${customers.length})`,
          body: `You have ${customers.length} prospect(s) past their scheduled date and still open.`,
          icon: "/logo.png",
          badge: "/logo.png",
          tag: "overdue-followup",
          data: { url: "/sales/agent/followup" },
        });

        let userId;
        try {
          const mongoose = require("mongoose");
          userId = mongoose.Types.ObjectId.isValid(agentId)
            ? mongoose.Types.ObjectId.createFromHexString(agentId)
            : null;
        } catch {
          userId = null;
        }
        if (!userId) continue;

        await sendPushToUser(userId, payload);
        console.log(`[PushCron] Sent overdue reminder to agent ${agentId} (${customers.length} overdue)`);
      }
    } catch (err) {
      console.error("[PushCron] Overdue reminder error:", err.message);
    }
  });

  console.log("[PushCron] Scheduled daily reminders at 08:00 and overdue scan at 09:00");
};

module.exports = { scheduleDailyReminders };
