const YahooFinance = require("yahoo-finance2").default;
const yahooFinance = new YahooFinance({ suppressNotices: ["yahooSurvey"] });
const { getCache, setCache } = require("./memoryCache");
const { mapPool } = require("./marketMath");

const YF_OPTS = { validateResult: false };

async function sparklineFor(symbol) {
  const key = `spark:${symbol}`;
  const cached = getCache(key);
  if (Array.isArray(cached) && cached.length >= 2) return cached;

  const period1 = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
  try {
    const chart = await Promise.race([
      yahooFinance.chart(symbol, { period1, interval: "5m" }, YF_OPTS),
      new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 8000)),
    ]);
    const points = (chart?.quotes || [])
      .map((quote) => Number(quote.close))
      .filter((price) => price > 0)
      .slice(-36);
    if (points.length >= 2) setCache(key, points, 60 * 1000);
    return points;
  } catch (error) {
    console.warn(`[Sparkline] ${symbol}: ${error.message}`);
    return [];
  }
}

async function sparklinesFor(symbols) {
  const unique = [...new Set(symbols.filter(Boolean))];
  if (!unique.length) return new Map();
  const rows = await mapPool(unique, 4, async (symbol) => [symbol, await sparklineFor(symbol)]);
  return new Map(rows);
}

module.exports = { sparklineFor, sparklinesFor };
