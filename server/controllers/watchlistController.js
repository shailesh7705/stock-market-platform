// server/controllers/watchlistController.js
const Watchlist    = require("../models/Watchlist");
const yahooFinance = require("yahoo-finance2").default;

const YF_OPTS = { validateResult: false };

// Safe quote fetch — never throws, always returns null on failure
const safeQuote = async (symbol) => {
  try {
    const result = await Promise.race([
      yahooFinance.quote(symbol, {}, YF_OPTS),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Timeout")), 6000)
      ),
    ]);
    return result;
  } catch {
    return null;
  }
};

/* ── Add To Watchlist ──────────────────────────────────────────────────────── */
const addToWatchlist = async (req, res) => {
  try {
    const { symbol, companyName, name } = req.body;
    const finalName = companyName || name || symbol;

    if (!symbol) {
      return res.status(400).json({ message: "Symbol is required" });
    }

    // Prevent duplicates
    const existing = await Watchlist.findOne({
      user: req.user._id,
      symbol,
    });
    if (existing) {
      return res.status(400).json({ message: "Already in watchlist" });
    }

    const item = await Watchlist.create({
      user:        req.user._id,
      symbol,
      companyName: finalName,
    });

    res.status(201).json({
      _id:      item._id,
      symbol:   item.symbol,
      name:     item.companyName,
      exchange: "NSE",
      price:    "₹0.00",
      change:   "+0.00%",
      positive: true,
      data:     [20, 25, 22, 30, 27, 35],
    });
  } catch (error) {
    console.log("[Watchlist] Add error:", error.message);
    res.status(500).json({ message: error.message });
  }
};

/* ── Get Watchlist with live prices ───────────────────────────────────────── */
const getWatchlist = async (req, res) => {
  try {
    const watchlist = await Watchlist.find({ user: req.user._id });

    if (!watchlist.length) return res.json([]);

    // Fetch all live prices safely — one failure won't crash the rest
    const quotes = await Promise.all(
      watchlist.map((item) => safeQuote(item.symbol))
    );

    const formatted = watchlist.map((item, i) => {
      const quote         = quotes[i];
      const price         = quote?.regularMarketPrice         || 0;
      const changePercent = quote?.regularMarketChangePercent || 0;
      const positive      = changePercent >= 0;

      return {
        _id:      item._id,
        symbol:   item.symbol,
        name:     item.companyName,
        exchange: "NSE",
        price:    price > 0 ? `₹${price.toFixed(2)}` : "₹0.00",
        change:   `${positive ? "+" : ""}${changePercent.toFixed(2)}%`,
        positive,
        data:     [20, 25, 22, 30, 27, 35],
      };
    });

    res.status(200).json(formatted);
  } catch (error) {
    console.log("[Watchlist] Get error:", error.message);
    res.status(500).json({ message: error.message });
  }
};

/* ── Remove From Watchlist ─────────────────────────────────────────────────── */
const removeFromWatchlist = async (req, res) => {
  try {
    const item = await Watchlist.findOne({
      _id:  req.params.id,
      user: req.user._id,
    });

    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    await item.deleteOne();
    res.status(200).json({ message: "Removed successfully" });
  } catch (error) {
    console.log("[Watchlist] Remove error:", error.message);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  addToWatchlist,
  getWatchlist,
  removeFromWatchlist,
};