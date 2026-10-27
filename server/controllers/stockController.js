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
  switch ((range || "1mo").toLowerCase()) {
    case "1d":
      return { period1: new Date(now - 1 * 24 * 60 * 60 * 1000), interval: "5m" };
    case "5d":
    case "1wk":
      return { period1: new Date(now - 5 * 24 * 60 * 60 * 1000), interval: "15m" };
    case "1m":
    case "1mo":
      return { period1: new Date(now - 30 * 24 * 60 * 60 * 1000), interval: "1d" };
    case "3m":
    case "3mo":
      return { period1: new Date(now - 90 * 24 * 60 * 60 * 1000), interval: "1d" };
    case "6m":
    case "6mo":
      return { period1: new Date(now - 180 * 24 * 60 * 60 * 1000), interval: "1d" };
    case "1y":
      return { period1: new Date(now - 365 * 24 * 60 * 60 * 1000), interval: "1d" };
    case "5y":
      return { period1: new Date(now - 5 * 365 * 24 * 60 * 60 * 1000), interval: "1wk" };
    default:
      return { period1: new Date(now - 30 * 24 * 60 * 60 * 1000), interval: "1d" };
  }
}

// ─── Format Indian Market Cap (Crores & Lakh Crores) ──────────────────────────
function formatIndianMarketCap(val) {
  if (!val || isNaN(val) || val <= 0) return "N/A";
  const cr = val / 10000000;
  if (cr >= 100000) {
    return `₹${(cr / 100000).toFixed(2)} Lakh Cr`;
  }
  return `₹${cr.toFixed(2)} Cr`;
}

// ─── Indian Market Trading Session Helper ────────────────────────────────────
function getIndianMarketSession() {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const ist = new Date(utc + 3600000 * 5.5);
  const hours = ist.getHours();
  const minutes = ist.getMinutes();
  const day = ist.getDay();

  const isWeekday = day >= 1 && day <= 5;
  const totalMinutes = hours * 60 + minutes;
  const marketOpenMinutes = 9 * 60 + 15; // 09:15 AM IST
  const marketCloseMinutes = 15 * 60 + 30; // 03:30 PM IST

  const isOpen = isWeekday && totalMinutes >= marketOpenMinutes && totalMinutes <= marketCloseMinutes;

  return {
    isOpen,
    session: isOpen
      ? "Regular Trading Session"
      : totalMinutes < marketOpenMinutes && isWeekday
      ? "Pre-Market"
      : "Market Closed",
    timezone: "IST (UTC+5:30)",
    exchange: "NSE",
    serverTime: ist.toISOString(),
  };
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
// Categorized by SEBI Market-Cap Framework:
// Large Cap: Top 100 (> ₹50,000 Cr)
// Mid Cap: 101 - 250 (₹15,000 - ₹50,000 Cr)
// Small Cap: 251+ (< ₹15,000 Cr)
const LARGE_CAP_SYMBOLS = [
  "RELIANCE.NS", "TCS.NS", "HDFCBANK.NS", "BHARTIARTL.NS", "ICICIBANK.NS",
  "INFY.NS", "ITC.NS", "SBIN.NS", "LT.NS", "HINDUNILVR.NS",
  "BAJFINANCE.NS", "MARUTI.NS", "TITAN.NS", "SUNPHARMA.NS", "TATAMOTORS.NS",
  "NTPC.NS", "ONGC.NS", "AXISBANK.NS", "KOTAKBANK.NS", "ADANIENT.NS"
];

const MID_CAP_SYMBOLS = [
  "POLYCAB.NS", "PERSISTENT.NS", "COFORGE.NS", "FEDERALBNK.NS", "ASHOKLEY.NS",
  "ASTRAL.NS", "VOLTAS.NS", "JUBLFOOD.NS", "MAXHEALTH.NS", "DIXON.NS",
  "CUMMINSIND.NS", "IDFCFIRSTB.NS", "BHARATFORG.NS", "MRF.NS", "PAGEIND.NS",
  "TATACOMM.NS", "DALBHARAT.NS", "AUROPHARMA.NS", "CONCOR.NS", "ESCORTS.NS"
];

const SMALL_CAP_SYMBOLS = [
  "CDSL.NS", "SUZLON.NS", "KEC.NS", "TRIDENT.NS", "HFCL.NS",
  "CLEAN.NS", "HAPPSTMNDS.NS", "CASTROLIND.NS", "ANGELONE.NS", "BSELTD.NS",
  "AMBER.NS", "SONATSOFTW.NS", "TANLA.NS", "CENTRALBK.NS", "RAILTEL.NS",
  "CEAT.NS", "ROUTE.NS", "RADICO.NS", "LEMONTREE.NS", "JUBLINGREA.NS"
];

function transformQuote(q, categoryName) {
  if (!q || !q.regularMarketPrice || !q.marketCap) return null;
  const changePct = q.regularMarketChangePercent ?? 0;
  const changeAmt = q.regularMarketChange ?? 0;
  const price = parseFloat(q.regularMarketPrice.toFixed(2));
  const dayHigh = q.regularMarketDayHigh ? parseFloat(q.regularMarketDayHigh.toFixed(2)) : price;
  const dayLow = q.regularMarketDayLow ? parseFloat(q.regularMarketDayLow.toFixed(2)) : price;

  // Generate 5-point realistic session trajectory sparkline
  const mid = (dayHigh + dayLow) / 2;
  const s1 = parseFloat((dayLow + (mid - dayLow) * 0.4).toFixed(2));
  const s2 = parseFloat((mid + (changePct >= 0 ? 0.2 : -0.2) * (dayHigh - dayLow)).toFixed(2));
  const s3 = parseFloat(((s2 + price) / 2).toFixed(2));

  return {
    symbol: q.symbol,
    ticker: q.symbol.replace(".NS", "").replace(".BO", ""),
    name: q.shortName || q.longName || q.symbol.replace(".NS", ""),
    price,
    change: parseFloat(changePct.toFixed(2)),
    changeAmount: parseFloat(changeAmt.toFixed(2)),
    positive: changePct >= 0,
    volume: q.regularMarketVolume || 0,
    marketCap: q.marketCap,
    marketCapFormatted: formatIndianMarketCap(q.marketCap),
    category: categoryName,
    dayHigh,
    dayLow,
    prevClose: q.regularMarketPreviousClose ? parseFloat(q.regularMarketPreviousClose.toFixed(2)) : null,
    sparkline: [dayLow, s1, mid, s2, s3, price],
  };
}

const getMarketMovers = async (req, res) => {
  try {
    const cached = getCache("movers_categorized");
    if (cached) return res.json(cached);

    const allSymbols = [...LARGE_CAP_SYMBOLS, ...MID_CAP_SYMBOLS, ...SMALL_CAP_SYMBOLS];
    const raw = await safeQuote(allSymbols, 12000);
    const quotes = Array.isArray(raw) ? raw : raw ? [raw] : [];

    const quoteMap = {};
    for (const q of quotes) {
      if (q?.symbol) quoteMap[q.symbol] = q;
    }

    const processCategory = (symbolList, categoryName) => {
      const items = symbolList
        .map((sym) => transformQuote(quoteMap[sym], categoryName))
        .filter(Boolean); // Exclude missing/invalid market cap or price

      const gainers = items
        .filter((s) => s.change >= 0)
        .sort((a, b) => b.change - a.change); // Highest positive % to lowest

      const losers = items
        .filter((s) => s.change < 0)
        .sort((a, b) => a.change - b.change); // Largest negative % to least negative

      return {
        label: categoryName,
        gainers,
        losers,
        all: [...gainers, ...losers],
      };
    };

    const largeCap = processCategory(LARGE_CAP_SYMBOLS, "Large Cap");
    const midCap = processCategory(MID_CAP_SYMBOLS, "Mid Cap");
    const smallCap = processCategory(SMALL_CAP_SYMBOLS, "Small Cap");

    const payload = {
      methodology: {
        benchmark: "SEBI Equity Categorization Framework",
        rules: {
          largeCap: "Top 100 companies by full market capitalization (> ₹50,000 Cr approx)",
          midCap: "101st - 250th companies by full market capitalization (₹15,000 - ₹50,000 Cr approx)",
          smallCap: "251st company onwards by full market capitalization (< ₹15,000 Cr approx)",
        },
        exchange: "NSE",
        lastUpdated: new Date().toISOString(),
        marketStatus: getIndianMarketSession(),
      },
      categories: {
        large: largeCap,
        mid: midCap,
        small: smallCap,
      },
      // Flat list for backward compatibility
      stocks: [...largeCap.all, ...midCap.all, ...smallCap.all],
    };

    setCache("movers_categorized", payload, 60 * 1000);
    return res.json(payload);
  } catch (error) {
    console.error("[Movers] Error:", error.message);
    const stale = cache["movers_categorized"]?.data;
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

    const cleanRange = (range || "1mo").toLowerCase();
    const cacheKey = `history_${symbol}_${cleanRange}`;
    const cached = getCache(cacheKey);
    if (cached) return res.json(cached);

    const { period1, interval } = getRangeConfig(cleanRange);

    const result = await Promise.race([
      yahooFinance.chart(symbol, { period1, interval }, YF_OPTS),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Timeout")), 10000)
      ),
    ]);

    if (!result?.quotes?.length) {
      return res.status(404).json({ message: "No chart data found" });
    }

    const seenTimes = new Set();
    const sortedQuotes = result.quotes
      .filter((item) => item.close !== undefined && item.close !== null)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const chartData = [];
    for (const item of sortedQuotes) {
      const unixTime = Math.floor(new Date(item.date).getTime() / 1000);
      if (seenTimes.has(unixTime)) continue;
      seenTimes.add(unixTime);

      const dateObj = new Date(item.date);
      let dateLabel = dateObj.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
      });
      if (cleanRange === "1d" || cleanRange === "5d") {
        dateLabel = dateObj.toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        });
      }

      const close = parseFloat(item.close.toFixed(2));
      const open = item.open != null ? parseFloat(item.open.toFixed(2)) : close;
      const high = item.high != null ? parseFloat(item.high.toFixed(2)) : Math.max(open, close);
      const low = item.low != null ? parseFloat(item.low.toFixed(2)) : Math.min(open, close);

      chartData.push({
        time: unixTime,
        date: dateLabel,
        open,
        high,
        low,
        close,
        price: close,
        volume: item.volume || 0,
      });
    }

    setCache(cacheKey, chartData, 3 * 60 * 1000);
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
