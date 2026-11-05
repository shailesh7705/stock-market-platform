// server/utils/pulseScore.js

const SECTOR_MEDIAN_PE = {
  "Consumer Defensive": 48.0,
  "FMCG": 48.0,
  "Healthcare": 34.0,
  "Pharmaceuticals": 34.0,
  "Technology": 26.0,
  "Information Technology": 26.0,
  "Consumer Cyclical": 22.5,
  "Automobile": 22.5,
  "Basic Materials": 25.0,
  "Chemicals": 25.0,
  "Industrials": 28.0,
  "Infrastructure": 28.0,
  "Financial Services": 16.5,
  "Banking": 16.5,
  "Utilities": 15.0,
  "Energy": 13.5,
  "Oil & Gas": 13.5,
  "Metals & Mining": 10.5,
  "Real Estate": 28.0,
  "Communication Services": 25.0,
  "Default": 22.0,
};

function getSectorMedianPE(sector) {
  if (!sector) return SECTOR_MEDIAN_PE["Default"];
  if (SECTOR_MEDIAN_PE[sector]) return SECTOR_MEDIAN_PE[sector];

  const sLower = sector.toLowerCase();
  for (const [key, val] of Object.entries(SECTOR_MEDIAN_PE)) {
    if (sLower.includes(key.toLowerCase()) || key.toLowerCase().includes(sLower)) {
      return val;
    }
  }
  return SECTOR_MEDIAN_PE["Default"];
}

function calculatePulseScore(data = {}, livePrice = null) {
  const assetProfile = data.assetProfile || {};
  const financialData = data.financialData || {};
  const defaultKeyStats = data.defaultKeyStatistics || {};
  const majorHolders = data.majorHolders || data.majorHoldersBreakdown || {};
  const trend = Array.isArray(data.recommendationTrend?.trend)
    ? data.recommendationTrend.trend[0]
    : data.recommendationTrend || {};

  const sector = assetProfile.sector || data.sector || "Default";
  const isBankOrFinancial =
    sector.toLowerCase().includes("bank") ||
    sector.toLowerCase().includes("financial") ||
    sector.toLowerCase().includes("insurance");

  // Determine current effective price
  const price = Number(livePrice || financialData.currentPrice || data.price || 0);

  // ─────────────────────────────────────────────────────────────
  // PILLAR 1: Valuation & Margin of Safety (Max 25.0 pts)
  // ─────────────────────────────────────────────────────────────
  let p1Points = 0;
  const p1Details = {};

  // 1. Sector-Relative P/E (0-8p)
  const sectorMedian = getSectorMedianPE(sector);
  const trailingPE = Number(
    defaultKeyStats.trailingPE ||
    data.trailingPE ||
    data.pe ||
    0
  );

  let relativePE = null;
  let p1_peScore = 4.0; // fallback if missing
  if (trailingPE > 0 && sectorMedian > 0) {
    relativePE = trailingPE / sectorMedian;
    if (relativePE <= 0.70) p1_peScore = 8.0;
    else if (relativePE <= 0.90) p1_peScore = 7.0;
    else if (relativePE <= 1.10) p1_peScore = 5.5;
    else if (relativePE <= 1.35) p1_peScore = 3.5;
    else if (relativePE <= 1.75) p1_peScore = 1.5;
    else p1_peScore = 0.0;
  }
  p1Points += p1_peScore;
  p1Details.sectorRelativePE = {
    value: relativePE ? Number(relativePE.toFixed(2)) : null,
    stockPE: trailingPE > 0 ? Number(trailingPE.toFixed(2)) : null,
    sectorMedianPE: sectorMedian,
    score: p1_peScore,
    maxScore: 8.0,
  };

  // 2. Target Price Upside % (0-9p)
  const targetMeanPrice = Number(
    financialData.targetMeanPrice || data.targetMeanPrice || 0
  );
  let upsidePct = null;
  let p1_upsideScore = 4.5; // fallback
  if (targetMeanPrice > 0 && price > 0) {
    upsidePct = ((targetMeanPrice - price) / price) * 100;
    if (upsidePct >= 35.0) p1_upsideScore = 9.0;
    else if (upsidePct >= 22.0) p1_upsideScore = 7.5;
    else if (upsidePct >= 12.0) p1_upsideScore = 5.5;
    else if (upsidePct >= 4.0) p1_upsideScore = 3.5;
    else if (upsidePct >= 0.0) p1_upsideScore = 1.5;
    else p1_upsideScore = 0.0;
  }
  p1Points += p1_upsideScore;
  p1Details.targetUpside = {
    targetPrice: targetMeanPrice > 0 ? targetMeanPrice : null,
    livePrice: price > 0 ? price : null,
    upsidePercent: upsidePct !== null ? Number(upsidePct.toFixed(2)) : null,
    score: p1_upsideScore,
    maxScore: 9.0,
  };

  // 3. PEG Ratio (0-8p)
  const peg = defaultKeyStats.pegRatio !== undefined && defaultKeyStats.pegRatio !== null
    ? Number(defaultKeyStats.pegRatio)
    : (data.pegRatio !== undefined && data.pegRatio !== null ? Number(data.pegRatio) : null);
  let p1_pegScore = 5.0; // Fallback: 5.0
  if (peg !== null && !isNaN(peg) && peg > 0) {
    if (peg <= 0.90) p1_pegScore = 8.0;
    else if (peg <= 1.25) p1_pegScore = 6.5;
    else if (peg <= 1.75) p1_pegScore = 4.5;
    else if (peg <= 2.50) p1_pegScore = 2.0;
    else p1_pegScore = 0.0;
  }
  p1Points += p1_pegScore;
  p1Details.pegRatio = {
    value: peg !== null && !isNaN(peg) ? Number(peg.toFixed(2)) : null,
    score: p1_pegScore,
    maxScore: 8.0,
  };

  // ─────────────────────────────────────────────────────────────
  // PILLAR 2: Capital Efficiency & Moat (Max 25.0 pts)
  // ─────────────────────────────────────────────────────────────
  let p2Points = 0;
  const p2Details = {};

  // 1. ROE (0-10p)
  let rawRoe = financialData.returnOnEquity ?? data.returnOnEquity ?? null;
  let roePct = null;
  let p2_roeScore = 4.0;
  if (rawRoe !== null && !isNaN(rawRoe)) {
    rawRoe = Number(rawRoe);
    roePct = Math.abs(rawRoe) <= 1.5 ? rawRoe * 100 : rawRoe;
    if (roePct >= 22.0) p2_roeScore = 10.0;
    else if (roePct >= 16.0) p2_roeScore = 8.5;
    else if (roePct >= 11.0) p2_roeScore = 6.0;
    else if (roePct >= 6.0) p2_roeScore = 3.5;
    else if (roePct >= 0.0) p2_roeScore = 1.0;
    else p2_roeScore = 0.0;
  }
  p2Points += p2_roeScore;
  p2Details.returnOnEquity = {
    percent: roePct !== null ? Number(roePct.toFixed(2)) : null,
    score: p2_roeScore,
    maxScore: 10.0,
  };

  // 2. Operating Margin (0-8p)
  let rawOpMargin = financialData.operatingMargins ?? data.operatingMargins ?? null;
  let opMarginPct = null;
  let p2_opScore = 4.0;
  if (rawOpMargin !== null && !isNaN(rawOpMargin)) {
    rawOpMargin = Number(rawOpMargin);
    opMarginPct = Math.abs(rawOpMargin) <= 1.5 ? rawOpMargin * 100 : rawOpMargin;
    if (opMarginPct >= 24.0) p2_opScore = 8.0;
    else if (opMarginPct >= 16.0) p2_opScore = 6.5;
    else if (opMarginPct >= 9.0) p2_opScore = 4.5;
    else if (opMarginPct >= 3.0) p2_opScore = 2.5;
    else if (opMarginPct >= 0.0) p2_opScore = 1.0;
    else p2_opScore = 0.0;
  }
  p2Points += p2_opScore;
  p2Details.operatingMargin = {
    percent: opMarginPct !== null ? Number(opMarginPct.toFixed(2)) : null,
    score: p2_opScore,
    maxScore: 8.0,
  };

  // 3. Net Profit Margin (0-7p)
  let rawNpm = financialData.profitMargins ?? data.profitMargins ?? null;
  let npmPct = null;
  let p2_npmScore = 3.5;
  if (rawNpm !== null && !isNaN(rawNpm)) {
    rawNpm = Number(rawNpm);
    npmPct = Math.abs(rawNpm) <= 1.5 ? rawNpm * 100 : rawNpm;
    if (npmPct >= 18.0) p2_npmScore = 7.0;
    else if (npmPct >= 11.0) p2_npmScore = 5.5;
    else if (npmPct >= 5.0) p2_npmScore = 3.5;
    else if (npmPct >= 1.0) p2_npmScore = 1.5;
    else p2_npmScore = 0.0;
  }
  p2Points += p2_npmScore;
  p2Details.netProfitMargin = {
    percent: npmPct !== null ? Number(npmPct.toFixed(2)) : null,
    score: p2_npmScore,
    maxScore: 7.0,
  };

  // ─────────────────────────────────────────────────────────────
  // PILLAR 3: Balance Sheet Solvency & Insider Alignment (Max 25.0 pts)
  // ─────────────────────────────────────────────────────────────
  let p3Points = 0;
  const p3Details = {};

  // 1. Debt-to-Equity (0-10p)
  let rawDe = financialData.debtToEquity ?? data.debtToEquity ?? null;
  let deRatio = null;
  let p3_deScore = 5.0;

  if (isBankOrFinancial) {
    p3_deScore = 8.5; // Banks: 8.5
    deRatio = rawDe !== null ? (rawDe > 5 ? rawDe / 100 : rawDe) : null;
  } else if (rawDe !== null && !isNaN(rawDe)) {
    rawDe = Number(rawDe);
    deRatio = rawDe > 5 ? rawDe / 100 : rawDe; // Yahoo returns e.g. 44.3 for 0.443 ratio
    if (deRatio <= 0.15) p3_deScore = 10.0;
    else if (deRatio <= 0.50) p3_deScore = 8.5;
    else if (deRatio <= 1.00) p3_deScore = 6.0;
    else if (deRatio <= 1.80) p3_deScore = 3.0;
    else if (deRatio <= 2.60) p3_deScore = 1.0;
    else p3_deScore = 0.0;
  }
  p3Points += p3_deScore;
  p3Details.debtToEquity = {
    ratio: deRatio !== null ? Number(deRatio.toFixed(2)) : (isBankOrFinancial ? "N/A (Bank)" : null),
    score: p3_deScore,
    maxScore: 10.0,
    isBank: isBankOrFinancial,
  };

  // 2. Promoter Holding % (0-8p)
  let rawInsiders = majorHolders.insidersPercentHeld ?? data.insidersPercentHeld ?? null;
  let promoterPct = null;
  let p3_insiderScore = 4.0;
  if (rawInsiders !== null && !isNaN(rawInsiders)) {
    rawInsiders = Number(rawInsiders);
    promoterPct = rawInsiders <= 1.0 ? rawInsiders * 100 : rawInsiders;
    if (promoterPct >= 55.0) p3_insiderScore = 8.0;
    else if (promoterPct >= 40.0) p3_insiderScore = 6.5;
    else if (promoterPct >= 25.0) p3_insiderScore = 4.5;
    else if (promoterPct >= 12.0) p3_insiderScore = 2.5;
    else p3_insiderScore = 1.0;
  }
  p3Points += p3_insiderScore;
  p3Details.promoterHolding = {
    percent: promoterPct !== null ? Number(promoterPct.toFixed(2)) : null,
    score: p3_insiderScore,
    maxScore: 8.0,
  };

  // 3. Price-to-Book (0-7p)
  const rawPb = defaultKeyStats.priceToBook ?? data.priceToBook ?? null;
  let pbRatio = null;
  let p3_pbScore = 3.5;
  if (rawPb !== null && !isNaN(rawPb) && rawPb > 0) {
    pbRatio = Number(rawPb);
    if (pbRatio <= 1.80) p3_pbScore = 7.0;
    else if (pbRatio <= 3.50) p3_pbScore = 5.5;
    else if (pbRatio <= 7.00) p3_pbScore = 3.5;
    else if (pbRatio <= 14.00) p3_pbScore = 1.5;
    else p3_pbScore = 0.5;
  }
  p3Points += p3_pbScore;
  p3Details.priceToBook = {
    ratio: pbRatio !== null ? Number(pbRatio.toFixed(2)) : null,
    score: p3_pbScore,
    maxScore: 7.0,
  };

  // ─────────────────────────────────────────────────────────────
  // PILLAR 4: Institutional Sponsorship & Volatility (Max 25.0 pts)
  // ─────────────────────────────────────────────────────────────
  let p4Points = 0;
  const p4Details = {};

  // 1. Analyst Buy Ratio (0-10p)
  const strongBuy = Number(trend.strongBuy || 0);
  const buy = Number(trend.buy || 0);
  const hold = Number(trend.hold || 0);
  const sell = Number(trend.sell || 0);
  const strongSell = Number(trend.strongSell || 0);
  const totalRatings = strongBuy + buy + hold + sell + strongSell;

  let buyRatioPct = null;
  let p4_buyRatioScore = 5.5; // fallback
  if (totalRatings > 0) {
    buyRatioPct = ((strongBuy + buy) / totalRatings) * 100;
    if (buyRatioPct >= 80.0) p4_buyRatioScore = 10.0;
    else if (buyRatioPct >= 65.0) p4_buyRatioScore = 8.0;
    else if (buyRatioPct >= 50.0) p4_buyRatioScore = 5.5;
    else if (buyRatioPct >= 35.0) p4_buyRatioScore = 3.0;
    else p4_buyRatioScore = 0.0;
  }
  p4Points += p4_buyRatioScore;
  p4Details.analystBuyRatio = {
    percent: buyRatioPct !== null ? Number(buyRatioPct.toFixed(2)) : null,
    strongBuy,
    buy,
    hold,
    sell,
    strongSell,
    totalRatings,
    score: p4_buyRatioScore,
    maxScore: 10.0,
  };

  // 2. Institutional Holding % (0-8p)
  let rawInst = majorHolders.institutionsPercentHeld ?? data.institutionsPercentHeld ?? null;
  let instPct = null;
  let p4_instScore = 4.0;
  if (rawInst !== null && !isNaN(rawInst)) {
    rawInst = Number(rawInst);
    instPct = rawInst <= 1.0 ? rawInst * 100 : rawInst;
    if (instPct >= 35.0) p4_instScore = 8.0;
    else if (instPct >= 24.0) p4_instScore = 6.5;
    else if (instPct >= 14.0) p4_instScore = 4.5;
    else if (instPct >= 6.0) p4_instScore = 2.5;
    else p4_instScore = 1.0;
  }
  p4Points += p4_instScore;
  p4Details.institutionalHolding = {
    percent: instPct !== null ? Number(instPct.toFixed(2)) : null,
    score: p4_instScore,
    maxScore: 8.0,
  };

  // 3. Beta (0-7p)
  const rawBeta = defaultKeyStats.beta ?? data.beta ?? null;
  let betaVal = null;
  let p4_betaScore = 4.5;
  if (rawBeta !== null && !isNaN(rawBeta)) {
    betaVal = Number(rawBeta);
    if (betaVal >= 0.65 && betaVal <= 1.05) p4_betaScore = 7.0;
    else if (betaVal > 1.05 && betaVal <= 1.30) p4_betaScore = 5.5;
    else if (betaVal >= 0.35 && betaVal < 0.65) p4_betaScore = 4.5;
    else if (betaVal > 1.30 && betaVal <= 1.70) p4_betaScore = 2.5;
    else p4_betaScore = 1.0;
  }
  p4Points += p4_betaScore;
  p4Details.beta = {
    value: betaVal !== null ? Number(betaVal.toFixed(2)) : null,
    score: p4_betaScore,
    maxScore: 7.0,
  };

  // ─────────────────────────────────────────────────────────────
  // TOTAL SCORE & LETTER GRADE
  // ─────────────────────────────────────────────────────────────
  const totalScore = Math.max(0, Math.min(100, p1Points + p2Points + p3Points + p4Points));
  const roundedScore = Number(totalScore.toFixed(1));

  let grade = "D";
  if (roundedScore >= 85.0) grade = "A+";
  else if (roundedScore >= 70.0) grade = "A";
  else if (roundedScore >= 55.0) grade = "B";
  else if (roundedScore >= 40.0) grade = "C";

  return {
    score: roundedScore,
    grade,
    livePriceCoupled: price > 0,
    currentLivePrice: price,
    pillars: {
      pillar1_valuation: {
        name: "Valuation & Margin of Safety",
        score: Number(p1Points.toFixed(1)),
        maxScore: 25.0,
        percentage: Number(((p1Points / 25.0) * 100).toFixed(1)),
        details: p1Details,
      },
      pillar2_profitability: {
        name: "Capital Efficiency & Moat",
        score: Number(p2Points.toFixed(1)),
        maxScore: 25.0,
        percentage: Number(((p2Points / 25.0) * 100).toFixed(1)),
        details: p2Details,
      },
      pillar3_solvency: {
        name: "Balance Sheet Solvency & Insider Alignment",
        score: Number(p3Points.toFixed(1)),
        maxScore: 25.0,
        percentage: Number(((p3Points / 25.0) * 100).toFixed(1)),
        details: p3Details,
      },
      pillar4_institutional: {
        name: "Institutional Sponsorship & Volatility",
        score: Number(p4Points.toFixed(1)),
        maxScore: 25.0,
        percentage: Number(((p4Points / 25.0) * 100).toFixed(1)),
        details: p4Details,
      },
    },
  };
}

module.exports = {
  SECTOR_MEDIAN_PE,
  getSectorMedianPE,
  calculatePulseScore,
};
