// server/controllers/alertController.js
const Alert = require("../models/Alert");
const User = require("../models/User");
const Notification = require("../models/Notification");
const sendEmail = require("../utils/sendEmail");
const { normalizeSymbol } = require("../utils/symbols");
const { armingDecision } = require("../utils/alertRules");
const YahooFinance = require("yahoo-finance2").default;
const yahooFinance = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

const YF_OPTS = { validateResult: false };

/* Safe quote helper */
async function fetchCurrentPrice(symbol) {
  try {
    const quote = await Promise.race([
      yahooFinance.quote(symbol, {}, YF_OPTS),
      new Promise((_, reject) => { const t = setTimeout(() => reject(new Error("Timeout")), 4000); if (t.unref) t.unref(); }),
    ]);
    const price = Number(quote?.regularMarketPrice);
    return Number.isFinite(price) && price > 0 ? price : null;
  } catch {
    return null;
  }
}

// Live price is required. Returns the price, or null after the response is sent.
async function requireArmable(res, symbol, condition, targetPrice) {
  const decision = armingDecision({
    symbol,
    condition,
    targetPrice,
    currentPrice: await fetchCurrentPrice(symbol),
  });
  if (decision.ok) return decision.currentPrice;
  res.status(decision.status).json(decision.body);
  return null;
}

/* ── Create Alert ───────────────────────────────────────────────────────────── */
const createAlert = async (req, res) => {
  try {
    const { symbol, targetPrice, condition, notes } = req.body;
    const currentPrice = await requireArmable(res, symbol, condition, targetPrice);
    if (currentPrice === null) return;

    const alert = await Alert.create({
      user: req.user._id,
      symbol,
      targetPrice,
      condition,
      initialPrice: currentPrice,
      notes: notes || "",
      active: true,
      triggered: false,
    });

    res.status(201).json(alert);
  } catch (error) {
    console.error("[Alert] Create error:", error.message);
    res.status(500).json({ message: "Failed to create alert" });
  }
};

/* ── Get User's Alerts ──────────────────────────────────────────────────────── */
const getAlerts = async (req, res) => {
  try {
    const { limit, before } = req.query;
    const filter = { user: req.user._id };
    if (before) filter.createdAt = { $lt: before };

    const alerts = await Alert.find(filter).sort({ createdAt: -1 }).limit(limit);
    if (alerts.length === limit) {
      res.setHeader("X-Next-Cursor", alerts[alerts.length - 1].createdAt.toISOString());
    }
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

/* ── Update target or re-arm ────────────────────────────────────────────────── */
const updateAlert = async (req, res) => {
  try {
    const alert = await Alert.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!alert) {
      return res.status(404).json({ message: "Alert not found" });
    }

    const nextTarget = req.body.targetPrice !== undefined ? req.body.targetPrice : alert.targetPrice;
    const nextCondition = req.body.condition || alert.condition;
    const willRearm = Boolean(req.body.rearm);
    const willBeLive = willRearm || (!alert.triggered && alert.active);
    const targetChanged = nextTarget !== alert.targetPrice;
    const conditionChanged = nextCondition !== alert.condition;

    if (willBeLive && (willRearm || targetChanged || conditionChanged)) {
      const currentPrice = await requireArmable(res, alert.symbol, nextCondition, nextTarget);
      if (currentPrice === null) return;
      alert.initialPrice = currentPrice;
    }

    alert.targetPrice = nextTarget;
    alert.condition = nextCondition;

    if (willRearm) {
      alert.triggered = false;
      alert.triggeredAt = null;
      alert.triggeredPrice = null;
      alert.active = true;
    }

    await alert.save();
    if (willRearm) {
      await Alert.updateOne({ _id: alert._id }, { $unset: { emailStatus: 1 } });
    }
    res.status(200).json(await Alert.findById(alert._id));
  } catch (error) {
    console.error("[Alert] Update error:", error.message);
    res.status(500).json({ message: "Failed to update alert" });
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

    const turningOn = alert.triggered || !alert.active;
    if (turningOn) {
      const currentPrice = await requireArmable(res, alert.symbol, alert.condition, alert.targetPrice);
      if (currentPrice === null) return;
      alert.triggered = false;
      alert.triggeredAt = null;
      alert.triggeredPrice = null;
      alert.active = true;
      alert.initialPrice = currentPrice;
    } else {
      alert.active = false;
    }

    await alert.save();
    if (turningOn) {
      await Alert.updateOne({ _id: alert._id }, { $unset: { emailStatus: 1 } });
    }
    res.status(200).json(await Alert.findById(alert._id));
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

    const body = req.body || {};
    const symbol = normalizeSymbol(body.symbol ?? "RELIANCE.NS");
    if (!symbol) {
      return res.status(400).json({ message: "Enter a valid NSE or BSE symbol, e.g. RELIANCE.NS" });
    }

    const targetPrice = Number(body.targetPrice ?? 1300);
    if (!Number.isFinite(targetPrice) || targetPrice <= 0) {
      return res.status(400).json({ message: "Target price must be a positive number" });
    }

    const condition = body.condition === "below" ? "below" : "above";
    const currentPrice = (await fetchCurrentPrice(symbol)) || targetPrice;

    const emailResult = await sendEmail({
      to: user.email,
      symbol,
      targetPrice,
      currentPrice,
      condition,
      isTest: true,
    });

    if (emailResult && emailResult.success === false) {
      console.warn("[Alert] Test email not delivered:", emailResult.error);
      return res.status(502).json({
        success: false,
        message: "Could not deliver the test email right now. Please try again later.",
      });
    }

    await Notification.create({
      user: user._id,
      message: `[Test Alert] Verification email sent for ${symbol}`,
    });

    res.status(200).json({
      success: true,
      message: "Test alert email sent. Check your inbox.",
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
  updateAlert,
  toggleAlert,
  sendTestAlert,
};
