// server/controllers/stockController.js
const yahooFinance = require("yahoo-finance2").default;

// ─── Suppress yahoo-finance2 validation warnings ──────────────────────────────
const YF_OPTS = { validateResult: false };

// ─── Helper: map range param to yahoo period1 + interval ─────────────────────
function getRangeConfig(range) {
  const now = Date.now();
  switch (range) {
    case "1d":  return { period1: new Date(now - 1  * 24 * 60 * 60 * 1000), interval: "5m"  };
    case "1wk": return { period1: new Date(now - 7  * 24 * 60 * 60 * 1000), interval: "1h"  };
    case "1mo": return { period1: new Date(now - 30 * 24 * 60 * 60 * 1000), interval: "1d"  };
    case "3mo": return { period1: new Date(now - 90 * 24 * 60 * 60 * 1000), interval: "1d"  };
    case "1y":  return { period1: new Date(now - 365* 24 * 60 * 60 * 1000), interval: "1wk" };
    default:    return { period1: new Date(now - 30 * 24 * 60 * 60 * 1000), interval: "1d"  };
  }
}

// ─── GET /api/stocks/live?symbols=RELIANCE.NS,TCS.NS ─────────────────────────
const getLiveStocks = async (req, res) => {
  try {
    const { symbols } = req.query;
    if (!symbols) return res.status(400).json({ message: "Symbols required" });

    const symbolList = symbols.split(",").map(s => s.trim()).filter(Boolean);
    const stocks = [];

    for (const symbol of symbolList) {
      try {
        const quote = await yahooFinance.quote(symbol, {}, YF_OPTS);
        if (!quote?.regularMarketPrice) continue;
        stocks.push({
          symbol,
          name:          quote.longName || quote.shortName || symbol,
          price:         quote.regularMarketPrice,
          change:        quote.regularMarketChangePercent || 0,
          positive:      (quote.regularMarketChangePercent || 0) >= 0,
          volume:        quote.regularMarketVolume || 0,
          high:          quote.regularMarketDayHigh,
          low:           quote.regularMarketDayLow,
          open:          quote.regularMarketOpen,
          prevClose:     quote.regularMarketPreviousClose,
          marketCap:     quote.marketCap,
          shortName:     quote.shortName,
          longName:      quote.longName,
        });
      } catch (err) {
        console.log(`[Live] Failed: ${symbol} — ${err.message}`);
      }
    }

    return res.json(stocks);
  } catch (error) {
    console.log("[Live] Error:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// ─── GET /api/stocks/history/:symbol?range=1mo ────────────────────────────────
const getHistoricalData = async (req, res) => {
  try {
    const { symbol }     = req.params;
    const { range = "1mo" } = req.query; // FIX — was hardcoded 30 days

    const { period1, interval } = getRangeConfig(range);

    const result = await yahooFinance.chart(
      symbol,
      { period1, interval },
      YF_OPTS
    );

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

    res.json(chartData);
  } catch (error) {
    console.log("[History] Error:", error.message);
    res.status(500).json({ message: "Failed to fetch historical data" });
  }
};

// ─── GET /api/stocks/search?q=reliance ────────────────────────────────────────
// FIX — was missing entirely, caused 404
const searchStocks = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) {
      return res.status(400).json({ message: "Query too short" });
    }

    const result = await yahooFinance.search(q.trim(), {
      newsCount:          0,
      quotesCount:        10,
      enableFuzzyQuery:   false,
    }, YF_OPTS);

    // Filter to Indian stocks only
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

    res.json(stocks);
  } catch (error) {
    console.log("[Search] Error:", error.message);
    res.status(500).json({ message: "Search failed" });
  }
};

// ─── GET /api/stocks/indices ───────────────────────────────────────────────────
// FIX — was missing, caused NIFTY/SENSEX to break
const getMarketIndices = async (req, res) => {
  try {
    const indices = ["^NSEI", "^BSESN"];
    const data = [];

    for (const symbol of indices) {
      try {
        const quote = await yahooFinance.quote(symbol, {}, YF_OPTS);
        if (!quote?.regularMarketPrice) continue;
        data.push({
          symbol,
          price:    parseFloat(quote.regularMarketPrice.toFixed(2)),
          change:   parseFloat((quote.regularMarketChangePercent || 0).toFixed(2)),
          positive: (quote.regularMarketChangePercent || 0) >= 0,
        });
      } catch (err) {
        console.log(`[Indices] Failed: ${symbol}`);
      }
    }

    res.json(data);
  } catch (error) {
    console.log("[Indices] Error:", error.message);
    res.status(500).json({ message: "Failed to fetch indices" });
  }
};

// ─── GET /api/stocks/movers ────────────────────────────────────────────────────
// FIX — was missing, caused Market Movers widget to break
const MOVER_SYMBOLS = [
  "RELIANCE.NS","TCS.NS","HDFCBANK.NS","INFY.NS","ICICIBANK.NS",
  "BAJFINANCE.NS","SBIN.NS","WIPRO.NS","AXISBANK.NS","LT.NS",
  "ADANIPORTS.NS","MARUTI.NS","TITAN.NS","NESTLEIND.NS","HCLTECH.NS",
  "TECHM.NS","KOTAKBANK.NS","HINDUNILVR.NS","ULTRACEMCO.NS","NTPC.NS",
];

const getMarketMovers = async (req, res) => {
  try {
    const stocks = [];

    for (const symbol of MOVER_SYMBOLS) {
      try {
        const quote = await yahooFinance.quote(symbol, {}, YF_OPTS);
        if (!quote?.regularMarketPrice) continue;
        stocks.push({
          symbol,
          name:     quote.shortName || quote.longName || symbol,
          price:    parseFloat(quote.regularMarketPrice.toFixed(2)),
          change:   parseFloat((quote.regularMarketChangePercent || 0).toFixed(2)),
          positive: (quote.regularMarketChangePercent || 0) >= 0,
          volume:   quote.regularMarketVolume || 0,
        });
      } catch (err) {
        console.log(`[Movers] Failed: ${symbol}`);
      }
    }

    res.json(stocks);
  } catch (error) {
    console.log("[Movers] Error:", error.message);
    res.status(500).json({ message: "Failed to fetch movers" });
  }
};

module.exports = {
  getLiveStocks,
  getHistoricalData,
  searchStocks,
  getMarketIndices,
  getMarketMovers,
};