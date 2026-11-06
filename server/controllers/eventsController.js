// server/controllers/eventsController.js
const YahooFinance = require("yahoo-finance2").default;
const yahooFinance = new YahooFinance({ suppressNotices: ["yahooSurvey"] });
const { getCache, setCache } = require("../utils/memoryCache");
const Watchlist = require("../models/Watchlist");
const Portfolio = require("../models/Portfolio");

const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

function normalizeSymbol(sym = "") {
  const clean = String(sym).trim().toUpperCase();
  if (clean.includes(".")) return clean;
  return `${clean}.NS`;
}

/**
 * High-profile Indian equities sample events baseline
 */
const SAMPLE_MARKET_EVENTS = [
  {
    symbol: "RELIANCE",
    companyName: "Reliance Industries Ltd",
    type: "dividend",
    headline: "Final Dividend ₹10.00 per share",
    amount: 10.0,
    exDate: "2024-08-19",
    recordDate: "2024-08-20",
    status: "completed",
  },
  {
    symbol: "TCS",
    companyName: "Tata Consultancy Services Ltd",
    type: "dividend",
    headline: "Interim Dividend ₹10.00 + Special Dividend ₹67.00",
    amount: 77.0,
    exDate: "2025-01-17",
    recordDate: "2025-01-17",
    status: "upcoming",
  },
  {
    symbol: "INFY",
    companyName: "Infosys Ltd",
    type: "dividend",
    headline: "Interim Dividend ₹21.00 per share",
    amount: 21.0,
    exDate: "2024-10-28",
    recordDate: "2024-10-29",
    status: "completed",
  },
  {
    symbol: "HDFCBANK",
    companyName: "HDFC Bank Ltd",
    type: "dividend",
    headline: "Final Dividend ₹19.50 per share",
    amount: 19.5,
    exDate: "2024-05-10",
    recordDate: "2024-05-10",
    status: "completed",
  },
  {
    symbol: "ITC",
    companyName: "ITC Ltd",
    type: "dividend",
    headline: "Interim Dividend ₹6.25 per share",
    amount: 6.25,
    exDate: "2025-02-12",
    recordDate: "2025-02-12",
    status: "upcoming",
  },
  {
    symbol: "TATASTEEL",
    companyName: "Tata Steel Ltd",
    type: "split",
    headline: "Stock Split from ₹10 to ₹1 face value (10:1)",
    ratio: "10:1",
    exDate: "2022-07-28",
    status: "completed",
  },
  {
    symbol: "TITAN",
    companyName: "Titan Company Ltd",
    type: "dividend",
    headline: "Final Dividend ₹11.00 per share",
    amount: 11.0,
    exDate: "2024-06-27",
    recordDate: "2024-06-27",
    status: "completed",
  },
  {
    symbol: "SBIN",
    companyName: "State Bank of India",
    type: "earnings",
    headline: "Q3 FY25 Financial Results & Board Meeting",
    date: "2025-02-08",
    status: "upcoming",
  },
  {
    symbol: "WIPRO",
    companyName: "Wipro Ltd",
    type: "bonus",
    headline: "Bonus Issue 1:1 (One equity share for every one held)",
    ratio: "1:1",
    exDate: "2024-12-03",
    status: "completed",
  },
];

/**
 * GET /api/stocks/:symbol/events
 */
const getStockEvents = async (req, res) => {
  try {
    const { symbol } = req.params;
    if (!symbol) {
      return res.status(400).json({ message: "Symbol is required" });
    }

    const nsSymbol = normalizeSymbol(symbol);
    const cleanSym = nsSymbol.replace(".NS", "");

    const cacheKey = `events:${nsSymbol}`;
    const cached = getCache(cacheKey);
    if (cached) {
      return res.status(200).json(cached);
    }

    let calendarEvents = null;
    let chartEvents = null;

    try {
      // 1. Calendar Events (next earnings date, ex-dividend date)
      const summary = await yahooFinance.quoteSummary(
        nsSymbol,
        { modules: ["calendarEvents"] },
        { validateResult: false }
      );
      calendarEvents = summary?.calendarEvents;
    } catch {
      // Non-fatal
    }

    try {
      // 2. Chart historical events (dividends and splits)
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 3);

      const chartRes = await yahooFinance.chart(
        nsSymbol,
        {
          period1: oneYearAgo,
          events: "div,split",
        },
        { validateResult: false }
      );
      chartEvents = chartRes?.events;
    } catch {
      // Non-fatal
    }

    // Format dividends
    const dividends = [];
    if (chartEvents?.dividends) {
      Object.values(chartEvents.dividends).forEach((item) => {
        const d = new Date(item.date * 1000);
        dividends.push({
          amount: Number(Number(item.amount).toFixed(2)),
          date: d.toISOString().split("T")[0],
          formattedDate: d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
          type: item.amount > 15 ? "Special / Final" : "Interim",
        });
      });
    }

    // If Yahoo returned no historical dividends, supplement with known sample data for popular symbols
    if (dividends.length === 0) {
      const known = SAMPLE_MARKET_EVENTS.filter((e) => e.symbol === cleanSym && e.type === "dividend");
      known.forEach((k) => {
        dividends.push({
          amount: k.amount,
          date: k.exDate,
          formattedDate: new Date(k.exDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
          type: "Dividend",
        });
      });
    }

    // Sort newest first
    dividends.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Format splits
    const splits = [];
    if (chartEvents?.splits) {
      Object.values(chartEvents.splits).forEach((item) => {
        const d = new Date(item.date * 1000);
        splits.push({
          ratio: `${item.numerator}:${item.denominator}`,
          date: d.toISOString().split("T")[0],
          formattedDate: d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
          type: "Stock Split",
        });
      });
    }

    // Add sample splits/bonuses if present
    const sampleCorp = SAMPLE_MARKET_EVENTS.filter((e) => e.symbol === cleanSym && (e.type === "split" || e.type === "bonus"));
    sampleCorp.forEach((c) => {
      splits.push({
        ratio: c.ratio || "1:1",
        date: c.exDate,
        formattedDate: new Date(c.exDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
        type: c.type === "bonus" ? "Bonus Issue" : "Stock Split",
      });
    });

    // Upcoming events
    const upcoming = [];
    if (calendarEvents?.earnings?.earningsDate?.[0]) {
      const eDate = new Date(calendarEvents.earnings.earningsDate[0]);
      upcoming.push({
        title: "Q4 FY25 Earnings Call",
        category: "earnings",
        date: eDate.toISOString().split("T")[0],
        formattedDate: eDate.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
        description: "Quarterly Financial Results Announcement",
      });
    }

    if (calendarEvents?.exDividendDate) {
      const divDate = new Date(calendarEvents.exDividendDate);
      upcoming.push({
        title: `Upcoming Ex-Dividend Date`,
        category: "dividend",
        date: divDate.toISOString().split("T")[0],
        formattedDate: divDate.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
        description: calendarEvents.dividendDate ? `Payable on ${new Date(calendarEvents.dividendDate).toLocaleDateString("en-IN")}` : "Dividend payout",
      });
    }

    const payload = {
      symbol: cleanSym,
      dividends,
      splits,
      upcoming,
      lastUpdated: new Date().toISOString(),
    };

    setCache(cacheKey, payload, CACHE_TTL_MS);
    return res.status(200).json(payload);
  } catch (error) {
    console.error("[EventsController] Error:", error.message);
    return res.status(500).json({ message: "Failed to retrieve corporate actions" });
  }
};

/**
 * GET /api/events
 * Market-wide events calendar (dividends, splits, earnings)
 */
const getMarketEvents = async (req, res) => {
  try {
    const { type, scope } = req.query;

    let targetSymbols = null;

    // Filter by user's watchlist or portfolio if scope is requested
    if (scope === "watchlist" && req.user) {
      const items = await Watchlist.find({ user: req.user._id });
      targetSymbols = new Set(items.map((i) => i.symbol.replace(".NS", "").toUpperCase()));
    } else if (scope === "portfolio" && req.user) {
      const portfolio = await Portfolio.findOne({ user: req.user._id });
      if (portfolio?.holdings) {
        targetSymbols = new Set(portfolio.holdings.map((h) => h.symbol.replace(".NS", "").toUpperCase()));
      }
    }

    let results = [...SAMPLE_MARKET_EVENTS];

    if (targetSymbols && targetSymbols.size > 0) {
      results = results.filter((e) => targetSymbols.has(e.symbol));
    }

    if (type && type !== "all") {
      results = results.filter((e) => e.type === type);
    }

    // Sort by date (upcoming first, then recent)
    results.sort((a, b) => {
      const dateA = new Date(a.date || a.exDate);
      const dateB = new Date(b.date || b.exDate);
      return dateB - dateA;
    });

    return res.status(200).json({
      events: results,
      total: results.length,
      asOf: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[EventsController] Market events error:", error.message);
    return res.status(500).json({ message: "Failed to retrieve market events" });
  }
};

module.exports = {
  getStockEvents,
  getMarketEvents,
};
