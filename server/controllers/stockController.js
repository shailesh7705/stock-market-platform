// server/controllers/stockController.js
const path = require("path");
const fs = require("fs");
const YahooFinance = require("yahoo-finance2").default;
const yahooFinance = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

const YF_OPTS = { validateResult: false };

// ─── Load Local NSE Stocks for Instant Search ─────────────────────────────────
let localStocks = [];
try {
  const stocksPath = path.join(__dirname, "../data/stocks.json");
  if (fs.existsSync(stocksPath)) {
    localStocks = JSON.parse(fs.readFileSync(stocksPath, "utf-8"));
  }
} catch (err) {
  console.warn("[StockController] Could not load stocks.json:", err.message);
}

// ─── Simple In-Memory Cache ───────────────────────────────────────────────────
const cache = {};

function getCache(key) {
  const entry = cache[key];
  if (!entry) return null;
  if (Date.now() - entry.time > entry.ttl) {
    delete cache[key];
    return null;
  }
  return entry.data;
}

function setCache(key, data, ttl) {
  cache[key] = { data, time: Date.now(), ttl };
}

// ─── Safe Quote Helper with Timeout ───────────────────────────────────────────
async function safeQuote(symbolOrSymbols, timeoutMs = 8000) {
  try {
    return await Promise.race([
      yahooFinance.quote(symbolOrSymbols, {}, YF_OPTS),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Timeout")), timeoutMs)
      ),
    ]);
  } catch (err) {
    console.warn(`[SafeQuote] Failed for ${symbolOrSymbols}:`, err.message);
    return null;
  }
}

// ─── Range Config for Historical Data ─────────────────────────────────────────
function getRangeConfig(range) {
  const now = Date.now();
  switch (range) {
    case "1d":
      return { period1: new Date(now - 1 * 24 * 60 * 60 * 1000), interval: "5m" };
    case "1wk":
      return { period1: new Date(now - 7 * 24 * 60 * 60 * 1000), interval: "30m" };
    case "1mo":
      return { period1: new Date(now - 30 * 24 * 60 * 60 * 1000), interval: "1d" };
    case "3mo":
      return { period1: new Date(now - 90 * 24 * 60 * 60 * 1000), interval: "1d" };
    case "1y":
      return { period1: new Date(now - 365 * 24 * 60 * 60 * 1000), interval: "1wk" };
    default:
      return { period1: new Date(now - 30 * 24 * 60 * 60 * 1000), interval: "1d" };
  }
}

// ─── Fallback Indices if Yahoo API has hiccups ────────────────────────────────
const FALLBACK_INDICES = [
  { symbol: "^NSEI", name: "NIFTY 50", price: 22710.25, change: 0.15, positive: true },
  { symbol: "^BSESN", name: "SENSEX", price: 73385.50, change: 0.18, positive: true },
];

// ─── GET /api/stocks/indices ──────────────────────────────────────────────────
const getMarketIndices = async (req, res) => {
  try {
    const cached = getCache("indices");
    if (cached) return res.json(cached);

    const raw = await safeQuote(["^NSEI", "^BSESN"], 6000);
    const results = Array.isArray(raw) ? raw : raw ? [raw] : [];

    const data = [];
    for (const q of results) {
      if (!q || !q.regularMarketPrice) continue;
      const chg = q.regularMarketChangePercent ?? 0;
      data.push({
        symbol: q.symbol,
        name: q.symbol === "^NSEI" ? "NIFTY 50" : "SENSEX",
        price: parseFloat(q.regularMarketPrice.toFixed(2)),
        change: parseFloat(chg.toFixed(2)),
        positive: chg >= 0,
        dayHigh: q.regularMarketDayHigh || null,
        dayLow: q.regularMarketDayLow || null,
      });
    }

    if (data.length > 0) {
      setCache("indices", data, 45 * 1000);
      return res.json(data);
    }

    // Return stale cache if available, else fallback
    const stale = cache["indices"]?.data;
    if (stale && stale.length > 0) return res.json(stale);

    return res.json(FALLBACK_INDICES);
  } catch (error) {
    console.error("[Indices] Error:", error.message);
    const stale = cache["indices"]?.data;
    if (stale) return res.json(stale);
    return res.json(FALLBACK_INDICES);
  }
};

// ─── GET /api/stocks/movers ───────────────────────────────────────────────────
const MOVER_SYMBOLS = [
  "RELIANCE.NS", "TCS.NS", "HDFCBANK.NS", "INFY.NS", "ICICIBANK.NS",
  "BAJFINANCE.NS", "SBIN.NS", "WIPRO.NS", "AXISBANK.NS", "LT.NS",
  "ADANIENT.NS", "MARUTI.NS", "TITAN.NS", "NESTLEIND.NS", "HCLTECH.NS",
  "TATAMOTORS.NS", "KOTAKBANK.NS", "HINDUNILVR.NS", "NTPC.NS", "ITC.NS",
];

const getMarketMovers = async (req, res) => {
  try {
    const cached = getCache("movers");
    if (cached) return res.json(cached);

    // Fetch batch in one request
    const raw = await safeQuote(MOVER_SYMBOLS, 10000);
    const quotes = Array.isArray(raw) ? raw : raw ? [raw] : [];

    const stocks = [];
    for (const q of quotes) {
      if (!q || !q.regularMarketPrice) continue;
      const chg = q.regularMarketChangePercent ?? 0;
      stocks.push({
        symbol: q.symbol,
        name: q.shortName || q.longName || q.symbol.replace(".NS", ""),
        price: parseFloat(q.regularMarketPrice.toFixed(2)),
        change: parseFloat(chg.toFixed(2)),
        positive: chg >= 0,
        volume: q.regularMarketVolume || 0,
        dayHigh: q.regularMarketDayHigh || null,
        dayLow: q.regularMarketDayLow || null,
      });
    }

    if (stocks.length > 0) {
      setCache("movers", stocks, 60 * 1000);
      return res.json(stocks);
    }

    const stale = cache["movers"]?.data;
    if (stale && stale.length > 0) return res.json(stale);

    return res.json([]);
  } catch (error) {
    console.error("[Movers] Error:", error.message);
    const stale = cache["movers"]?.data;
    if (stale) return res.json(stale);
    res.status(500).json({ message: "Failed to fetch movers" });
  }
};

// ─── GET /api/stocks/live?symbols=... ─────────────────────────────────────────
const getLiveStocks = async (req, res) => {
  try {
    const { symbols } = req.query;
    if (!symbols) return res.status(400).json({ message: "Symbols required" });

    const symbolList = symbols
      .split(",")
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean);

    const cacheKey = `live_${symbolList.slice().sort().join(",")}`;
    const cached = getCache(cacheKey);
    if (cached) return res.json(cached);

    const raw = await safeQuote(symbolList, 8000);
    const quotes = Array.isArray(raw) ? raw : raw ? [raw] : [];

    const stocks = quotes
      .filter((q) => q && q.regularMarketPrice)
      .map((quote) => {
        const changePercent = quote.regularMarketChangePercent ?? 0;
        return {
          symbol: quote.symbol,
          name: quote.longName || quote.shortName || quote.symbol,
          shortName: quote.shortName || quote.symbol.replace(".NS", ""),
          longName: quote.longName || quote.shortName || quote.symbol,
          price: quote.regularMarketPrice,
          change: changePercent,
          positive: changePercent >= 0,
          volume: quote.regularMarketVolume || 0,
          high: quote.regularMarketDayHigh || null,
          low: quote.regularMarketDayLow || null,
          open: quote.regularMarketOpen || null,
          prevClose: quote.regularMarketPreviousClose || null,
          marketCap: quote.marketCap || null,
          fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh || null,
          fiftyTwoWeekLow: quote.fiftyTwoWeekLow || null,
          fiftyTwoWeekChangePercent: quote.fiftyTwoWeekChangePercent || null,
          trailingPE: quote.trailingPE || null,
          dividendYield: quote.dividendYield ? quote.dividendYield * 100 : null,
          currency: quote.currency || "INR",
          exchange: quote.fullExchangeName || "NSE",
        };
      });

    if (stocks.length > 0) setCache(cacheKey, stocks, 15 * 1000);
    return res.json(stocks);
  } catch (error) {
    console.error("[Live] Error:", error.message);
    return res.status(500).json({ message: "Failed to fetch live prices" });
  }
};

// ─── GET /api/stocks/history/:symbol?range=... ───────────────────────────────
const getHistoricalData = async (req, res) => {
  try {
    let { symbol } = req.params;
    const { range = "1mo" } = req.query;

    if (!symbol) return res.status(400).json({ message: "Symbol required" });
    symbol = symbol.trim().toUpperCase();
    if (!symbol.includes(".")) symbol = `${symbol}.NS`;

    const cacheKey = `history_${symbol}_${range}`;
    const cached = getCache(cacheKey);
    if (cached) return res.json(cached);

    const { period1, interval } = getRangeConfig(range);

    const result = await Promise.race([
      yahooFinance.chart(symbol, { period1, interval }, YF_OPTS),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Timeout")), 10000)
      ),
    ]);

    if (!result?.quotes?.length) {
      return res.status(404).json({ message: "No chart data found" });
    }

    const chartData = result.quotes
      .filter((item) => item.close !== undefined && item.close !== null)
      .map((item) => {
        const dateObj = new Date(item.date);
        let dateLabel = dateObj.toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
        });
        if (range === "1d") {
          dateLabel = dateObj.toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          });
        }
        return {
          date: dateLabel,
          price: parseFloat(item.close.toFixed(2)),
          open: item.open ? parseFloat(item.open.toFixed(2)) : undefined,
          high: item.high ? parseFloat(item.high.toFixed(2)) : undefined,
          low: item.low ? parseFloat(item.low.toFixed(2)) : undefined,
          volume: item.volume,
        };
      });

    setCache(cacheKey, chartData, 5 * 60 * 1000);
    return res.json(chartData);
  } catch (error) {
    console.error("[History] Error:", error.message);
    res.status(500).json({ message: "Failed to fetch historical data" });
  }
};

// ─── GET /api/stocks/search?q=... ─────────────────────────────────────────────
const searchStocks = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 1) {
      return res.status(400).json({ message: "Query too short" });
    }

    const cleanQ = q.trim().toLowerCase();
    const cacheKey = `search_${cleanQ}`;
    const cached = getCache(cacheKey);
    if (cached) return res.json(cached);

    // 1. Search in-memory NSE stocks list (instant, reliable)
    let matches = [];
    if (localStocks.length > 0) {
      const exactMatch = [];
      const startsWith = [];
      const contains = [];

      for (const s of localStocks) {
        const symClean = s.symbol.replace(".NS", "").toLowerCase();
        const nameLower = (s.name || "").toLowerCase();

        if (symClean === cleanQ) {
          exactMatch.push(s);
        } else if (symClean.startsWith(cleanQ) || nameLower.startsWith(cleanQ)) {
          startsWith.push(s);
        } else if (symClean.includes(cleanQ) || nameLower.includes(cleanQ)) {
          contains.push(s);
        }

        if (exactMatch.length + startsWith.length + contains.length >= 25) break;
      }

      matches = [...exactMatch, ...startsWith, ...contains].slice(0, 10).map((s) => ({
        symbol: s.symbol,
        name: s.name,
        exchange: "NSE",
      }));
    }

    // 2. If no local matches found, fallback to Yahoo Finance online search
    if (matches.length === 0) {
      try {
        const result = await Promise.race([
          yahooFinance.search(
            cleanQ,
            { newsCount: 0, quotesCount: 8, enableFuzzyQuery: false },
            YF_OPTS
          ),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Timeout")), 4000)
          ),
        ]);

        matches = (result.quotes || [])
          .filter(
            (s) =>
              s.quoteType === "EQUITY" &&
              (s.exchange === "NSI" ||
                s.exchange === "BSE" ||
                s.symbol?.endsWith(".NS") ||
                s.symbol?.endsWith(".BO"))
          )
          .slice(0, 8)
          .map((s) => ({
            symbol: s.symbol,
            name: s.longname || s.shortname || s.symbol,
            exchange: s.exchange === "NSI" || s.symbol?.endsWith(".NS") ? "NSE" : "BSE",
          }));
      } catch (yfErr) {
        console.warn("[Search] Yahoo fallback search error:", yfErr.message);
      }
    }

    setCache(cacheKey, matches, 5 * 60 * 1000);
    return res.json(matches);
  } catch (error) {
    console.error("[Search] Error:", error.message);
    res.status(500).json({ message: "Search failed" });
  }
};

module.exports = {
  getLiveStocks,
  getHistoricalData,
  searchStocks,
  getMarketIndices,
  getMarketMovers,
};
