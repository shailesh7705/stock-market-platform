// server/utils/alertEngine.js
const cron = require("node-cron");
const YahooFinance = require("yahoo-finance2").default;
const yahooFinance = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

const Alert = require("../models/Alert");
const Notification = require("../models/Notification");
const User = require("../models/User");
const sendEmail = require("./sendEmail");

const YF_OPTS = { validateResult: false };

// Safe quote helper with 8s timeout
async function safeQuote(symbol) {
  try {
    return await Promise.race([
      yahooFinance.quote(symbol, {}, YF_OPTS),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Timeout")), 8000)
      ),
    ]);
  } catch {
    return null;
  }
}

// Concurrency guard to prevent overlapping cron ticks
let isProcessing = false;

const checkAlerts = async () => {
  if (isProcessing) {
    console.log("[AlertEngine] Previous check still running, skipping tick.");
    return;
  }

  isProcessing = true;
  try {
    const alerts = await Alert.find({
      triggered: false,
      active: { $ne: false },
    });

    if (!alerts.length) {
      isProcessing = false;
      return;
    }

    console.log(`[AlertEngine] Checking ${alerts.length} active alerts...`);

    // Group alerts by symbol so we query each symbol only once
    const symbolMap = new Map();
    for (const alert of alerts) {
      const sym = alert.symbol.trim().toUpperCase();
      if (!symbolMap.has(sym)) {
        symbolMap.set(sym, []);
      }
      symbolMap.get(sym).push(alert);
    }

    const uniqueSymbols = Array.from(symbolMap.keys());

    // Fetch quotes in parallel
    const quotes = await Promise.all(uniqueSymbols.map((sym) => safeQuote(sym)));

    for (let i = 0; i < uniqueSymbols.length; i++) {
      const symbol = uniqueSymbols[i];
      const quote = quotes[i];
      const currentPrice = quote?.regularMarketPrice;

      if (!currentPrice || isNaN(currentPrice)) {
        continue;
      }

      const matchingAlerts = symbolMap.get(symbol) || [];

      for (const alert of matchingAlerts) {
        const target = alert.targetPrice;
        let isHit = false;

        const condition = alert.condition || (alert.initialPrice && target > alert.initialPrice ? "above" : "below");

        if (condition === "above") {
          isHit = currentPrice >= target;
        } else if (condition === "below") {
          isHit = currentPrice <= target;
        }

        if (isHit) {
          // Atomic update to ensure no duplicate triggers
          const triggeredAlert = await Alert.findOneAndUpdate(
            { _id: alert._id, triggered: false },
            {
              $set: {
                triggered: true,
                triggeredPrice: currentPrice,
                triggeredAt: new Date(),
              },
            },
            { new: true }
          );

          if (!triggeredAlert) {
            // Already triggered by concurrent execution
            continue;
          }

          console.log(`[AlertEngine] 🎯 TRIGGERED: ${symbol} hit ₹${target} (Current: ₹${currentPrice})`);

          // 1. Create In-App Notification
          await Notification.create({
            user: alert.user,
            message: `${symbol} reached target price of ₹${target} (Current: ₹${currentPrice.toFixed(2)})`,
          });

          // 2. Send Rich HTML Email
          const user = await User.findById(alert.user);
          if (user && user.email) {
            await sendEmail({
              to: user.email,
              symbol,
              targetPrice: target,
              currentPrice,
              condition,
            });
          }
        }
      }
    }
  } catch (error) {
    console.error("[AlertEngine] Error in loop:", error.message);
  } finally {
    isProcessing = false;
  }
};

const startAlertEngine = () => {
  // Run every minute: * * * * *
  cron.schedule("* * * * *", checkAlerts);
  console.log("[AlertEngine] Engine scheduled — running every minute.");
};

module.exports = startAlertEngine;
