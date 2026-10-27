// server/controllers/alertController.js
const Alert = require("../models/Alert");
const User = require("../models/User");
const Notification = require("../models/Notification");
const sendEmail = require("../utils/sendEmail");
const YahooFinance = require("yahoo-finance2").default;
const yahooFinance = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

const YF_OPTS = { validateResult: false };

/* Safe quote helper */
async function fetchCurrentPrice(symbol) {
  try {
    const quote = await Promise.race([
      yahooFinance.quote(symbol, {}, YF_OPTS),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Timeout")), 4000)
      ),
    ]);
    return quote?.regularMarketPrice || null;
  } catch {
    return null;
  }
}

/* ── Create Alert ───────────────────────────────────────────────────────────── */
const createAlert = async (req, res) => {
  try {
    let { symbol, targetPrice, condition, notes } = req.body;

    if (!symbol || targetPrice === undefined || targetPrice === null) {
      return res.status(400).json({ message: "Symbol and targetPrice are required" });
    }

    const numericTarget = parseFloat(targetPrice);
    if (isNaN(numericTarget) || numericTarget <= 0) {
      return res.status(400).json({ message: "Target price must be a positive number" });
    }

    // Format symbol properly
    symbol = symbol.trim().toUpperCase();
    if (!symbol.includes(".")) {
      symbol = `${symbol}.NS`;
    }

    // Fetch current market price
    const currentPrice = await fetchCurrentPrice(symbol);

    // Auto-detect condition if missing or invalid
    let finalCondition = condition;
    if (!finalCondition || (finalCondition !== "above" && finalCondition !== "below")) {
      if (currentPrice && numericTarget < currentPrice) {
        finalCondition = "below";
      } else {
        finalCondition = "above";
      }
    }

    const alert = await Alert.create({
      user: req.user._id,
      symbol,
      targetPrice: numericTarget,
      condition: finalCondition,
      initialPrice: currentPrice || null,
      notes: notes || "",
      active: true,
      triggered: false,
    });

    res.status(201).json(alert);
  } catch (error) {
    console.error("[Alert] Create error:", error.message);
    res.status(500).json({ message: error.message || "Failed to create alert" });
  }
};

/* ── Get User's Alerts ──────────────────────────────────────────────────────── */
const getAlerts = async (req, res) => {
  try {
    const alerts = await Alert.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json(alerts);
  } catch (error) {
    console.error("[Alert] Get error:", error.message);
    res.status(500).json({ message: "Failed to fetch alerts" });
  }
};

/* ── Delete Alert ───────────────────────────────────────────────────────────── */
const deleteAlert = async (req, res) => {
  try {
    const alert = await Alert.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!alert) {
      return res.status(404).json({ message: "Alert not found or unauthorized" });
    }

    await alert.deleteOne();
    res.status(200).json({ message: "Alert removed successfully" });
  } catch (error) {
    console.error("[Alert] Delete error:", error.message);
    res.status(500).json({ message: "Failed to delete alert" });
  }
};

/* ── Toggle / Re-arm Alert ──────────────────────────────────────────────────── */
const toggleAlert = async (req, res) => {
  try {
    const alert = await Alert.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!alert) {
      return res.status(404).json({ message: "Alert not found" });
    }

    // If it was already triggered, re-arming resets triggered to false
    if (alert.triggered) {
      alert.triggered = false;
      alert.triggeredAt = null;
      alert.triggeredPrice = null;
      alert.active = true;
      // Refresh initial price
      const price = await fetchCurrentPrice(alert.symbol);
      if (price) alert.initialPrice = price;
    } else {
      // Toggle active status
      alert.active = !alert.active;
    }

    await alert.save();
    res.status(200).json(alert);
  } catch (error) {
    console.error("[Alert] Toggle error:", error.message);
    res.status(500).json({ message: "Failed to update alert" });
  }
};

/* ── Send Test Alert Email ──────────────────────────────────────────────────── */
const sendTestAlert = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user || !user.email) {
      return res.status(400).json({ message: "User email not found" });
    }

    const { symbol = "RELIANCE.NS", targetPrice = 1300, condition = "above" } = req.body || {};
    const currentPrice = (await fetchCurrentPrice(symbol)) || targetPrice;

    // Send the test email
    await sendEmail({
      to: user.email,
      symbol,
      targetPrice,
      currentPrice,
      condition,
      isTest: true,
    });

    // Also add an in-app notification
    await Notification.create({
      user: user._id,
      message: `[Test Alert] Email verification sent to ${user.email} for ${symbol}`,
    });

    res.status(200).json({
      success: true,
      message: `Test alert email sent to ${user.email}`,
    });
  } catch (error) {
    console.error("[Alert] Test email error:", error.message);
    res.status(500).json({ message: "Failed to send test email" });
  }
};

module.exports = {
  createAlert,
  getAlerts,
  deleteAlert,
  toggleAlert,
  sendTestAlert,
};
