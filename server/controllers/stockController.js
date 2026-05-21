// server/controllers/stockController.js
const yahooFinance = require("yahoo-finance2").default;

const YF_OPTS = { validateResult: false };

// ─── Simple in-memory cache ───────────────────────────────────────────────────
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

// ─── Safe quote with timeout ──────────────────────────────────────────────────
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

// ─── Range config ─────────────────────────────────────────────────────────────
function getRangeConfig(range) {
  const now = Date.now();
  switch (range) {
    case "1d":  return { period1: new Date(now - 1   * 24 * 60 * 60 * 1000), interval: "5m"  };
    case "1wk": return { period1: new Date(now - 7   * 24 * 60 * 60 * 1000), interval: "1h"  };
    case "1mo": return { period1: new Date(now - 30  * 24 * 60 * 60 * 1000), interval: "1d"  };
    case "3mo": return { period1: new Date(now - 90  * 24 * 60 * 60 * 1000), interval: "1d"  };
    case "1y":  return { period1: new Date(now - 365 * 24 * 60 * 60 * 1000), interval: "1wk" };
    default:    return { period1: new Date(now - 30  * 24 * 60 * 60 * 1000), interval: "1d"  };
  }
}

// ─── GET /api/stocks/indices ──────────────────────────────────────────────────
const getMarketIndices = async (req, res) => {
  try {
    const cached = getCache("indices");
    if (cached) return res.json(cached);

    const results = await Promise.all([
      safeQuote("^NSEI"),
      safeQuote("^BSESN"),
    ]);

    const data = [];
    const symbols = ["^NSEI", "^BSESN"];
    results.forEach((quote, i) => {
      if (!quote?.regularMarketPrice) return;
      data.push({
        symbol:   symbols[i],
        price:    parseFloat(quote.regularMarketPrice.toFixed(2)),
        change:   parseFloat((quote.regularMarketChangePercent || 0).toFixed(2)),
        positive: (quote.regularMarketChangePercent || 0) >= 0,
      });
    });

    if (data.length > 0) setCache("indices", data, 60 * 1000);
    else {
      // Return stale cache if fresh fetch returned nothing
      const stale = cache["indices"]?.data;
      if (stale) return res.json(stale);
    }
    res.json(data);
  } catch (error) {
    console.log("[Indices] Error:", error.message);
    const stale = cache["indices"]?.data;
    if (stale) return res.json(stale);
    res.status(500).json({ message: "Failed to fetch indices" });
  }
};

// ─── GET /api/stocks/movers ───────────────────────────────────────────────────
const MOVER_SYMBOLS = [
  "RELIANCE.NS", "TCS.NS",       "HDFCBANK.NS",  "INFY.NS",      "ICICIBANK.NS",
  "BAJFINANCE.NS","SBIN.NS",     "WIPRO.NS",     "AXISBANK.NS",  "LT.NS",
  "ADANIPORTS.NS","MARUTI.NS",   "TITAN.NS",     "NESTLEIND.NS", "HCLTECH.NS",
  "TECHM.NS",    "KOTAKBANK.NS", "HINDUNILVR.NS","ULTRACEMCO.NS","NTPC.NS",
];

const getMarketMovers = async (req, res) => {
  try {
    const cached = getCache("movers");
    if (cached) return res.json(cached);

    const stocks = [];
    const BATCH  = 5; // fetch 5 at a time to avoid overwhelming Yahoo

    for (let i = 0; i < MOVER_SYMBOLS.length; i += BATCH) {
      const batch   = MOVER_SYMBOLS.slice(i, i + BATCH);
      const results = await Promise.all(batch.map(safeQuote));
      results.forEach((quote, j) => {
        if (!quote?.regularMarketPrice) return;
        stocks.push({
          symbol:   batch[j],
          name:     quote.shortName || quote.longName || batch[j],
          price:    parseFloat(quote.regularMarketPrice.toFixed(2)),
          change:   parseFloat((quote.regularMarketChangePercent || 0).toFixed(2)),
          positive: (quote.regularMarketChangePercent || 0) >= 0,
          volume:   quote.regularMarketVolume || 0,
        });
      });
    }

    if (stocks.length > 0) setCache("movers", stocks, 2 * 60 * 1000);
    else {
      const stale = cache["movers"]?.data;
      if (stale) return res.json(stale);
    }
    res.json(stocks);
  } catch (error) {
    console.log("[Movers] Error:", error.message);
    const stale = cache["movers"]?.data;
    if (stale) return res.json(stale);
    res.status(500).json({ message: "Failed to fetch movers" });
  }
};

// ─── GET /api/stocks/live ─────────────────────────────────────────────────────
const getLiveStocks = async (req, res) => {
  try {
    const { symbols } = req.query;
    if (!symbols) return res.status(400).json({ message: "Symbols required" });

    const symbolList = symbols.split(",").map(s => s.trim()).filter(Boolean);
    const cacheKey   = `live_${symbolList.sort().join(",")}`;

    const cached = getCache(cacheKey);
    if (cached) return res.json(cached);

    const results = await Promise.all(symbolList.map(safeQuote));
    const stocks  = [];

    results.forEach((quote, i) => {
      if (!quote?.regularMarketPrice) return;
      stocks.push({
        symbol:    symbolList[i],
        name:      quote.longName || quote.shortName || symbolList[i],
        price:     quote.regularMarketPrice,
        change:    quote.regularMarketChangePercent || 0,
        positive:  (quote.regularMarketChangePercent || 0) >= 0,
        volume:    quote.regularMarketVolume || 0,
        high:      quote.regularMarketDayHigh,
        low:       quote.regularMarketDayLow,
        open:      quote.regularMarketOpen,
        prevClose: quote.regularMarketPreviousClose,
        marketCap: quote.marketCap,
        shortName: quote.shortName,
        longName:  quote.longName,
      });
    });

    if (stocks.length > 0) setCache(cacheKey, stocks, 30 * 1000);
    return res.json(stocks);
  } catch (error) {
    console.log("[Live] Error:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// ─── GET /api/stocks/history/:symbol ─────────────────────────────────────────
const getHistoricalData = async (req, res) => {
  try {
    const { symbol }        = req.params;
    const { range = "1mo" } = req.query;
    const cacheKey          = `history_${symbol}_${range}`;

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
      return res.status(404).json({ message: "No data found" });
    }

    const chartData = result.quotes
      .filter(item => item.close)
      .map(item => ({
        date:  new Date(item.date).toLocaleDateString("en-IN", {
                 day: "numeric", month: "short",
               }),
        price: parseFloat(item.close.toFixed(2)),
      }));

    setCache(cacheKey, chartData, 5 * 60 * 1000);
    res.json(chartData);
  } catch (error) {
    console.log("[History] Error:", error.message);
    res.status(500).json({ message: "Failed to fetch historical data" });
  }
};

// ─── GET /api/stocks/search ───────────────────────────────────────────────────
const searchStocks = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) {
      return res.status(400).json({ message: "Query too short" });
    }

    const cacheKey = `search_${q.trim().toLowerCase()}`;
    const cached   = getCache(cacheKey);
    if (cached) return res.json(cached);

    const result = await Promise.race([
      yahooFinance.search(q.trim(), {
        newsCount:        0,
        quotesCount:      10,
        enableFuzzyQuery: false,
      }, YF_OPTS),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Timeout")), 8000)
      ),
    ]);

    const stocks = (result.quotes || [])
      .filter(s =>
        s.quoteType === "EQUITY" &&
        (s.exchange === "NSI" || s.exchange === "BSE" ||
         s.symbol?.endsWith(".NS") || s.symbol?.endsWith(".BO"))
      )
      .slice(0, 8)
      .map(s => ({
        symbol:   s.symbol,
        name:     s.longname || s.shortname || s.symbol,
        exchange: s.exchange === "NSI" ? "NSE" : "BSE",
      }));

    setCache(cacheKey, stocks, 5 * 60 * 1000);
    res.json(stocks);
  } catch (error) {
    console.log("[Search] Error:", error.message);
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