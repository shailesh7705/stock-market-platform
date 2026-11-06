const YahooFinance = require("yahoo-finance2").default;
const yahooFinance = new YahooFinance({ suppressNotices: ["yahooSurvey"] });
const { recall, remember } = require("./memoryCache");
const { publishIndices, indicesListenerCount } = require("./alertBus");

const YF_OPTS = { validateResult: false };

async function snapshotIndices() {
  const cached = recall("indices");
  if (cached && !cached.stale) {
    publishIndices(cached.data);
    return cached.data;
  }

  try {
    const raw = await Promise.race([
      yahooFinance.quote(["^NSEI", "^BSESN"], {}, YF_OPTS),
      new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 6000)),
    ]);
    const results = Array.isArray(raw) ? raw : raw ? [raw] : [];
    const data = [];

    for (const quote of results) {
      if (!quote?.regularMarketPrice) continue;
      const change = quote.regularMarketChangePercent ?? 0;
      data.push({
        symbol: quote.symbol,
        name: quote.symbol === "^NSEI" ? "NIFTY 50" : "SENSEX",
        price: parseFloat(quote.regularMarketPrice.toFixed(2)),
        change: parseFloat(change.toFixed(2)),
        positive: change >= 0,
        dayHigh: quote.regularMarketDayHigh || null,
        dayLow: quote.regularMarketDayLow || null,
      });
    }

    if (data.length) {
      remember("indices", data, 45 * 1000);
      publishIndices(data);
    } else if (cached?.data?.length) {
      publishIndices(cached.data);
    }
    return data;
  } catch (error) {
    console.warn("[LiveHub] Index snapshot failed:", error.message);
    return [];
  }
}

function startLiveHub() {
  setInterval(() => {
    if (indicesListenerCount() > 0) {
      snapshotIndices();
    }
  }, 20000);
  console.log("[LiveHub] Index stream runs every 20s while a client is connected.");
}

module.exports = {
  startLiveHub,
  snapshotIndices,
};
