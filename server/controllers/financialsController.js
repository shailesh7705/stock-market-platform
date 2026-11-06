// server/controllers/financialsController.js
const YahooFinance = require("yahoo-finance2").default;
const yahooFinance = new YahooFinance({ suppressNotices: ["yahooSurvey"] });
const { getCache, setCache } = require("../utils/memoryCache");

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function normalizeSymbol(sym = "") {
  const clean = String(sym).trim().toUpperCase();
  if (clean.includes(".")) return clean;
  return `${clean}.NS`;
}

function calculateCagr(startVal, endVal, years) {
  if (!startVal || !endVal || startVal <= 0 || endVal <= 0 || years <= 0) return null;
  return Number(((Math.pow(endVal / startVal, 1 / years) - 1) * 100).toFixed(2));
}

function calculateGrowth(current, previous) {
  if (previous === null || previous === undefined || previous === 0 || current === null || current === undefined) {
    return null;
  }
  return Number((((current - previous) / Math.abs(previous)) * 100).toFixed(2));
}

/**
 * GET /api/stocks/:symbol/financials?period=quarterly|annual
 */
const getFinancials = async (req, res) => {
  try {
    const { symbol } = req.params;
    const period = req.query.period === "quarterly" ? "quarterly" : "annual";

    if (!symbol) {
      return res.status(400).json({ message: "Symbol is required" });
    }

    const nsSymbol = normalizeSymbol(symbol);
    const cacheKey = `financials:${nsSymbol}:${period}`;
    const cached = getCache(cacheKey);
    if (cached) {
      return res.status(200).json(cached);
    }

    const isQuarterly = period === "quarterly";

    // Modules for Yahoo Finance
    const modules = isQuarterly
      ? ["incomeStatementHistoryQuarterly", "balanceSheetHistoryQuarterly", "cashflowStatementHistoryQuarterly", "financialData", "defaultKeyStatistics"]
      : ["incomeStatementHistory", "balanceSheetHistory", "cashflowStatementHistory", "financialData", "defaultKeyStatistics"];

    let summary;
    try {
      summary = await yahooFinance.quoteSummary(nsSymbol, { modules }, { validateResult: false });
    } catch (err) {
      // If .NS fails and no exchange suffix was passed, fallback or return 404
      if (err.message && err.message.includes("No data found")) {
        return res.status(404).json({ message: `No financial data found for ${symbol}` });
      }
      throw err;
    }

    if (!summary) {
      return res.status(404).json({ message: `No financial data found for ${symbol}` });
    }

    const incomeRaw = isQuarterly
      ? summary.incomeStatementHistoryQuarterly?.incomeStatementHistory || []
      : summary.incomeStatementHistory?.incomeStatementHistory || [];

    const balanceRaw = isQuarterly
      ? summary.balanceSheetHistoryQuarterly?.balanceSheetStatements || []
      : summary.balanceSheetHistory?.balanceSheetStatements || [];

    const cashflowRaw = isQuarterly
      ? summary.cashflowStatementHistoryQuarterly?.cashflowStatements || []
      : summary.cashflowStatementHistory?.cashflowStatements || [];

    // Format Income Statements chronologically (oldest to newest for charting)
    const incomeStatements = incomeRaw
      .map((item) => {
        const rev = item.totalRevenue ?? item.operatingRevenue ?? null;
        const netInc = item.netIncome ?? item.netIncomeApplicableToCommonShares ?? null;
        const opInc = item.operatingIncome ?? null;
        const ebit = item.ebit ?? opInc ?? null;

        return {
          endDate: item.endDate ? new Date(item.endDate).toISOString().split("T")[0] : null,
          year: item.endDate ? new Date(item.endDate).getFullYear() : null,
          totalRevenue: rev,
          costOfRevenue: item.costOfRevenue ?? null,
          grossProfit: item.grossProfit ?? null,
          operatingExpense: item.totalOperatingExpenses ?? null,
          operatingIncome: opInc,
          ebitda: item.ebitda ?? (ebit && item.depreciation ? ebit + item.depreciation : null),
          ebit: ebit,
          interestExpense: item.interestExpense ?? null,
          incomeBeforeTax: item.incomeBeforeTax ?? null,
          incomeTaxExpense: item.incomeTaxExpense ?? null,
          netIncome: netInc,
          eps: item.dilutedEPS ?? item.basicEPS ?? null,
          operatingMargin: rev && opInc ? Number(((opInc / rev) * 100).toFixed(2)) : null,
          netMargin: rev && netInc ? Number(((netInc / rev) * 100).toFixed(2)) : null,
        };
      })
      .reverse();

    // Format Balance Sheets
    const balanceSheets = balanceRaw
      .map((item) => {
        const totAssets = item.totalAssets ?? null;
        const curLiab = item.totalCurrentLiabilities ?? null;
        const totDebt = item.shortLongTermDebt ?? (item.longTermDebt ? item.longTermDebt + (item.shortTermDebt || 0) : null);
        const equity = item.totalStockholderEquity ?? item.commonStockEquity ?? null;

        return {
          endDate: item.endDate ? new Date(item.endDate).toISOString().split("T")[0] : null,
          year: item.endDate ? new Date(item.endDate).getFullYear() : null,
          totalAssets: totAssets,
          totalCurrentAssets: item.totalCurrentAssets ?? null,
          cash: item.cash ?? item.cashAndCashEquivalents ?? null,
          inventory: item.inventory ?? null,
          netReceivables: item.netReceivables ?? null,
          totalLiabilities: item.totalLiab ?? null,
          totalCurrentLiabilities: curLiab,
          totalDebt: totDebt,
          longTermDebt: item.longTermDebt ?? null,
          stockholderEquity: equity,
          capitalSurplus: item.capitalSurplus ?? null,
          retainedEarnings: item.retainedEarnings ?? null,
          debtToEquity: equity && totDebt ? Number((totDebt / equity).toFixed(2)) : null,
        };
      })
      .reverse();

    // Format Cash Flow
    const cashFlowStatements = cashflowRaw
      .map((item) => {
        const cfo = item.totalCashFromOperatingActivities ?? null;
        const capex = item.capitalExpenditures ? Math.abs(item.capitalExpenditures) : null;
        const fcf = cfo !== null && capex !== null ? cfo - capex : null;

        return {
          endDate: item.endDate ? new Date(item.endDate).toISOString().split("T")[0] : null,
          year: item.endDate ? new Date(item.endDate).getFullYear() : null,
          operatingCashFlow: cfo,
          capitalExpenditures: capex,
          freeCashFlow: fcf,
          investingCashFlow: item.totalCashflowsFromInvestingActivities ?? null,
          financingCashFlow: item.totalCashFromFinancingActivities ?? null,
          dividendsPaid: item.dividendsPaid ? Math.abs(item.dividendsPaid) : null,
          netChangeInCash: item.changeInCashAndCashEquivalents ?? null,
        };
      })
      .reverse();

    // Compute YoY growth arrays
    for (let i = 1; i < incomeStatements.length; i++) {
      const prev = incomeStatements[i - 1];
      const curr = incomeStatements[i];
      curr.revenueGrowth = calculateGrowth(curr.totalRevenue, prev.totalRevenue);
      curr.netIncomeGrowth = calculateGrowth(curr.netIncome, prev.netIncome);
      curr.operatingIncomeGrowth = calculateGrowth(curr.operatingIncome, prev.operatingIncome);
    }

    // Compute ROCE (Return on Capital Employed) properly
    // ROCE = EBIT / Capital Employed = EBIT / (Total Assets - Current Liabilities)
    const latestIncome = incomeStatements[incomeStatements.length - 1];
    const latestBalance = balanceSheets[balanceSheets.length - 1];
    let computedRoce = null;
    if (latestIncome?.ebit && latestBalance?.totalAssets && latestBalance?.totalCurrentLiabilities) {
      const capitalEmployed = latestBalance.totalAssets - latestBalance.totalCurrentLiabilities;
      if (capitalEmployed > 0) {
        computedRoce = Number(((latestIncome.ebit / capitalEmployed) * 100).toFixed(2));
      }
    }

    // CAGR Calculations for annual statements
    let cagr3YRevenue = null;
    let cagr5YRevenue = null;
    let cagr3YNetIncome = null;
    let cagr5YNetIncome = null;

    if (!isQuarterly && incomeStatements.length >= 4) {
      const n = incomeStatements.length;
      cagr3YRevenue = calculateCagr(incomeStatements[n - 4]?.totalRevenue, incomeStatements[n - 1]?.totalRevenue, 3);
      cagr3YNetIncome = calculateCagr(incomeStatements[n - 4]?.netIncome, incomeStatements[n - 1]?.netIncome, 3);

      if (incomeStatements.length >= 6) {
        cagr5YRevenue = calculateCagr(incomeStatements[n - 6]?.totalRevenue, incomeStatements[n - 1]?.totalRevenue, 5);
        cagr5YNetIncome = calculateCagr(incomeStatements[n - 6]?.netIncome, incomeStatements[n - 1]?.netIncome, 5);
      }
    }

    const payload = {
      symbol: nsSymbol,
      period,
      currency: "INR",
      incomeStatements,
      balanceSheets,
      cashFlowStatements,
      summary: {
        roce: computedRoce,
        roe: summary.financialData?.returnOnEquity ? Number((summary.financialData.returnOnEquity * 100).toFixed(2)) : null,
        debtToEquity: summary.financialData?.debtToEquity ? Number((summary.financialData.debtToEquity / 100).toFixed(2)) : null,
        operatingMargin: summary.financialData?.operatingMargins ? Number((summary.financialData.operatingMargins * 100).toFixed(2)) : null,
        profitMargin: summary.financialData?.profitMargins ? Number((summary.financialData.profitMargins * 100).toFixed(2)) : null,
        cagr3YRevenue,
        cagr5YRevenue,
        cagr3YNetIncome,
        cagr5YNetIncome,
      },
      lastUpdated: new Date().toISOString(),
    };

    setCache(cacheKey, payload, CACHE_TTL_MS);
    return res.status(200).json(payload);
  } catch (error) {
    console.error("[FinancialsController] Error:", error.message);
    return res.status(500).json({ message: "Failed to retrieve financial statements" });
  }
};

module.exports = {
  getFinancials,
};
