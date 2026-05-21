// server/controllers/watchlistController.js
const Watchlist    = require("../models/Watchlist");
const yahooFinance = require("yahoo-finance2").default;

const YF_OPTS = { validateResult: false };

/* ── Add To Watchlist ────────────────────────────────────────────────────────── */
const addToWatchlist = async (req, res) => {
  try {
    const { symbol, name, companyName } = req.body;

    // Prevent duplicates
    const existing = await Watchlist.findOne({
      user:   req.user._id,
      symbol: symbol,
    });
    if (existing) {
      return res.status(400).json({ message: "Stock already in watchlist" });
    }

    const watchlistItem = await Watchlist.create({
      user:        req.user._id,
      symbol,
      companyName: name || companyName || symbol,
    });

    res.status(201).json({
      _id:      watchlistItem._id,
      symbol:   watchlistItem.symbol,
      name:     watchlistItem.companyName,
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

/* ── Get Watchlist with LIVE prices ─────────────────────────────────────────── */
const getWatchlist = async (req, res) => {
  try {
    const watchlist = await Watchlist.find({ user: req.user._id });

    if (!watchlist.length) return res.json([]);

    // FIX — fetch live prices for all watchlist symbols in parallel
    const liveDataResults = await Promise.allSettled(
      watchlist.map(item =>
        yahooFinance.quote(item.symbol, {}, YF_OPTS)
      )
    );

    const formatted = watchlist.map((item, i) => {
      const result = liveDataResults[i];
      const quote  = result.status === "fulfilled" ? result.value : null;

      const price         = quote?.regularMarketPrice   || 0;
      const changePercent = quote?.regularMarketChangePercent || 0;
      const positive      = changePercent >= 0;

      return {
        _id:      item._id,
        symbol:   item.symbol,
        name:     item.companyName,
        exchange: "NSE",
        // FIX — real live price instead of ₹0.00
        price:    price > 0 ? `₹${price.toFixed(2)}` : "₹0.00",
        change:   `${positive ? "+" : ""}${changePercent.toFixed(2)}%`,
        positive,
        data:     [20, 25, 22, 30, 27, 35], // sparkline placeholder
      };
    });

    res.status(200).json(formatted);
  } catch (error) {
    console.log("[Watchlist] Get error:", error.message);
    res.status(500).json({ message: error.message });
  }
};

/* ── Remove From Watchlist ───────────────────────────────────────────────────── */
const removeFromWatchlist = async (req, res) => {
  try {
    const item = await Watchlist.findOne({
      _id:  req.params.id,
      user: req.user._id, // FIX — ensure user owns this item
    });

    if (!item) {
      return res.status(404).json({ message: "Watchlist item not found" });
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