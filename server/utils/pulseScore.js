// server/utils/pulseScore.js
// Long-Term Fundamental Hold Scoring Model (Coffee Can / Warren Buffett Quality Framework)

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

/**
 * Long-Term Fundamental Compounder PulseScore (0–100)
 * Evaluates businesses on multi-year compounding durability:
 *  - Pillar 1: Business Moat & Capital Efficiency (Max: 30.0 pts)
 *  - Pillar 2: Fortress Balance Sheet & Solvency (Max: 30.0 pts)
 *  - Pillar 3: Long-Term Value for Money & Entry Valuation (Max: 25.0 pts)
 *  - Pillar 4: Institutional Sponsorship & Dividend Shield (Max: 15.0 pts)
 */
function calculatePulseScore(data = {}, livePrice = null) {
  const assetProfile = data.assetProfile || {};
  const financialData = data.financialData || {};
  const defaultKeyStats = data.defaultKeyStatistics || {};
  const majorHolders = data.majorHolders || data.majorHoldersBreakdown || {};
  const summaryDetail = data.summaryDetail || {};
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
  // PILLAR 1: Business Moat & Capital Efficiency (Max 30.0 pts)
  // Warren Buffett #1 Rule: Can the company compound capital at high ROE with pricing power?
  // ─────────────────────────────────────────────────────────────
  let p1Points = 0;
  const p1Details = {};

  // 1. Return on Equity (ROE) (0–12p)
  let rawRoe = financialData.returnOnEquity ?? data.returnOnEquity ?? null;
  let roePct = null;
  let p1_roeScore = 5.0; // neutral fallback
  if (rawRoe !== null && !isNaN(rawRoe)) {
    rawRoe = Number(rawRoe);
    roePct = Math.abs(rawRoe) <= 1.5 ? rawRoe * 100 : rawRoe;
    if (roePct >= 22.0) p1_roeScore = 12.0;       // Elite Compounding (Buffett Standard)
    else if (roePct >= 16.0) p1_roeScore = 10.0;  // Strong Compounder
    else if (roePct >= 12.0) p1_roeScore = 7.0;   // Good
    else if (roePct >= 7.0) p1_roeScore = 4.0;    // Average
    else if (roePct >= 0.0) p1_roeScore = 1.5;    // Low return
    else p1_roeScore = 0.0;                       // Negative (Destroying capital)
  }
  p1Points += p1_roeScore;
  p1Details.returnOnEquity = {
    percent: roePct !== null ? Number(roePct.toFixed(2)) : null,
    score: p1_roeScore,
    maxScore: 12.0,
    label: "Return on Equity (ROE)",
  };

  // 2. Operating Profit Margin (Pricing Power / Moat Indicator) (0–10p)
  let rawOpMargin = financialData.operatingMargins ?? data.operatingMargins ?? null;
  let opMarginPct = null;
  let p1_opScore = 5.0;
  if (rawOpMargin !== null && !isNaN(rawOpMargin)) {
    rawOpMargin = Number(rawOpMargin);
    opMarginPct = Math.abs(rawOpMargin) <= 1.5 ? rawOpMargin * 100 : rawOpMargin;
    if (opMarginPct >= 22.0) p1_opScore = 10.0;   // High Pricing Power Moat
    else if (opMarginPct >= 15.0) p1_opScore = 8.0;
    else if (opMarginPct >= 9.0) p1_opScore = 5.5;
    else if (opMarginPct >= 4.0) p1_opScore = 3.0;
    else if (opMarginPct >= 0.0) p1_opScore = 1.0;
    else p1_opScore = 0.0;
  }
  p1Points += p1_opScore;
  p1Details.operatingMargin = {
    percent: opMarginPct !== null ? Number(opMarginPct.toFixed(2)) : null,
    score: p1_opScore,
    maxScore: 10.0,
    label: "Operating Profit Margin (Moat)",
  };

  // 3. Net Profit Margin & Cash Conversion (0–8p)
  let rawNpm = financialData.profitMargins ?? data.profitMargins ?? null;
  let npmPct = null;
  let p1_npmScore = 4.0;
  if (rawNpm !== null && !isNaN(rawNpm)) {
    rawNpm = Number(rawNpm);
    npmPct = Math.abs(rawNpm) <= 1.5 ? rawNpm * 100 : rawNpm;
    if (npmPct >= 16.0) p1_npmScore = 8.0;
    else if (npmPct >= 10.0) p1_npmScore = 6.5;
    else if (npmPct >= 5.0) p1_npmScore = 4.0;
    else if (npmPct >= 2.0) p1_npmScore = 2.0;
    else p1_npmScore = 0.0;
  }
  p1Points += p1_npmScore;
  p1Details.netProfitMargin = {
    percent: npmPct !== null ? Number(npmPct.toFixed(2)) : null,
    score: p1_npmScore,
    maxScore: 8.0,
    label: "Net Profit Margin",
  };

  // ─────────────────────────────────────────────────────────────
  // PILLAR 2: Fortress Balance Sheet & Solvency (Max 30.0 pts)
  // Coffee Can Rule: In the long term, debt kills. Low debt guarantees survival and compounding.
  // ─────────────────────────────────────────────────────────────
  let p2Points = 0;
  const p2Details = {};

  // 1. Debt-to-Equity (D/E) (0–14p)
  let rawDe = financialData.debtToEquity ?? data.debtToEquity ?? null;
  let deRatio = null;
  let p2_deScore = 7.0;

  if (isBankOrFinancial) {
    p2_deScore = 11.5; // Banks are evaluated on Tier-1 capital adequacy
    deRatio = rawDe !== null ? (rawDe > 5 ? rawDe / 100 : rawDe) : null;
  } else if (rawDe !== null && !isNaN(rawDe)) {
    rawDe = Number(rawDe);
    deRatio = rawDe > 5 ? rawDe / 100 : rawDe;
    if (deRatio <= 0.20) p2_deScore = 14.0;       // Fortress / Virtually Debt-Free
    else if (deRatio <= 0.50) p2_deScore = 11.5; // Very Low, Safe Leverage
    else if (deRatio <= 0.90) p2_deScore = 8.0;  // Manageable Leverage
    else if (deRatio <= 1.50) p2_deScore = 4.0;  // Elevated Debt
    else if (deRatio <= 2.20) p2_deScore = 1.5;  // High Debt Burden
    else p2_deScore = 0.0;                       // Severe Solvency Risk
  }
  p2Points += p2_deScore;
  p2Details.debtToEquity = {
    ratio: deRatio !== null ? Number(deRatio.toFixed(2)) : (isBankOrFinancial ? "N/A (Bank)" : null),
    score: p2_deScore,
    maxScore: 14.0,
    isBank: isBankOrFinancial,
    label: "Debt-to-Equity Solvency",
  };

  // 2. Promoter & Founder Skin-in-the-Game (0–9p)
  let rawInsiders = majorHolders.insidersPercentHeld ?? data.insidersPercentHeld ?? null;
  let promoterPct = null;
  let p2_insiderScore = 5.0;
  if (rawInsiders !== null && !isNaN(rawInsiders)) {
    rawInsiders = Number(rawInsiders);
    promoterPct = rawInsiders <= 1.0 ? rawInsiders * 100 : rawInsiders;
    if (promoterPct >= 55.0) p2_insiderScore = 9.0;       // Founders deeply committed
    else if (promoterPct >= 40.0) p2_insiderScore = 7.5;
    else if (promoterPct >= 25.0) p2_insiderScore = 5.0;
    else if (promoterPct >= 12.0) p2_insiderScore = 3.0;
    else p2_insiderScore = 1.0;
  }
  p2Points += p2_insiderScore;
  p2Details.promoterHolding = {
    percent: promoterPct !== null ? Number(promoterPct.toFixed(2)) : null,
    score: p2_insiderScore,
    maxScore: 9.0,
    label: "Promoter & Insider Alignment",
  };

  // 3. Price-to-Book (P/B) Asset Backing (0–7p)
  const rawPb = defaultKeyStats.priceToBook ?? data.priceToBook ?? null;
  let pbRatio = null;
  let p2_pbScore = 4.0;
  if (rawPb !== null && !isNaN(rawPb) && rawPb > 0) {
    pbRatio = Number(rawPb);
    if (pbRatio <= 2.0) p2_pbScore = 7.0;        // Strong Tangible Asset Support
    else if (pbRatio <= 4.5) p2_pbScore = 5.5;
    else if (pbRatio <= 9.0) p2_pbScore = 3.5;
    else if (pbRatio <= 15.0) p2_pbScore = 1.5;
    else p2_pbScore = 0.5;
  }
  p2Points += p2_pbScore;
  p2Details.priceToBook = {
    ratio: pbRatio !== null ? Number(pbRatio.toFixed(2)) : null,
    score: p2_pbScore,
    maxScore: 7.0,
    label: "Price-to-Book Asset Backing",
  };

  // ─────────────────────────────────────────────────────────────
  // PILLAR 3: Long-Term Value for Money & Entry Valuation (Max 25.0 pts)
  // Buying great businesses at a reasonable price (GARP + Margin of Safety)
  // ─────────────────────────────────────────────────────────────
  let p3Points = 0;
  const p3Details = {};

  // 1. Sector-Relative P/E (0–10p)
  const sectorMedian = getSectorMedianPE(sector);
  const trailingPE = Number(
    defaultKeyStats.trailingPE ||
    data.trailingPE ||
    data.pe ||
    0
  );

  let relativePE = null;
  let p3_peScore = 5.0; // fallback if missing
  if (trailingPE > 0 && sectorMedian > 0) {
    relativePE = trailingPE / sectorMedian;
    if (relativePE <= 0.75) p3_peScore = 10.0;      // Deep Long-Term Accumulation Discount
    else if (relativePE <= 0.95) p3_peScore = 8.5;  // Fair / Attractive Sector Value
    else if (relativePE <= 1.15) p3_peScore = 6.5;  // Reasonable Price for Quality
    else if (relativePE <= 1.40) p3_peScore = 4.0;  // Premium Valuation
    else if (relativePE <= 1.80) p3_peScore = 2.0;  // Stretched Premium
    else p3_peScore = 0.0;                          // Extreme Overvaluation
  }
  p3Points += p3_peScore;
  p3Details.sectorRelativePE = {
    value: relativePE ? Number(relativePE.toFixed(2)) : null,
    stockPE: trailingPE > 0 ? Number(trailingPE.toFixed(2)) : null,
    sectorMedianPE: sectorMedian,
    score: p3_peScore,
    maxScore: 10.0,
    label: "Sector-Relative P/E Entry Valuation",
  };

  // 2. Long-Term Intrinsic Margin of Safety (Analyst Target Upside) (0–8p)
  const targetMeanPrice = Number(
    financialData.targetMeanPrice || data.targetMeanPrice || 0
  );
  let upsidePct = null;
  let p3_upsideScore = 4.0;
  if (targetMeanPrice > 0 && price > 0) {
    upsidePct = ((targetMeanPrice - price) / price) * 100;
    if (upsidePct >= 30.0) p3_upsideScore = 8.0;    // High Margin of Safety
    else if (upsidePct >= 18.0) p3_upsideScore = 6.5;
    else if (upsidePct >= 8.0) p3_upsideScore = 4.5;
    else if (upsidePct >= 0.0) p3_upsideScore = 2.5;
    else p3_upsideScore = 0.0;
  }
  p3Points += p3_upsideScore;
  p3Details.targetUpside = {
    targetPrice: targetMeanPrice > 0 ? targetMeanPrice : null,
    livePrice: price > 0 ? price : null,
    upsidePercent: upsidePct !== null ? Number(upsidePct.toFixed(2)) : null,
    score: p3_upsideScore,
    maxScore: 8.0,
    label: "Analyst Intrinsic Margin of Safety",
  };

  // 3. PEG Ratio (Growth at a Reasonable Price) (0–7p)
  const peg = defaultKeyStats.pegRatio !== undefined && defaultKeyStats.pegRatio !== null
    ? Number(defaultKeyStats.pegRatio)
    : (data.pegRatio !== undefined && data.pegRatio !== null ? Number(data.pegRatio) : null);
  let p3_pegScore = 4.0;
  if (peg !== null && !isNaN(peg) && peg > 0) {
    if (peg <= 1.00) p3_pegScore = 7.0;             // Peter Lynch Golden Standard
    else if (peg <= 1.40) p3_pegScore = 5.5;
    else if (peg <= 1.90) p3_pegScore = 3.5;
    else if (peg <= 2.60) p3_pegScore = 1.5;
    else p3_pegScore = 0.0;
  }
  p3Points += p3_pegScore;
  p3Details.pegRatio = {
    value: peg !== null && !isNaN(peg) ? Number(peg.toFixed(2)) : null,
    score: p3_pegScore,
    maxScore: 7.0,
    label: "PEG Ratio (GARP)",
  };

  // ─────────────────────────────────────────────────────────────
  // PILLAR 4: Institutional Sponsorship & Dividend Shield (Max 15.0 pts)
  // Smart Money backing and cash dividend compounding
  // ─────────────────────────────────────────────────────────────
  let p4Points = 0;
  const p4Details = {};

  // 1. Institutional Ownership (FII + DII / Mutual Funds) (0–6p)
  let rawInst = majorHolders.institutionsPercentHeld ?? data.institutionsPercentHeld ?? null;
  let instPct = null;
  let p4_instScore = 3.5;
  if (rawInst !== null && !isNaN(rawInst)) {
    rawInst = Number(rawInst);
    instPct = rawInst <= 1.0 ? rawInst * 100 : rawInst;
    if (instPct >= 35.0) p4_instScore = 6.0;        // Strong Sovereign & Fund Backing
    else if (instPct >= 22.0) p4_instScore = 5.0;
    else if (instPct >= 12.0) p4_instScore = 3.5;
    else if (instPct >= 5.0) p4_instScore = 2.0;
    else p4_instScore = 1.0;
  }
  p4Points += p4_instScore;
  p4Details.institutionalHolding = {
    percent: instPct !== null ? Number(instPct.toFixed(2)) : null,
    score: p4_instScore,
    maxScore: 6.0,
    label: "Institutional Sponsorship (FII/DII)",
  };

  // 2. Dividend Yield Compounding (0–5p)
  let rawDiv = summaryDetail.dividendYield ?? financialData.dividendYield ?? data.dividendYield ?? null;
  let divPct = null;
  let p4_divScore = 2.0;
  if (rawDiv !== null && !isNaN(rawDiv)) {
    rawDiv = Number(rawDiv);
    if (rawDiv < 0.15) {
      divPct = rawDiv * 100;
    } else if (rawDiv <= 30) {
      divPct = rawDiv;
    } else {
      divPct = rawDiv / 100;
    }
    if (divPct >= 2.0) p4_divScore = 5.0;           // Generous Dividend Income
    else if (divPct >= 1.0) p4_divScore = 4.0;
    else if (divPct >= 0.3) p4_divScore = 2.5;
    else p4_divScore = 1.5;                         // Reinvesting for growth
  }
  p4Points += p4_divScore;
  p4Details.dividendYield = {
    percent: divPct !== null ? Number(divPct.toFixed(2)) : null,
    score: p4_divScore,
    maxScore: 5.0,
    label: "Dividend Compounding Yield",
  };

  // 3. Volatility Beta / Capital Defense Stability (0–4p)
  const rawBeta = defaultKeyStats.beta ?? data.beta ?? null;
  let betaVal = null;
  let p4_betaScore = 2.5;
  if (rawBeta !== null && !isNaN(rawBeta)) {
    betaVal = Number(rawBeta);
    if (betaVal >= 0.40 && betaVal <= 0.95) p4_betaScore = 4.0;   // Low Volatility Compounder
    else if (betaVal > 0.95 && betaVal <= 1.25) p4_betaScore = 3.0; // Market Normal
    else if (betaVal > 1.25 && betaVal <= 1.60) p4_betaScore = 1.5;
    else p4_betaScore = 0.5;                                        // High Speculative Volatility
  }
  p4Points += p4_betaScore;
  p4Details.beta = {
    value: betaVal !== null ? Number(betaVal.toFixed(2)) : null,
    score: p4_betaScore,
    maxScore: 4.0,
    label: "Capital Defense (Beta)",
  };

  // ─────────────────────────────────────────────────────────────
  // TOTAL SCORE & LONG-TERM INVESTMENT GRADE
  // ─────────────────────────────────────────────────────────────
  const totalScore = Math.max(0, Math.min(100, p1Points + p2Points + p3Points + p4Points));
  const roundedScore = Number(totalScore.toFixed(1));

  let grade = "D";
  let gradeLabel = "High Risk / Poor Long-Term Compounder";
  if (roundedScore >= 85.0) {
    grade = "A+";
    gradeLabel = "Elite Long-Term Compounder (Coffee Can Grade)";
  } else if (roundedScore >= 70.0) {
    grade = "A";
    gradeLabel = "Strong Fundamental Hold";
  } else if (roundedScore >= 52.0) {
    grade = "B";
    gradeLabel = "Moderate / Accumulate on Dips";
  } else if (roundedScore >= 38.0) {
    grade = "C";
    gradeLabel = "Selective / Cyclical";
  }

  return {
    score: roundedScore,
    grade,
    gradeLabel,
    modelType: "Long-Term Fundamental Hold",
    livePriceCoupled: price > 0,
    currentLivePrice: price,
    pillars: {
      pillar1_moat: {
        name: "Business Moat & Capital Efficiency",
        score: Number(p1Points.toFixed(1)),
        maxScore: 30.0,
        percentage: Number(((p1Points / 30.0) * 100).toFixed(1)),
        weightLabel: "30% Weight",
        details: p1Details,
      },
      pillar2_solvency: {
        name: "Fortress Balance Sheet & Solvency",
        score: Number(p2Points.toFixed(1)),
        maxScore: 30.0,
        percentage: Number(((p2Points / 30.0) * 100).toFixed(1)),
        weightLabel: "30% Weight",
        details: p2Details,
      },
      pillar3_valuation: {
        name: "Long-Term Value for Money & Entry Valuation",
        score: Number(p3Points.toFixed(1)),
        maxScore: 25.0,
        percentage: Number(((p3Points / 25.0) * 100).toFixed(1)),
        weightLabel: "25% Weight",
        details: p3Details,
      },
      pillar4_sponsorship: {
        name: "Institutional Sponsorship & Dividend Shield",
        score: Number(p4Points.toFixed(1)),
        maxScore: 15.0,
        percentage: Number(((p4Points / 15.0) * 100).toFixed(1)),
        weightLabel: "15% Weight",
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
