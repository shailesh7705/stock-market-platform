// server/utils/alertEngine.js
const os = require("os");
const cron = require("node-cron");
const mongoose = require("mongoose");
const YahooFinance = require("yahoo-finance2").default;
const yahooFinance = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

const Alert = require("../models/Alert");
const Notification = require("../models/Notification");
const User = require("../models/User");
const Job = require("../models/Job");
const sendEmail = require("./sendEmail");
const { publishToUser } = require("./alertBus");
const { isMarketOpen } = require("./marketHours");
const { QUOTE_CHUNK, isConditionMet, chunk, deliverAlertEmail } = require("./alertRules");
const { tryAcquire, renewLease, releaseLease } = require("./jobLease");

const YF_OPTS = { validateResult: false };
const LEASE_KEY = "alert-check";
const LEASE_MS = 3 * 60 * 1000;
const OWNER = `${os.hostname()}:${process.pid}`;

let isProcessing = false;
let scheduled = false;

const engineHealth = {
  lastRunAt: null,
  durationMs: 0,
  triggeredCount: 0,
  status: "idle",
  lastError: null,
};

function getAlertEngineHealth() {
  return { ...engineHealth };
}

async function fetchQuoteMap(symbols) {
  const prices = new Map();
  for (const group of chunk(symbols, QUOTE_CHUNK)) {
    try {
      const raw = await Promise.race([
        yahooFinance.quote(group, {}, YF_OPTS),
        new Promise((_, reject) => { const t = setTimeout(() => reject(new Error("Quote timeout")), 8000); if (t.unref) t.unref(); }),
      ]);
      const list = Array.isArray(raw) ? raw : raw ? [raw] : [];
      for (const quote of list) {
        const symbol = String(quote?.symbol || "").toUpperCase();
        const price = Number(quote?.regularMarketPrice);
        if (symbol && Number.isFinite(price) && price > 0) prices.set(symbol, price);
      }
    } catch (error) {
      console.warn(`[AlertEngine] Quote batch failed (${group.length} symbols): ${error.message}`);
    }
  }
  return prices;
}

async function holdLease() {
  return renewLease(Job, { key: LEASE_KEY, owner: OWNER, ttlMs: LEASE_MS });
}

async function sendAlertEmail(alert, currentPrice, email) {
  if (!email) {
    console.warn(`[AlertEngine] No email on file for alert ${alert._id}; delivery skipped.`);
    await Alert.updateOne(
      { _id: alert._id, emailStatus: "pending" },
      { $set: { emailStatus: "skipped" } }
    );
    return;
  }

  const delivery = await deliverAlertEmail(sendEmail, {
    to: email,
    symbol: alert.symbol,
    targetPrice: alert.targetPrice,
    currentPrice,
    condition: alert.condition,
  });

  await Alert.updateOne(
    { _id: alert._id, emailStatus: "pending" },
    { $set: { emailStatus: delivery.emailStatus } }
  );

  if (delivery.emailStatus !== "sent") {
    console.warn(`[AlertEngine] Email ${delivery.emailStatus} for alert ${alert._id}.`);
  }
}

async function retryPendingEmails() {
  const pending = await Alert.find({ triggered: true, emailStatus: "pending" }).limit(20);
  if (!pending.length) return;

  const users = await User.find({ _id: { $in: pending.map((alert) => alert.user) } }).select("email");
  const emails = new Map(users.map((user) => [String(user._id), user.email]));

  for (const alert of pending) {
    if (!(await holdLease())) return;
    await sendAlertEmail(alert, alert.triggeredPrice, emails.get(String(alert.user)));
  }
}

async function evaluateAlerts() {
  const alerts = await Alert.find({ triggered: false, active: { $ne: false } });
  if (!alerts.length) return;

  const symbolMap = new Map();
  for (const alert of alerts) {
    const symbol = String(alert.symbol || "").trim().toUpperCase();
    if (!symbol || (alert.condition !== "above" && alert.condition !== "below")) continue;
    if (!symbolMap.has(symbol)) symbolMap.set(symbol, []);
    symbolMap.get(symbol).push(alert);
  }
  if (!symbolMap.size) return;

  console.log(`[AlertEngine] Checking ${alerts.length} active alerts across ${symbolMap.size} symbols.`);
  const prices = await fetchQuoteMap([...symbolMap.keys()]);
  const hits = [];

  for (const [symbol, group] of symbolMap) {
    const currentPrice = prices.get(symbol);
    if (!Number.isFinite(currentPrice)) continue;

    for (const alert of group) {
      if (!isConditionMet(alert.condition, alert.targetPrice, currentPrice)) continue;

      const claimed = await Alert.findOneAndUpdate(
        { _id: alert._id, triggered: false },
        {
          $set: {
            triggered: true,
            triggeredPrice: currentPrice,
            triggeredAt: new Date(),
            emailStatus: "pending",
          },
        },
        { new: true }
      );
      if (!claimed) continue;

      const note = await Notification.create({
        user: claimed.user,
        kind: "alert",
        symbol: claimed.symbol,
        alert: claimed._id,
        targetPrice: claimed.targetPrice,
        triggeredPrice: claimed.triggeredPrice,
        condition: claimed.condition,
        message: `${claimed.symbol} reached target price of ₹${claimed.targetPrice} (Current: ₹${Number(claimed.triggeredPrice).toFixed(2)})`,
      });
      publishToUser(String(claimed.user), { type: "alert", notification: note });
      hits.push(claimed);
    }
  }

  if (!hits.length) return;
  console.log(`[AlertEngine] Triggered ${hits.length} alert(s).`);
  engineHealth.triggeredCount += hits.length;

  const users = await User.find({ _id: { $in: hits.map((alert) => alert.user) } }).select("email");
  const emails = new Map(users.map((user) => [String(user._id), user.email]));

  for (const alert of hits) {
    if (!(await holdLease())) return;
    await sendAlertEmail(alert, alert.triggeredPrice, emails.get(String(alert.user)));
  }
}

const checkAlerts = async () => {
  if (isProcessing) {
    console.log("[AlertEngine] Previous check still running, skipping tick.");
    return;
  }

  const startTime = Date.now();
  isProcessing = true;
  engineHealth.status = "running";
  engineHealth.lastRunAt = new Date();

  let leased = false;
  try {
    const sessionOpen = isMarketOpen();
    if (!sessionOpen) {
      const pending = await Alert.exists({ triggered: true, emailStatus: "pending" });
      if (!pending) {
        engineHealth.status = "idle";
        engineHealth.durationMs = Date.now() - startTime;
        return;
      }
    }

    leased = await tryAcquire(Job, { key: LEASE_KEY, owner: OWNER, ttlMs: LEASE_MS });
    if (!leased) {
      console.log("[AlertEngine] Another instance holds the lease, skipping tick.");
      engineHealth.status = "idle";
      engineHealth.durationMs = Date.now() - startTime;
      return;
    }

    await retryPendingEmails();
    if (sessionOpen) await evaluateAlerts();

    engineHealth.status = "idle";
    engineHealth.lastError = null;
  } catch (error) {
    engineHealth.status = "error";
    engineHealth.lastError = error.message;
    console.error("[AlertEngine] Error in loop:", error.message);
  } finally {
    engineHealth.durationMs = Date.now() - startTime;
    if (leased) {
      try {
        await releaseLease(Job, { key: LEASE_KEY, owner: OWNER });
      } catch (error) {
        console.error("[AlertEngine] Failed to release lease:", error.message);
      }
    }
    isProcessing = false;
  }
};

const startAlertEngine = () => {
  const schedule = () => {
    if (scheduled) return;
    scheduled = true;
    cron.schedule("* * * * *", () => {
      checkAlerts().catch((error) => console.error("[AlertEngine] Tick failed:", error.message));
    });
    console.log("[AlertEngine] Engine scheduled — evaluating during the NSE session.");
  };

  mongoose.connection.on("open", schedule);
  if (mongoose.connection.readyState === 1) schedule();
};

module.exports = startAlertEngine;
module.exports.checkAlerts = checkAlerts;
module.exports.getAlertEngineHealth = getAlertEngineHealth;
