// server/controllers/watchlistController.js
const Watchlist = require("../models/Watchlist");
const YahooFinance = require("yahoo-finance2").default;
const yahooFinance = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

const YF_OPTS = { validateResult: false };

// Safe quote fetch helper
const safeQuote = async (symbols) => {
  try {
    const result = await Promise.race([
      yahooFinance.quote(symbols, {}, YF_OPTS),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Timeout")), 8000)
      ),
    ]);
    return result;
  } catch (err) {
    console.warn("[Watchlist] Quote error:", err.message);
    return null;
  }
};

/* ── Add To Watchlist ──────────────────────────────────────────────────────── */
const addToWatchlist = async (req, res) => {
  try {
    let { symbol, companyName, name } = req.body;

    if (!symbol) {
      return res.status(400).json({ message: "Symbol is required" });
    }

    symbol = symbol.trim().toUpperCase();
    if (!symbol.includes(".")) symbol = `${symbol}.NS`;

    const finalName = companyName || name || symbol.replace(".NS", "");

    // Prevent duplicates for this user
    const existing = await Watchlist.findOne({
      user: req.user._id,
      symbol,
    });

    if (existing) {
      return res.status(400).json({ message: "Stock is already in your watchlist" });
    }

    const item = await Watchlist.create({
      user: req.user._id,
      symbol,
      companyName: finalName,
    });

    // Try to get live price immediately
    const quote = await safeQuote(symbol);
    const price = quote?.regularMarketPrice || 0;
    const changePercent = quote?.regularMarketChangePercent || 0;
    const positive = changePercent >= 0;

    res.status(201).json({
      _id: item._id,
      symbol: item.symbol,
      name: item.companyName,
      exchange: "NSE",
      price: price > 0 ? `₹${price.toFixed(2)}` : "₹0.00",
      numericPrice: price,
      change: `${positive ? "+" : ""}${changePercent.toFixed(2)}%`,
      changePercent,
      positive,
      dayHigh: quote?.regularMarketDayHigh || null,
      dayLow: quote?.regularMarketDayLow || null,
      data: [20, 25, 22, 30, 27, 35],
    });
  } catch (error) {
    console.error("[Watchlist] Add error:", error.message);
    res.status(500).json({ message: error.message || "Failed to add to watchlist" });
  }
};

/* ── Get Watchlist with live prices ───────────────────────────────────────── */
const getWatchlist = async (req, res) => {
  try {
    const watchlist = await Watchlist.find({ user: req.user._id });
    if (!watchlist.length) return res.json([]);

    const symbols = watchlist.map((item) => item.symbol);
    const raw = await safeQuote(symbols);
    const quotes = Array.isArray(raw) ? raw : raw ? [raw] : [];

    // Create symbol map
    const quoteMap = new Map();
    for (const q of quotes) {
      if (q?.symbol) quoteMap.set(q.symbol, q);
    }

    const formatted = watchlist.map((item) => {
      const quote = quoteMap.get(item.symbol);
      const price = quote?.regularMarketPrice || 0;
      const changePercent = quote?.regularMarketChangePercent || 0;
      const positive = changePercent >= 0;

      return {
        _id: item._id,
        symbol: item.symbol,
        name: item.companyName || quote?.shortName || item.symbol.replace(".NS", ""),
        exchange: "NSE",
        price: price > 0 ? `₹${price.toFixed(2)}` : "₹0.00",
        numericPrice: price,
        change: `${positive ? "+" : ""}${changePercent.toFixed(2)}%`,
        changePercent,
        positive,
        volume: quote?.regularMarketVolume || 0,
        dayHigh: quote?.regularMarketDayHigh || null,
        dayLow: quote?.regularMarketDayLow || null,
        fiftyTwoWeekHigh: quote?.fiftyTwoWeekHigh || null,
        fiftyTwoWeekLow: quote?.fiftyTwoWeekLow || null,
        data: [20, 25, 22, 30, 27, 35],
      };
    });

    res.status(200).json(formatted);
  } catch (error) {
    console.error("[Watchlist] Get error:", error.message);
    res.status(500).json({ message: "Failed to fetch watchlist" });
  }
};

/* ── Remove From Watchlist ─────────────────────────────────────────────────── */
const removeFromWatchlist = async (req, res) => {
  try {
    const item = await Watchlist.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!item) {
      return res.status(404).json({ message: "Watchlist item not found" });
    }

    await item.deleteOne();
    res.status(200).json({ message: "Removed successfully" });
  } catch (error) {
    console.error("[Watchlist] Remove error:", error.message);
    res.status(500).json({ message: "Failed to remove from watchlist" });
  }
};

module.exports = {
  addToWatchlist,
  getWatchlist,
  removeFromWatchlist,
};
