// client/src/components/stocks/StockDossier.jsx
import React, { useState, useMemo } from "react";
import Card from "../ui/Card";
import {
  Award,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  Target,
  PieChart,
  Building2,
  Globe,
  Users,
  BarChart2,
  Gauge,
  Zap,
  AlertTriangle,
  CheckCircle2,
  Activity,
  Sparkles,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { calculatePulseScore } from "../../utils/pulseScore";

function formatIndianNumber(val) {
  if (val === null || val === undefined || isNaN(val)) return "—";
  const num = Number(val);
  if (num >= 10000000) {
    const cr = num / 10000000;
    if (cr >= 100000) return `₹${(cr / 100000).toFixed(2)} Lakh Cr`;
    return `₹${cr.toFixed(2)} Cr`;
  }
  if (num >= 100000) return `₹${(num / 100000).toFixed(2)} L`;
  return `₹${num.toLocaleString("en-IN")}`;
}

function getGradeColor(grade) {
  switch (grade) {
    case "A+":
      return {
        text: "text-emerald-400",
        bg: "bg-emerald-500/15",
        border: "border-emerald-500/30",
        stroke: "#10b981",
        glow: "shadow-emerald-500/20",
      };
    case "A":
      return {
        text: "text-teal-400",
        bg: "bg-teal-500/15",
        border: "border-teal-500/30",
        stroke: "#14b8a6",
        glow: "shadow-teal-500/20",
      };
    case "B":
      return {
        text: "text-blue-400",
        bg: "bg-blue-500/15",
        border: "border-blue-500/30",
        stroke: "#3b82f6",
        glow: "shadow-blue-500/20",
      };
    case "C":
      return {
        text: "text-amber-400",
        bg: "bg-amber-500/15",
        border: "border-amber-500/30",
        stroke: "#f59e0b",
        glow: "shadow-amber-500/20",
      };
    default:
      return {
        text: "text-rose-400",
        bg: "bg-rose-500/15",
        border: "border-rose-500/30",
        stroke: "#f43f5e",
        glow: "shadow-rose-500/20",
      };
  }
}

export default function StockDossier({ details, livePrice }) {
  const [showFullSummary, setShowFullSummary] = useState(false);

  // Recalculate pulse score if live price moves or use server computed
  const pulseScore = useMemo(() => {
    if (!details) return null;
    const currentPrice = livePrice || details.price || 0;
    return calculatePulseScore(details, currentPrice);
  }, [details, livePrice]);

  if (!details) return null;

  const {
    assetProfile = {},
    financialData = {},
    defaultKeyStatistics = {},
    majorHolders = {},
    recommendationTrend = {},
    valuation = {},
  } = details;

  const currentPrice = Number(livePrice || details.price || 0);
  const gradeColor = getGradeColor(pulseScore?.grade || "B");

  // Analyst consensus details
  const targetMean = financialData.targetMeanPrice || null;
  const targetHigh = financialData.targetHighPrice || null;
  const targetLow = financialData.targetLowPrice || null;
  let targetUpside = null;
  if (targetMean && currentPrice > 0) {
    targetUpside = Number((((targetMean - currentPrice) / currentPrice) * 100).toFixed(1));
  }

  const {
    strongBuy = 0,
    buy = 0,
    hold = 0,
    sell = 0,
    strongSell = 0,
  } = recommendationTrend;
  const totalRatings = strongBuy + buy + hold + sell + strongSell;
  const strongBuyPct = totalRatings > 0 ? (strongBuy / totalRatings) * 100 : 0;
  const buyPct = totalRatings > 0 ? (buy / totalRatings) * 100 : 0;
  const holdPct = totalRatings > 0 ? (hold / totalRatings) * 100 : 0;
  const sellPct = totalRatings > 0 ? (sell / totalRatings) * 100 : 0;
  const strongSellPct = totalRatings > 0 ? (strongSell / totalRatings) * 100 : 0;

  // Valuation details
  const stockPE = valuation.stockPE || defaultKeyStatistics.trailingPE || null;
  const sectorPE = valuation.sectorMedianPE || 22.0;
  const relativePE = valuation.sectorRelativePE || (stockPE && sectorPE ? Number((stockPE / sectorPE).toFixed(2)) : null);
  const discountPremium = valuation.discountPremiumPct;

  // Valuation slider marker clamped between 0.4x and 2.0x for UI rendering (0% to 100%)
  const minSlider = 0.4;
  const maxSlider = 2.0;
  const sliderPosition = relativePE
    ? Math.max(0, Math.min(100, ((relativePE - minSlider) / (maxSlider - minSlider)) * 100))
    : 50;

  // Ownership breakdown
  const promoter = majorHolders.insidersPercentHeld ?? null;
  const institutional = majorHolders.institutionsPercentHeld ?? null;
  const retail = majorHolders.retailFloatPercent ?? (
    promoter !== null && institutional !== null
      ? Math.max(0, 100 - (promoter + institutional))
      : null
  );

  // Solvency & efficiency metrics
  const deRaw = financialData.debtToEquity;
  const isBank = assetProfile.sector?.toLowerCase().includes("bank") || assetProfile.sector?.toLowerCase().includes("financial");
  const de = isBank ? "Bank / Capital Model" : (deRaw !== null && deRaw !== undefined ? (deRaw > 5 ? (deRaw / 100).toFixed(2) : Number(deRaw).toFixed(2)) : "—");
  const roe = financialData.returnOnEquity !== null && financialData.returnOnEquity !== undefined
    ? `${(Math.abs(financialData.returnOnEquity) <= 1.5 ? financialData.returnOnEquity * 100 : financialData.returnOnEquity).toFixed(1)}%`
    : "—";
  const opMargin = financialData.operatingMargins !== null && financialData.operatingMargins !== undefined
    ? `${(Math.abs(financialData.operatingMargins) <= 1.5 ? financialData.operatingMargins * 100 : financialData.operatingMargins).toFixed(1)}%`
    : "—";
  const netMargin = financialData.profitMargins !== null && financialData.profitMargins !== undefined
    ? `${(Math.abs(financialData.profitMargins) <= 1.5 ? financialData.profitMargins * 100 : financialData.profitMargins).toFixed(1)}%`
    : "—";
  const beta = defaultKeyStatistics.beta !== null && defaultKeyStatistics.beta !== undefined ? Number(defaultKeyStatistics.beta).toFixed(2) : "—";
  const bookValue = defaultKeyStatistics.bookValue !== null && defaultKeyStatistics.bookValue !== undefined ? `₹${Number(defaultKeyStatistics.bookValue).toFixed(2)}` : "—";

  // SVG Gauge calculations
  const scoreVal = pulseScore?.score || 0;
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (scoreVal / 100) * circumference;

  return (
    <div className="space-y-6">
      {/* ── Section Title ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-400 flex items-center justify-center text-black font-extrabold shadow-md shadow-emerald-500/20">
            <Zap size={18} />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
              Institutional Intelligence Engine
              <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                100-Point PulseScore™
              </span>
            </h2>
            <p className="text-xs text-gray-400">
              Multi-pillar fundamental screening, sector-relative valuation, and analyst consensus analytics.
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-gray-400 bg-[#0e1626] border border-white/10 px-3 py-1.5 rounded-xl">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Coupled with NSE LTP</span>
        </div>
      </div>

      {/* ── 1. PulseScore Header Badge & Radar Card ── */}
      <Card className="bg-gradient-to-br from-[#0e1626] via-[#09101d] to-[#0b1424] border border-white/10 p-6 md:p-8 rounded-3xl relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
          {/* Radial Circular Gauge */}
          <div className="lg:col-span-5 flex flex-col sm:flex-row items-center gap-6 justify-center lg:justify-start border-b lg:border-b-0 lg:border-r border-white/10 pb-6 lg:pb-0 lg:pr-8">
            <div className="relative w-40 h-40 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
                <circle
                  cx="80"
                  cy="80"
                  r={radius}
                  stroke="rgba(255, 255, 255, 0.08)"
                  strokeWidth="12"
                  fill="transparent"
                />
                <circle
                  cx="80"
                  cy="80"
                  r={radius}
                  stroke={gradeColor.stroke}
                  strokeWidth="12"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>

              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-3xl font-black text-white font-mono tracking-tight">
                  {scoreVal}
                </span>
                <span className={`text-xs font-extrabold uppercase px-2 py-0.5 rounded-full mt-0.5 border ${gradeColor.bg} ${gradeColor.text} ${gradeColor.border}`}>
                  Grade {pulseScore?.grade || "—"}
                </span>
                <span className="text-[10px] text-gray-500 font-semibold mt-1">/ 100</span>
              </div>
            </div>

            <div className="space-y-2 text-center sm:text-left">
              <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                Live Price-Coupled Engine
              </div>
              <h3 className="text-lg font-bold text-white tracking-tight">
                {scoreVal >= 85 ? "Exceptional Institutional Setup" :
                 scoreVal >= 70 ? "Strong Investment Quality" :
                 scoreVal >= 55 ? "Moderate Fundamental Profile" :
                 scoreVal >= 40 ? "Caution: Sub-Optimal Solvency" :
                 "High Fundamental Risk Detected"}
              </h3>
              <p className="text-xs text-gray-400 max-w-xs leading-relaxed">
                Aggregated institutional grading across 4 core quantitative pillars calibrated for Indian equity markets.
              </p>
            </div>
          </div>

          {/* 4 Pillars Progress Bars */}
          <div className="lg:col-span-7 space-y-4">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center justify-between">
              <span>Pillar Scorecard (25 pts Each)</span>
              <span className="text-white font-mono">{scoreVal} / 100 Total</span>
            </h4>

            {pulseScore?.pillars && (
              <div className="space-y-3">
                {/* Pillar 1 */}
                <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] transition-all">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <Target size={14} className="text-blue-400" />
                      1. Valuation & Margin of Safety
                    </span>
                    <span className="font-mono font-bold text-blue-400">
                      {pulseScore.pillars.pillar1_valuation.score} / 25
                    </span>
                  </div>
                  <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all duration-700"
                      style={{ width: `${pulseScore.pillars.pillar1_valuation.percentage}%` }}
                    />
                  </div>
                </div>

                {/* Pillar 2 */}
                <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] transition-all">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <Activity size={14} className="text-emerald-400" />
                      2. Capital Efficiency & Moat (ROE/Margins)
                    </span>
                    <span className="font-mono font-bold text-emerald-400">
                      {pulseScore.pillars.pillar2_profitability.score} / 25
                    </span>
                  </div>
                  <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                      style={{ width: `${pulseScore.pillars.pillar2_profitability.percentage}%` }}
                    />
                  </div>
                </div>

                {/* Pillar 3 */}
                <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] transition-all">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <ShieldCheck size={14} className="text-amber-400" />
                      3. Balance Sheet Solvency & Insider Alignment
                    </span>
                    <span className="font-mono font-bold text-amber-400">
                      {pulseScore.pillars.pillar3_solvency.score} / 25
                    </span>
                  </div>
                  <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full transition-all duration-700"
                      style={{ width: `${pulseScore.pillars.pillar3_solvency.percentage}%` }}
                    />
                  </div>
                </div>

                {/* Pillar 4 */}
                <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] transition-all">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <Users size={14} className="text-purple-400" />
                      4. Institutional Sponsorship & Volatility
                    </span>
                    <span className="font-mono font-bold text-purple-400">
                      {pulseScore.pillars.pillar4_institutional.score} / 25
                    </span>
                  </div>
                  <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-500 rounded-full transition-all duration-700"
                      style={{ width: `${pulseScore.pillars.pillar4_institutional.percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* ── 2x2 Intelligence Cards Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ── 2. Analyst Consensus & Target Price Forecast Card ── */}
        <Card className="space-y-5 p-6 rounded-3xl bg-[#0e1626] border border-white/[0.08]">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Target size={18} className="text-emerald-400" />
              Analyst Target Price Forecast
            </h3>
            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full capitalize">
              {financialData.recommendationKey ? financialData.recommendationKey.replace("_", " ") : "Consensus"}
            </span>
          </div>

          {/* Upside / Downside Spotlight */}
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between">
            <div>
              <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider">
                Consensus Target Price
              </p>
              <p className="text-2xl font-black text-white font-mono mt-0.5">
                {targetMean ? `₹${targetMean.toLocaleString("en-IN")}` : "N/A"}
              </p>
            </div>
            {targetUpside !== null && (
              <div
                className={`px-3 py-1.5 rounded-xl border text-xs font-extrabold flex items-center gap-1 font-mono ${
                  targetUpside >= 0
                    ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                    : "bg-rose-500/15 border-rose-500/30 text-rose-400"
                }`}
              >
                {targetUpside >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                {targetUpside >= 0 ? "+" : ""}{targetUpside}% Potential
              </div>
            )}
          </div>

          {/* Low / Mean / High Range */}
          {targetLow && targetHigh && (
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between text-xs text-gray-400 font-mono">
                <span>Low: ₹{targetLow.toLocaleString("en-IN")}</span>
                <span className="font-bold text-white">Mean: ₹{targetMean?.toLocaleString("en-IN")}</span>
                <span>High: ₹{targetHigh.toLocaleString("en-IN")}</span>
              </div>
              <div className="relative w-full h-2.5 bg-white/10 rounded-full overflow-hidden">
                <div className="absolute inset-y-0 left-0 right-0 bg-gradient-to-r from-amber-500 via-emerald-400 to-cyan-400 rounded-full" />
              </div>
            </div>
          )}

          {/* Analyst Ratings Stacked Distribution Bar */}
          <div className="space-y-2 pt-2 border-t border-white/[0.06]">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-gray-300">
                Institutional Recommendation Trend ({totalRatings} Analysts)
              </span>
              <span className="text-[11px] text-emerald-400 font-bold">
                {totalRatings > 0 ? `${Math.round(strongBuyPct + buyPct)}% Buy Consensus` : "—"}
              </span>
            </div>

            {totalRatings > 0 ? (
              <>
                <div className="w-full h-3 rounded-full overflow-hidden flex bg-white/10">
                  <div style={{ width: `${strongBuyPct}%` }} className="bg-emerald-500" title={`Strong Buy: ${strongBuy}`} />
                  <div style={{ width: `${buyPct}%` }} className="bg-teal-400" title={`Buy: ${buy}`} />
                  <div style={{ width: `${holdPct}%` }} className="bg-amber-400" title={`Hold: ${hold}`} />
                  <div style={{ width: `${sellPct}%` }} className="bg-rose-400" title={`Sell: ${sell}`} />
                  <div style={{ width: `${strongSellPct}%` }} className="bg-rose-600" title={`Strong Sell: ${strongSell}`} />
                </div>

                <div className="grid grid-cols-5 gap-1 text-center text-[10px] pt-1">
                  <div>
                    <span className="text-emerald-400 font-bold">{strongBuy}</span>
                    <p className="text-gray-500">Str Buy</p>
                  </div>
                  <div>
                    <span className="text-teal-400 font-bold">{buy}</span>
                    <p className="text-gray-500">Buy</p>
                  </div>
                  <div>
                    <span className="text-amber-400 font-bold">{hold}</span>
                    <p className="text-gray-500">Hold</p>
                  </div>
                  <div>
                    <span className="text-rose-400 font-bold">{sell}</span>
                    <p className="text-gray-500">Sell</p>
                  </div>
                  <div>
                    <span className="text-rose-600 font-bold">{strongSell}</span>
                    <p className="text-gray-500">Str Sell</p>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-xs text-gray-500 italic">No analyst ratings reported for this symbol.</p>
            )}
          </div>
        </Card>

        {/* ── 3. Sector Valuation Benchmark Card ── */}
        <Card className="space-y-5 p-6 rounded-3xl bg-[#0e1626] border border-white/[0.08]">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <BarChart2 size={18} className="text-blue-400" />
              Sector Valuation Benchmark
            </h3>
            <span className="text-xs font-bold text-gray-400 bg-white/5 border border-white/10 px-2.5 py-0.5 rounded-full">
              {assetProfile.sector || "Sector"}
            </span>
          </div>

          {/* P/E Comparison Spotlight */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
              <p className="text-[11px] text-gray-400 font-semibold uppercase">Stock P/E (TTM)</p>
              <p className="text-xl font-extrabold text-white font-mono mt-0.5">
                {stockPE ? `${Number(stockPE).toFixed(1)}x` : "—"}
              </p>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
              <p className="text-[11px] text-gray-400 font-semibold uppercase">Sector Median P/E</p>
              <p className="text-xl font-extrabold text-gray-300 font-mono mt-0.5">
                {sectorPE ? `${Number(sectorPE).toFixed(1)}x` : "22.0x"}
              </p>
            </div>
          </div>

          {/* Discount / Premium Relative Badge */}
          {discountPremium !== null && (
            <div className="flex items-center justify-between text-xs p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
              <span className="text-gray-400 font-medium">Sector Relative Multiple:</span>
              <span
                className={`font-bold font-mono px-2 py-0.5 rounded-md ${
                  discountPremium < 0
                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                    : discountPremium > 35
                    ? "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                    : "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                }`}
              >
                {relativePE ? `${relativePE}x` : "—"} ({discountPremium >= 0 ? `+${discountPremium}% Premium` : `${discountPremium}% Discount`})
              </span>
            </div>
          )}

          {/* Visual Slider: Deep Value ➔ Fair Value ➔ Expensive */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between text-[11px] text-gray-400">
              <span className="text-emerald-400 font-semibold">Deep Value (&le;0.7x)</span>
              <span className="text-blue-400 font-semibold">Fair (1.0x)</span>
              <span className="text-rose-400 font-semibold">Expensive (&gt;1.5x)</span>
            </div>

            <div className="relative w-full h-3 bg-white/10 rounded-full overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 via-blue-500 to-rose-500 opacity-80" />
            </div>

            {/* Slider Marker Indicator */}
            <div className="relative w-full h-4">
              <div
                className="absolute -top-1 -translate-x-1/2 flex flex-col items-center transition-all duration-500"
                style={{ left: `${sliderPosition}%` }}
              >
                <div className="w-3 h-3 bg-white rounded-full shadow-md border-2 border-blue-500" />
                <span className="text-[10px] font-mono font-bold text-white mt-0.5">
                  {relativePE ? `${relativePE}x` : "—"}
                </span>
              </div>
            </div>
          </div>

          {/* PEG Ratio Badge */}
          <div className="flex items-center justify-between text-xs pt-2 border-t border-white/[0.06]">
            <span className="text-gray-400">PEG Ratio (Growth Adjusted):</span>
            <span className="font-mono font-bold text-white bg-white/5 border border-white/10 px-2 py-0.5 rounded-md">
              {valuation.pegRatio ? `${valuation.pegRatio}x` : "N/A"}
              {valuation.pegRatio && valuation.pegRatio < 1.0 && (
                <span className="text-emerald-400 ml-1.5 text-[10px]">(Undervalued)</span>
              )}
            </span>
          </div>
        </Card>

        {/* ── 4. Institutional Ownership Card ── */}
        <Card className="space-y-5 p-6 rounded-3xl bg-[#0e1626] border border-white/[0.08]">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <PieChart size={18} className="text-purple-400" />
              Institutional & Shareholding Pattern
            </h3>
            <span className="text-xs font-bold text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2.5 py-0.5 rounded-full">
              SHP Breakdown
            </span>
          </div>

          {/* Multi-Segment Color Bar */}
          <div className="space-y-2">
            <div className="w-full h-4 rounded-full overflow-hidden flex bg-white/10">
              <div
                style={{ width: `${promoter || 0}%` }}
                className="bg-purple-500 transition-all duration-700"
                title={`Promoter: ${promoter}%`}
              />
              <div
                style={{ width: `${institutional || 0}%` }}
                className="bg-blue-500 transition-all duration-700"
                title={`Institutions: ${institutional}%`}
              />
              <div
                style={{ width: `${retail || 0}%` }}
                className="bg-emerald-500 transition-all duration-700"
                title={`Retail Float: ${retail}%`}
              />
            </div>
          </div>

          {/* 3 Metrics Cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-center">
              <div className="w-2.5 h-2.5 rounded-full bg-purple-500 mx-auto mb-1.5" />
              <p className="text-[10px] text-gray-400 font-semibold uppercase">Promoters</p>
              <p className="text-base font-extrabold text-white font-mono mt-0.5">
                {promoter !== null ? `${promoter}%` : "—"}
              </p>
              <span className="text-[9px] text-gray-500">Insider Stake</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-center">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-500 mx-auto mb-1.5" />
              <p className="text-[10px] text-gray-400 font-semibold uppercase">FII + DII</p>
              <p className="text-base font-extrabold text-blue-400 font-mono mt-0.5">
                {institutional !== null ? `${institutional}%` : "—"}
              </p>
              <span className="text-[9px] text-gray-500">Institutions</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-center">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 mx-auto mb-1.5" />
              <p className="text-[10px] text-gray-400 font-semibold uppercase">Retail Float</p>
              <p className="text-base font-extrabold text-emerald-400 font-mono mt-0.5">
                {retail !== null ? `${retail}%` : "—"}
              </p>
              <span className="text-[9px] text-gray-500">Public Float</span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center gap-2.5 text-xs text-gray-400">
            <ShieldCheck size={16} className="text-emerald-400 shrink-0" />
            <span>
              {promoter && promoter >= 50
                ? "High promoter commitment (>50%) indicates strong skin-in-the-game and alignment."
                : institutional && institutional >= 30
                ? "Substantial institutional backing provides strong liquidity and corporate governance."
                : "Balanced shareholding with active public market float."}
            </span>
          </div>
        </Card>

        {/* ── 5. Solvency & Capital Efficiency Matrix ── */}
        <Card className="space-y-5 p-6 rounded-3xl bg-[#0e1626] border border-white/[0.08]">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck size={18} className="text-amber-400" />
              Solvency & Moat Matrix
            </h3>
            <span className="text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full">
              Risk Audit
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {/* D/E Ratio */}
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
              <p className="text-[10px] text-gray-400 font-semibold uppercase">Debt-to-Equity</p>
              <p className="text-base font-extrabold text-white font-mono mt-0.5">{de}</p>
              <span className={`text-[10px] font-bold ${
                isBank ? "text-blue-400" :
                Number(de) <= 0.5 ? "text-emerald-400" :
                Number(de) <= 1.0 ? "text-amber-400" : "text-rose-400"
              }`}>
                {isBank ? "Regulated Bank" : Number(de) <= 0.5 ? "✓ Low Risk" : Number(de) <= 1.0 ? "Moderate" : "⚠ Elevated Debt"}
              </span>
            </div>

            {/* Return on Equity */}
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
              <p className="text-[10px] text-gray-400 font-semibold uppercase">Return on Equity</p>
              <p className="text-base font-extrabold text-white font-mono mt-0.5">{roe}</p>
              <span className="text-[10px] font-bold text-emerald-400">
                {roe !== "—" && parseFloat(roe) >= 18 ? "Moat Quality" : "Capital Efficiency"}
              </span>
            </div>

            {/* Operating Margin */}
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
              <p className="text-[10px] text-gray-400 font-semibold uppercase">Operating Margin</p>
              <p className="text-base font-extrabold text-white font-mono mt-0.5">{opMargin}</p>
              <span className="text-[10px] text-gray-500">EBITDA Margin</span>
            </div>

            {/* Net Margin */}
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
              <p className="text-[10px] text-gray-400 font-semibold uppercase">Net Profit Margin</p>
              <p className="text-base font-extrabold text-white font-mono mt-0.5">{netMargin}</p>
              <span className="text-[10px] text-gray-500">Bottomline Yield</span>
            </div>

            {/* Book Value */}
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
              <p className="text-[10px] text-gray-400 font-semibold uppercase">Book Value</p>
              <p className="text-base font-extrabold text-white font-mono mt-0.5">{bookValue}</p>
              <span className="text-[10px] text-gray-500">Per Share</span>
            </div>

            {/* Beta */}
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
              <p className="text-[10px] text-gray-400 font-semibold uppercase">5Y Beta</p>
              <p className="text-base font-extrabold text-white font-mono mt-0.5">{beta}</p>
              <span className={`text-[10px] font-bold ${
                beta !== "—" && parseFloat(beta) < 1.0 ? "text-blue-400" : "text-amber-400"
              }`}>
                {beta !== "—" && parseFloat(beta) < 0.8 ? "Defensive" : beta !== "—" && parseFloat(beta) <= 1.2 ? "Market Sync" : "High Volatility"}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* ── 6. Company DNA & Moat Overview ── */}
      <Card className="space-y-4 p-6 md:p-8 rounded-3xl bg-[#0e1626] border border-white/[0.08]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Building2 size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Company DNA & Enterprise Profile
              </h3>
              <p className="text-xs text-gray-400">
                {assetProfile.sector || "Sector"} &nbsp;·&nbsp; {assetProfile.industry || "Industry"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {assetProfile.city && (
              <span className="text-xs font-semibold text-gray-300 bg-white/5 border border-white/10 px-3 py-1 rounded-xl">
                📍 {assetProfile.city}, {assetProfile.country || "India"}
              </span>
            )}
            {assetProfile.fullTimeEmployees && (
              <span className="text-xs font-semibold text-gray-300 bg-white/5 border border-white/10 px-3 py-1 rounded-xl flex items-center gap-1.5">
                <Users size={13} className="text-blue-400" />
                {Number(assetProfile.fullTimeEmployees).toLocaleString("en-IN")} Employees
              </span>
            )}
            {assetProfile.website && (
              <a
                href={assetProfile.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 px-3.5 py-1 rounded-xl flex items-center gap-1.5 transition-all"
              >
                <Globe size={13} />
                Visit Website
                <ExternalLink size={11} />
              </a>
            )}
          </div>
        </div>

        {/* Business Summary */}
        {assetProfile.longBusinessSummary ? (
          <div className="space-y-2">
            <p className={`text-xs text-gray-300 leading-relaxed ${!showFullSummary ? "line-clamp-3" : ""}`}>
              {assetProfile.longBusinessSummary}
            </p>
            <button
              onClick={() => setShowFullSummary(!showFullSummary)}
              className="inline-flex items-center gap-1 text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors"
            >
              {showFullSummary ? (
                <>Show Less <ChevronUp size={14} /></>
              ) : (
                <>Read Full Executive Brief <ChevronDown size={14} /></>
              )}
            </button>
          </div>
        ) : (
          <p className="text-xs text-gray-500 italic">No business description available.</p>
        )}
      </Card>
    </div>
  );
}
