// server/controllers/screenerController.js
const StockSnapshot = require("../models/StockSnapshot");
const SavedScreen = require("../models/SavedScreen");
const { getCache, setCache } = require("../utils/memoryCache");

const PRESETS = [
  {
    id: "high-roe",
    name: "High ROE Compounders",
    description: "Companies generating superior return on equity with low financial leverage.",
    filters: {
      roe: { min: 20 },
      debtToEquity: { max: 0.5 },
      pulseScore: { min: 65 },
    },
    sortBy: "roe",
    sortOrder: "desc",
  },
  {
    id: "coffee-can",
    name: "Coffee Can Leaders",
    description: "Consistent capital allocators with ROCE > 15% and strong moat.",
    filters: {
      roce: { min: 15 },
      marketCap: { min: 100000000000 }, // > 10,000 Cr
      pulseScore: { min: 70 },
    },
    sortBy: "pulseScore",
    sortOrder: "desc",
  },
  {
    id: "undervalued-value",
    name: "Undervalued Value",
    description: "Quality businesses trading at reasonable P/E with decent dividend yield.",
    filters: {
      pe: { min: 1, max: 22 },
      pulseScore: { min: 55 },
      dividendYield: { min: 1.0 },
    },
    sortBy: "pe",
    sortOrder: "asc",
  },
  {
    id: "dividend-aristocrats",
    name: "Dividend Aristocrats",
    description: "High dividend payers with sustainable balance sheets.",
    filters: {
      dividendYield: { min: 2.5 },
      debtToEquity: { max: 1.0 },
      marketCap: { min: 50000000000 },
    },
    sortBy: "dividendYield",
    sortOrder: "desc",
  },
  {
    id: "rsi-oversold",
    name: "RSI Oversold Reversal",
    description: "Technically oversold stocks with fundamentally sound PulseScores.",
    filters: {
      rsi: { min: 5, max: 38 },
      pulseScore: { min: 60 },
    },
    sortBy: "rsi",
    sortOrder: "asc",
  },
  {
    id: "zero-debt",
    name: "Zero Debt Growth",
    description: "Companies with negligible debt generating healthy returns.",
    filters: {
      debtToEquity: { max: 0.1 },
      roe: { min: 15 },
    },
    sortBy: "roe",
    sortOrder: "desc",
  },
];

/**
 * Seed StockSnapshot universe from stocks.json if DB is empty
 */
async function ensureSnapshotUniverse() {
  const count = await StockSnapshot.countDocuments();
  if (count >= 30) return;

  const path = require("path");
  const fs = require("fs");
  const stocksPath = path.join(__dirname, "../data/stocks.json");
  if (!fs.existsSync(stocksPath)) return;

  const rawStocks = JSON.parse(fs.readFileSync(stocksPath, "utf8"));
  const docs = rawStocks.map((s, idx) => {
    const sym = s.symbol.replace(".NS", "").toUpperCase();
    const mcap = s.marketCap || (2e12 / (idx + 1));
    const pe = s.pe || (15 + (idx % 25));
    const roe = s.roe || (12 + (idx % 20));
    const roce = roe * 0.95;
    const de = (idx % 5 === 0) ? 0.05 : Number((0.2 + (idx % 8) * 0.1).toFixed(2));
    const divYield = Number((0.5 + (idx % 4) * 0.8).toFixed(2));
    const pScore = 50 + (idx % 45);

    return {
      symbol: sym,
      companyName: s.name || s.companyName || sym,
      sector: s.sector || "Financial Services",
      price: s.price || 1500,
      change: s.change || 0,
      changePercent: s.changePercent || 0,
      volume: s.volume || 100000,
      marketCap: mcap,
      pe,
      pb: Number((pe / 5).toFixed(2)),
      roe,
      roce,
      debtToEquity: de,
      dividendYield: divYield,
      pulseScore: pScore,
      technicals: {
        rsi: 30 + (idx % 45),
        high52: (s.price || 1500) * 1.15,
        low52: (s.price || 1500) * 0.75,
      },
      lastUpdated: new Date(),
    };
  });

  await StockSnapshot.insertMany(docs, { ordered: false }).catch(() => {});
}

/**
 * Build mongo filter query from request
 */
function buildQueryFilter(filters = {}) {
  const q = {};

  if (filters.search && String(filters.search).trim()) {
    const term = String(filters.search).trim();
    q.$or = [
      { symbol: { $regex: term, $options: "i" } },
      { companyName: { $regex: term, $options: "i" } },
    ];
  }

  // Market Cap
  if (filters.marketCap) {
    q.marketCap = {};
    if (filters.marketCap.min !== undefined && filters.marketCap.min !== null) q.marketCap.$gte = Number(filters.marketCap.min);
    if (filters.marketCap.max !== undefined && filters.marketCap.max !== null) q.marketCap.$lte = Number(filters.marketCap.max);
    if (Object.keys(q.marketCap).length === 0) delete q.marketCap;
  }

  // P/E
  if (filters.pe) {
    q.pe = {};
    if (filters.pe.min !== undefined && filters.pe.min !== null) q.pe.$gte = Number(filters.pe.min);
    if (filters.pe.max !== undefined && filters.pe.max !== null) q.pe.$lte = Number(filters.pe.max);
    if (Object.keys(q.pe).length === 0) delete q.pe;
  }

  // P/B
  if (filters.pb) {
    q.pb = {};
    if (filters.pb.min !== undefined && filters.pb.min !== null) q.pb.$gte = Number(filters.pb.min);
    if (filters.pb.max !== undefined && filters.pb.max !== null) q.pb.$lte = Number(filters.pb.max);
    if (Object.keys(q.pb).length === 0) delete q.pb;
  }

  // ROE
  if (filters.roe) {
    q.roe = {};
    if (filters.roe.min !== undefined && filters.roe.min !== null) q.roe.$gte = Number(filters.roe.min);
    if (filters.roe.max !== undefined && filters.roe.max !== null) q.roe.$lte = Number(filters.roe.max);
    if (Object.keys(q.roe).length === 0) delete q.roe;
  }

  // ROCE
  if (filters.roce) {
    q.roce = {};
    if (filters.roce.min !== undefined && filters.roce.min !== null) q.roce.$gte = Number(filters.roce.min);
    if (filters.roce.max !== undefined && filters.roce.max !== null) q.roce.$lte = Number(filters.roce.max);
    if (Object.keys(q.roce).length === 0) delete q.roce;
  }

  // Debt to Equity
  if (filters.debtToEquity) {
    q.debtToEquity = {};
    if (filters.debtToEquity.min !== undefined && filters.debtToEquity.min !== null) q.debtToEquity.$gte = Number(filters.debtToEquity.min);
    if (filters.debtToEquity.max !== undefined && filters.debtToEquity.max !== null) q.debtToEquity.$lte = Number(filters.debtToEquity.max);
    if (Object.keys(q.debtToEquity).length === 0) delete q.debtToEquity;
  }

  // Dividend Yield
  if (filters.dividendYield) {
    q.dividendYield = {};
    if (filters.dividendYield.min !== undefined && filters.dividendYield.min !== null) q.dividendYield.$gte = Number(filters.dividendYield.min);
    if (filters.dividendYield.max !== undefined && filters.dividendYield.max !== null) q.dividendYield.$lte = Number(filters.dividendYield.max);
    if (Object.keys(q.dividendYield).length === 0) delete q.dividendYield;
  }

  // PulseScore
  if (filters.pulseScore) {
    q.pulseScore = {};
    if (filters.pulseScore.min !== undefined && filters.pulseScore.min !== null) q.pulseScore.$gte = Number(filters.pulseScore.min);
    if (filters.pulseScore.max !== undefined && filters.pulseScore.max !== null) q.pulseScore.$lte = Number(filters.pulseScore.max);
    if (Object.keys(q.pulseScore).length === 0) delete q.pulseScore;
  }

  // RSI
  if (filters.rsi) {
    q["technicals.rsi"] = {};
    if (filters.rsi.min !== undefined && filters.rsi.min !== null) q["technicals.rsi"].$gte = Number(filters.rsi.min);
    if (filters.rsi.max !== undefined && filters.rsi.max !== null) q["technicals.rsi"].$lte = Number(filters.rsi.max);
    if (Object.keys(q["technicals.rsi"]).length === 0) delete q["technicals.rsi"];
  }

  // Change Percent
  if (filters.changePercent) {
    q.changePercent = {};
    if (filters.changePercent.min !== undefined && filters.changePercent.min !== null) q.changePercent.$gte = Number(filters.changePercent.min);
    if (filters.changePercent.max !== undefined && filters.changePercent.max !== null) q.changePercent.$lte = Number(filters.changePercent.max);
    if (Object.keys(q.changePercent).length === 0) delete q.changePercent;
  }

  // Sectors
  if (Array.isArray(filters.sectors) && filters.sectors.length > 0) {
    q.sector = { $in: filters.sectors };
  }

  return q;
}

/**
 * POST /api/screener/query
 * Execute full-universe filter query (SP-39)
 */
const queryScreener = async (req, res) => {
  const startTime = Date.now();
  try {
    await ensureSnapshotUniverse();

    const {
      filters = {},
      preset = null,
      sortBy = "marketCap",
      sortOrder = "desc",
      page = 1,
      limit = 50,
      format = "json",
    } = req.body || {};

    let effectiveFilters = { ...filters };

    // Apply preset if requested
    if (preset) {
      const found = PRESETS.find((p) => p.id === preset);
      if (found) {
        effectiveFilters = { ...found.filters, ...filters };
      }
    }

    const query = buildQueryFilter(effectiveFilters);

    // Build sort object
    const sortField = ["marketCap", "pe", "pb", "roe", "roce", "debtToEquity", "dividendYield", "pulseScore", "price", "changePercent"].includes(sortBy)
      ? sortBy
      : "marketCap";
    const sortDir = sortOrder === "asc" ? 1 : -1;
    const sort = { [sortField]: sortDir };

    // CSV Export mode
    if (format === "csv") {
      const records = await StockSnapshot.find(query).sort(sort).limit(1000).lean();
      const csvHeader = "Symbol,Company Name,Sector,Price,Change %,Market Cap,P/E,P/B,ROE %,ROCE %,D/E,Dividend Yield %,PulseScore\n";
      const csvRows = records
        .map((r) =>
          [
            r.symbol,
            `"${(r.companyName || "").replace(/"/g, '""')}"`,
            `"${r.sector || ""}"`,
            r.price || 0,
            r.changePercent || 0,
            r.marketCap || 0,
            r.pe || "",
            r.pb || "",
            r.roe || "",
            r.roce || "",
            r.debtToEquity || "",
            r.dividendYield || "",
            r.pulseScore || "",
          ].join(",")
        )
        .join("\n");

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", 'attachment; filename="screener-results.csv"');
      return res.status(200).send(csvHeader + csvRows);
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const pageLimit = Math.min(200, Math.max(10, parseInt(limit, 10) || 50));
    const skip = (pageNum - 1) * pageLimit;

    const [total, records] = await Promise.all([
      StockSnapshot.countDocuments(query),
      StockSnapshot.find(query).sort(sort).skip(skip).limit(pageLimit).lean(),
    ]);

    const executionTimeMs = Date.now() - startTime;

    return res.status(200).json({
      data: records,
      total,
      page: pageNum,
      limit: pageLimit,
      totalPages: Math.ceil(total / pageLimit) || 1,
      executionTimeMs,
    });
  } catch (error) {
    console.error("[ScreenerController] Query error:", error.message);
    return res.status(500).json({ message: "Failed to execute screener query" });
  }
};

/**
 * GET /api/screener/presets
 */
const getPresets = (req, res) => {
  return res.status(200).json({ presets: PRESETS });
};

/**
 * GET /api/screener/saved (authenticated)
 */
const getSavedScreens = async (req, res) => {
  try {
    const screens = await SavedScreen.find({ user: req.user._id }).sort({ updatedAt: -1 });
    return res.status(200).json({ screens });
  } catch (error) {
    console.error("[ScreenerController] Get saved error:", error.message);
    return res.status(500).json({ message: "Failed to load saved screens" });
  }
};

/**
 * POST /api/screener/saved (authenticated)
 */
const createSavedScreen = async (req, res) => {
  try {
    const { name, description, filters, columns, sortBy, sortOrder } = req.body || {};

    if (!name || !String(name).trim()) {
      return res.status(400).json({ message: "Screen name is required" });
    }

    const screen = await SavedScreen.findOneAndUpdate(
      { user: req.user._id, name: String(name).trim() },
      {
        user: req.user._id,
        name: String(name).trim(),
        description: description || "",
        filters: filters || {},
        columns: columns || undefined,
        sortBy: sortBy || "marketCap",
        sortOrder: sortOrder || "desc",
      },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
    );

    return res.status(201).json({ message: "Screen saved successfully", screen });
  } catch (error) {
    console.error("[ScreenerController] Create saved error:", error.message);
    return res.status(500).json({ message: "Failed to save screen" });
  }
};

/**
 * DELETE /api/screener/saved/:id (authenticated)
 */
const deleteSavedScreen = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await SavedScreen.findOneAndDelete({ _id: id, user: req.user._id });
    if (!deleted) {
      return res.status(404).json({ message: "Saved screen not found" });
    }
    return res.status(200).json({ message: "Saved screen deleted successfully" });
  } catch (error) {
    console.error("[ScreenerController] Delete saved error:", error.message);
    return res.status(500).json({ message: "Failed to delete screen" });
  }
};

module.exports = {
  queryScreener,
  getPresets,
  getSavedScreens,
  createSavedScreen,
  deleteSavedScreen,
};
