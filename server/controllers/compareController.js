// server/controllers/compareController.js
const YahooFinance = require("yahoo-finance2").default;
const yahooFinance = new YahooFinance({ suppressNotices: ["yahooSurvey"] });
const { getCache, setCache } = require("../utils/memoryCache");
const { calculatePulseScore, getSectorMedianPE } = require("../utils/pulseScore");

const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

function normalizeSymbol(sym = "") {
  const clean = String(sym).trim().toUpperCase();
  if (clean.includes(".")) return clean;
  return `${clean}.NS`;
}

/**
 * GET /api/stocks/compare?symbols=RELIANCE,TCS,INFY,HDFCBANK
 * Compare up to 4 stocks side by side (SP-40)
 */
const compareStocks = async (req, res) => {
  try {
    const rawSymbols = req.query.symbols;
    if (!rawSymbols) {
      return res.status(400).json({ message: "Provide at least one symbol via ?symbols=SYM1,SYM2" });
    }

    const symbolList = String(rawSymbols)
      .split(",")
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean)
      .slice(0, 4);

    if (symbolList.length === 0) {
      return res.status(400).json({ message: "No valid symbols provided" });
    }

    const cacheKey = `compare:${symbolList.sort().join(",")}`;
    const cached = getCache(cacheKey);
    if (cached) {
      return res.status(200).json(cached);
    }

    // Fetch details for all symbols in parallel
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const stockPromises = symbolList.map(async (rawSym) => {
      const nsSym = normalizeSymbol(rawSym);
      const cleanSym = nsSym.replace(".NS", "");

      try {
        const [quoteSummary, chartData] = await Promise.all([
          yahooFinance.quoteSummary(
            nsSym,
            {
              modules: [
                "price",
                "summaryDetail",
                "financialData",
                "defaultKeyStatistics",
                "assetProfile",
              ],
            },
            { validateResult: false }
          ),
          yahooFinance.chart(
            nsSym,
            {
              period1: oneYearAgo,
              interval: "1wk",
            },
            { validateResult: false }
          ).catch(() => null),
        ]);

        const price = quoteSummary?.price;
        const fin = quoteSummary?.financialData;
        const stats = quoteSummary?.defaultKeyStatistics;
        const summary = quoteSummary?.summaryDetail;
        const profile = quoteSummary?.assetProfile;

        const currentPrice = price?.regularMarketPrice || fin?.currentPrice || 0;
        const trailingPE = stats?.trailingPE || summary?.trailingPE || null;
        const sector = profile?.sector || "Other";
        const sectorMedianPE = getSectorMedianPE(sector);

        const pulseScore = calculatePulseScore({
          price: currentPrice,
          fiftyTwoWeekHigh: summary?.fiftyTwoWeekHigh || currentPrice * 1.1,
          fiftyTwoWeekLow: summary?.fiftyTwoWeekLow || currentPrice * 0.9,
          trailingPE,
          sectorMedianPE,
          financialData: fin,
          defaultKeyStatistics: stats,
          summaryDetail: summary,
        });

        // Calculate performance from chartData
        const quotes = (chartData?.quotes || []).filter((q) => q.close !== null && q.close !== undefined);
        let return1Y = null;
        let return6M = null;
        let return1M = null;
        const normalizedChart = [];

        if (quotes.length > 0) {
          const baseClose = quotes[0].close;
          quotes.forEach((q) => {
            const dateStr = new Date(q.date).toISOString().split("T")[0];
            normalizedChart.push({
              date: dateStr,
              value: Number(((q.close / baseClose) * 100).toFixed(2)),
            });
          });

          const latestClose = quotes[quotes.length - 1].close;
          if (baseClose > 0) return1Y = Number((((latestClose - baseClose) / baseClose) * 100).toFixed(2));

          const sixMonthIdx = Math.max(0, Math.floor(quotes.length / 2));
          const sixMonthClose = quotes[sixMonthIdx]?.close;
          if (sixMonthClose > 0) return6M = Number((((latestClose - sixMonthClose) / sixMonthClose) * 100).toFixed(2));

          const oneMonthIdx = Math.max(0, quotes.length - 5);
          const oneMonthClose = quotes[oneMonthIdx]?.close;
          if (oneMonthClose > 0) return1M = Number((((latestClose - oneMonthClose) / oneMonthClose) * 100).toFixed(2));
        }

        const roe = fin?.returnOnEquity ? Number((fin.returnOnEquity * 100).toFixed(2)) : null;
        const de = fin?.debtToEquity ? Number((fin.debtToEquity / 100).toFixed(2)) : null;

        return {
          symbol: cleanSym,
          name: price?.shortName || price?.longName || cleanSym,
          sector,
          industry: profile?.industry || "",
          price: currentPrice,
          change: price?.regularMarketChange || 0,
          changePercent: price?.regularMarketChangePercent ? Number((price.regularMarketChangePercent * 100).toFixed(2)) : 0,
          marketCap: price?.marketCap || 0,
          valuation: {
            pe: trailingPE ? Number(trailingPE.toFixed(2)) : null,
            forwardPE: stats?.forwardPE ? Number(stats.forwardPE.toFixed(2)) : null,
            pb: stats?.priceToBook ? Number(stats.priceToBook.toFixed(2)) : null,
            evToEbitda: stats?.enterpriseToEbitda ? Number(stats.enterpriseToEbitda.toFixed(2)) : null,
            dividendYield: summary?.dividendYield ? Number((summary.dividendYield * 100).toFixed(2)) : null,
            sectorMedianPE,
          },
          profitability: {
            roe,
            roa: fin?.returnOnAssets ? Number((fin.returnOnAssets * 100).toFixed(2)) : null,
            operatingMargin: fin?.operatingMargins ? Number((fin.operatingMargins * 100).toFixed(2)) : null,
            profitMargin: fin?.profitMargins ? Number((fin.profitMargins * 100).toFixed(2)) : null,
          },
          health: {
            debtToEquity: de,
            totalCash: fin?.totalCash || null,
            totalDebt: fin?.totalDebt || null,
            currentRatio: fin?.currentRatio ? Number(fin.currentRatio.toFixed(2)) : null,
          },
          pulseScore: {
            score: pulseScore.score,
            grade: pulseScore.grade,
          },
          returns: {
            return1M,
            return6M,
            return1Y,
          },
          chart: normalizedChart,
        };
      } catch (err) {
        console.warn(`[CompareController] Failed to fetch data for ${cleanSym}:`, err.message);
        return {
          symbol: cleanSym,
          name: cleanSym,
          sector: "Other",
          price: 0,
          error: "Data temporarily unavailable",
        };
      }
    });

    const results = await Promise.all(stockPromises);

    // Compute best in class highlights
    const highlights = {
      highestPulseScore: null,
      lowestPE: null,
      highestROE: null,
      lowestDebtToEquity: null,
      highest1YReturn: null,
    };

    let bestScore = -1;
    let bestPE = Infinity;
    let bestROE = -Infinity;
    let bestDE = Infinity;
    let bestRet = -Infinity;

    results.forEach((r) => {
      if (r.pulseScore?.score && r.pulseScore.score > bestScore) {
        bestScore = r.pulseScore.score;
        highlights.highestPulseScore = r.symbol;
      }
      if (r.valuation?.pe && r.valuation.pe > 0 && r.valuation.pe < bestPE) {
        bestPE = r.valuation.pe;
        highlights.lowestPE = r.symbol;
      }
      if (r.profitability?.roe && r.profitability.roe > bestROE) {
        bestROE = r.profitability.roe;
        highlights.highestROE = r.symbol;
      }
      if (r.health?.debtToEquity !== null && r.health?.debtToEquity !== undefined && r.health.debtToEquity < bestDE) {
        bestDE = r.health.debtToEquity;
        highlights.lowestDebtToEquity = r.symbol;
      }
      if (r.returns?.return1Y && r.returns.return1Y > bestRet) {
        bestRet = r.returns.return1Y;
        highlights.highest1YReturn = r.symbol;
      }
    });

    const payload = {
      stocks: results,
      highlights,
      symbols: symbolList,
      asOf: new Date().toISOString(),
    };

    setCache(cacheKey, payload, CACHE_TTL_MS);
    return res.status(200).json(payload);
  } catch (error) {
    console.error("[CompareController] Error:", error.message);
    return res.status(500).json({ message: "Failed to compare stocks" });
  }
};

module.exports = {
  compareStocks,
};
