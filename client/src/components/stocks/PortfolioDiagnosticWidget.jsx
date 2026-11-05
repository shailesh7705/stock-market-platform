// client/src/components/stocks/PortfolioDiagnosticWidget.jsx
import React, { useState, useEffect, useMemo } from "react";
import Card from "../ui/Card";
import {
  ShieldAlert,
  ShieldCheck,
  Activity,
  PieChart,
  AlertTriangle,
  Zap,
  TrendingUp,
  Award,
  Layers,
  CheckCircle2,
} from "lucide-react";
import { getBatchStockDetails } from "../../services/stockService";

function cleanSymbol(sym = "") {
  return sym.replace(".NS", "").replace(".BO", "").toUpperCase();
}

const SECTOR_COLORS = [
  "#3b82f6", // Blue
  "#10b981", // Emerald
  "#a855f7", // Purple
  "#f59e0b", // Amber
  "#06b6d4", // Cyan
  "#ec4899", // Pink
  "#f97316", // Orange
  "#6366f1", // Indigo
];

export default function PortfolioDiagnosticWidget({ watchlist = [] }) {
  const [stockDetailsList, setStockDetailsList] = useState([]);
  const [loading, setLoading] = useState(false);

  const symbols = useMemo(() => {
    return (watchlist || []).map((s) => s.symbol).filter(Boolean);
  }, [watchlist]);

  useEffect(() => {
    if (!symbols.length) {
      setStockDetailsList([]);
      return;
    }

    let isMounted = true;
    const fetchBatch = async () => {
      setLoading(true);
      try {
        const data = await getBatchStockDetails(symbols);
        if (isMounted && Array.isArray(data)) {
          setStockDetailsList(data);
        }
      } catch (err) {
        console.warn("Portfolio diagnostic batch fetch error:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchBatch();
    return () => {
      isMounted = false;
    };
  }, [symbols.join(",")]);

  // Aggregate computations
  const diagnostic = useMemo(() => {
    if (!stockDetailsList.length) return null;

    // 1. Portfolio Quality Score (0–100)
    let totalScore = 0;
    let scoredCount = 0;
    stockDetailsList.forEach((s) => {
      if (s.pulseScore?.score !== undefined) {
        totalScore += s.pulseScore.score;
        scoredCount++;
      }
    });
    const avgScore = scoredCount > 0 ? Number((totalScore / scoredCount).toFixed(1)) : 50;

    let grade = "D";
    if (avgScore >= 85) grade = "A+";
    else if (avgScore >= 70) grade = "A";
    else if (avgScore >= 55) grade = "B";
    else if (avgScore >= 40) grade = "C";

    // 2. Sector Concentration
    const sectorCounts = {};
    stockDetailsList.forEach((s) => {
      const sector = s.assetProfile?.sector || "Diversified / Other";
      sectorCounts[sector] = (sectorCounts[sector] || 0) + 1;
    });

    const totalEquities = stockDetailsList.length;
    const sectors = Object.entries(sectorCounts).map(([name, count], index) => {
      const pct = Number(((count / totalEquities) * 100).toFixed(1));
      return {
        name,
        count,
        percentage: pct,
        color: SECTOR_COLORS[index % SECTOR_COLORS.length],
      };
    }).sort((a, b) => b.percentage - a.percentage);

    const highestSector = sectors[0] || null;
    const isConcentrationRisk = highestSector && highestSector.percentage > 40 && totalEquities > 1;

    // 3. Volatility (Beta) Meter
    let totalBeta = 0;
    let betaCount = 0;
    stockDetailsList.forEach((s) => {
      const b = s.defaultKeyStatistics?.beta;
      if (b !== null && b !== undefined && !isNaN(b)) {
        totalBeta += Number(b);
        betaCount++;
      }
    });
    const avgBeta = betaCount > 0 ? Number((totalBeta / betaCount).toFixed(2)) : 1.0;

    let betaCategory = "Balanced";
    let betaBadge = "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
    if (avgBeta < 0.8) {
      betaCategory = "Conservative";
      betaBadge = "text-blue-400 bg-blue-500/10 border-blue-500/30";
    } else if (avgBeta > 1.1) {
      betaCategory = "Aggressive";
      betaBadge = "text-rose-400 bg-rose-500/10 border-rose-500/30";
    }

    // 4. Red-Flag Scanner
    const redFlags = [];
    stockDetailsList.forEach((s) => {
      const sym = cleanSymbol(s.symbol);
      const isBank = s.assetProfile?.sector?.toLowerCase().includes("bank") || s.assetProfile?.sector?.toLowerCase().includes("financial");
      const rawDe = s.financialData?.debtToEquity;
      const de = rawDe !== null && rawDe !== undefined ? (rawDe > 5 ? rawDe / 100 : rawDe) : null;
      const relativePE = s.valuation?.sectorRelativePE;

      if (!isBank && de !== null && de > 1.8) {
        redFlags.push({
          symbol: sym,
          name: s.name,
          issue: `High Solvency Debt (D/E: ${de.toFixed(2)}x)`,
          severity: "high",
        });
      }

      if (relativePE && relativePE > 1.75) {
        redFlags.push({
          symbol: sym,
          name: s.name,
          issue: `Elevated Sector Valuation (${relativePE}x Sector Multiple)`,
          severity: "medium",
        });
      }

      if (s.pulseScore?.score !== undefined && s.pulseScore.score < 40) {
        redFlags.push({
          symbol: sym,
          name: s.name,
          issue: `Weak Institutional PulseScore (${s.pulseScore.score}/100 · Grade ${s.pulseScore.grade})`,
          severity: "high",
        });
      }
    });

    // 5. Portfolio Compounding Growth Trajectory (1Y · 3Y · 5Y)
    let sum1Y = 0, count1Y = 0;
    let sum3YCAGR = 0, count3Y = 0;
    let sum5YCAGR = 0, count5Y = 0;
    stockDetailsList.forEach((s) => {
      const f = s.forecast;
      if (f?.oneYear?.expectedReturnPct !== undefined) {
        sum1Y += f.oneYear.expectedReturnPct;
        count1Y++;
      }
      if (f?.threeYear?.cagrPct !== undefined) {
        sum3YCAGR += f.threeYear.cagrPct;
        count3Y++;
      }
      if (f?.fiveYear?.cagrPct !== undefined) {
        sum5YCAGR += f.fiveYear.cagrPct;
        count5Y++;
      }
    });

    const portfolio1YReturn = count1Y > 0 ? Number((sum1Y / count1Y).toFixed(1)) : null;
    const portfolio3YCAGR = count3Y > 0 ? Number((sum3YCAGR / count3Y).toFixed(1)) : null;
    const portfolio5YCAGR = count5Y > 0 ? Number((sum5YCAGR / count5Y).toFixed(1)) : null;
    const portfolio5YMultiplier = portfolio5YCAGR ? `${Math.pow(1 + portfolio5YCAGR / 100, 5).toFixed(2)}x` : null;

    return {
      avgScore,
      grade,
      sectors,
      highestSector,
      isConcentrationRisk,
      avgBeta,
      betaCategory,
      betaBadge,
      redFlags,
      totalEquities,
      portfolio1YReturn,
      portfolio3YCAGR,
      portfolio5YCAGR,
      portfolio5YMultiplier,
    };
  }, [stockDetailsList]);

  if (!watchlist.length) return null;

  if (loading && !diagnostic) {
    return (
      <Card className="p-6 bg-[#0e1626] border border-white/[0.08] animate-pulse space-y-4">
        <div className="h-6 w-52 bg-white/5 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="h-28 bg-white/5 rounded-2xl" />
          <div className="h-28 bg-white/5 rounded-2xl" />
          <div className="h-28 bg-white/5 rounded-2xl" />
          <div className="h-28 bg-white/5 rounded-2xl" />
        </div>
      </Card>
    );
  }

  if (!diagnostic) return null;

  return (
    <Card className="p-6 md:p-7 bg-gradient-to-br from-[#0e1626] via-[#091120] to-[#0d1527] border border-white/[0.08] rounded-3xl space-y-6 shadow-xl relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.06] pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center text-black font-extrabold shadow-md shadow-emerald-500/20">
            <Activity size={20} />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-white tracking-tight flex items-center gap-2">
              Portfolio Health & Risk Diagnostic
              <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full">
                {diagnostic.totalEquities} Tracked Assets
              </span>
            </h2>
            <p className="text-xs text-gray-400">
              Institutional intelligence diagnostic across quality, sector concentration, aggregate volatility, and solvency.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-400">Diagnostic Status:</span>
          <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Active Scan
          </span>
        </div>
      </div>

      {/* 4 Pillars Matrix Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Portfolio Quality Score */}
        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <Award size={14} className="text-emerald-400" />
              Quality Score
            </span>
            <span className="text-xs font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              Grade {diagnostic.grade}
            </span>
          </div>

          <div className="my-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-white font-mono">{diagnostic.avgScore}</span>
              <span className="text-xs text-gray-500 font-semibold">/ 100</span>
            </div>
            <p className="text-[11px] text-gray-400 mt-1">Weighted Institutional PulseScore</p>
          </div>

          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 rounded-full"
              style={{ width: `${diagnostic.avgScore}%` }}
            />
          </div>
        </div>

        {/* 2. Top Sector Exposure */}
        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <PieChart size={14} className="text-purple-400" />
              Top Sector Weight
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
              diagnostic.isConcentrationRisk
                ? "bg-rose-500/15 text-rose-400 border-rose-500/30"
                : "bg-purple-500/15 text-purple-400 border-purple-500/30"
            }`}>
              {diagnostic.highestSector?.percentage || 0}%
            </span>
          </div>

          <div className="my-3">
            <p className="text-lg font-bold text-white truncate">
              {diagnostic.highestSector?.name || "Diversified"}
            </p>
            <p className="text-[11px] text-gray-400 mt-1">
              {diagnostic.sectors.length} distinct sectors represented
            </p>
          </div>

          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${diagnostic.isConcentrationRisk ? "bg-rose-500" : "bg-purple-500"}`}
              style={{ width: `${Math.min(100, diagnostic.highestSector?.percentage || 0)}%` }}
            />
          </div>
        </div>

        {/* 3. Portfolio Volatility Meter */}
        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <Zap size={14} className="text-cyan-400" />
              Volatility Meter
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${diagnostic.betaBadge}`}>
              {diagnostic.betaCategory}
            </span>
          </div>

          <div className="my-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-white font-mono">{diagnostic.avgBeta}</span>
              <span className="text-xs text-gray-500 font-semibold">&beta; Beta</span>
            </div>
            <p className="text-[11px] text-gray-400 mt-1">
              {diagnostic.avgBeta < 0.8
                ? "Low market sensitivity (Defensive)"
                : diagnostic.avgBeta <= 1.1
                ? "In line with NIFTY 50 baseline"
                : "Amplified market swings"}
            </p>
          </div>

          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-cyan-400 rounded-full"
              style={{ width: `${Math.min(100, (diagnostic.avgBeta / 2.0) * 100)}%` }}
            />
          </div>
        </div>

        {/* 4. Solvency Red Flags */}
        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert size={14} className="text-amber-400" />
              Red-Flag Scanner
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
              diagnostic.redFlags.length === 0
                ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                : "bg-rose-500/15 text-rose-400 border-rose-500/30"
            }`}>
              {diagnostic.redFlags.length} Detected
            </span>
          </div>

          <div className="my-3">
            <span className="text-3xl font-black text-white font-mono">
              {diagnostic.redFlags.length === 0 ? "Clean" : diagnostic.redFlags.length}
            </span>
            <p className="text-[11px] text-gray-400 mt-1">
              {diagnostic.redFlags.length === 0
                ? "Zero solvency or valuation red flags"
                : "Equities require risk review"}
            </p>
          </div>

          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${diagnostic.redFlags.length === 0 ? "bg-emerald-500" : "bg-rose-500"}`}
              style={{ width: diagnostic.redFlags.length === 0 ? "100%" : `${Math.min(100, diagnostic.redFlags.length * 33)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Portfolio Multi-Year Growth Trajectory Ribbon (1Y · 3Y · 5Y) */}
      {diagnostic.portfolio1YReturn !== null && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-950/40 via-cyan-950/30 to-[#0c1424] border border-cyan-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
              <TrendingUp size={18} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white tracking-wide flex items-center gap-1.5">
                Aggregate Portfolio Compounding Forecast
                <span className="text-[10px] font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.2 rounded-full border border-cyan-500/20">
                  1Y · 3Y · 5Y
                </span>
              </h4>
              <p className="text-[11px] text-gray-400">
                Synthesis of analyst price targets and Coffee Can quality reinvestment across your tracked equities.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center shrink-0">
            <div className="bg-black/30 px-3 py-1.5 rounded-xl border border-white/[0.04]">
              <span className="text-[10px] text-gray-400 uppercase font-semibold block">1Y Expected</span>
              <span className="text-xs font-extrabold text-blue-400 font-mono mt-0.5 block">
                {diagnostic.portfolio1YReturn >= 0 ? "+" : ""}{diagnostic.portfolio1YReturn}%
              </span>
            </div>
            <div className="bg-black/30 px-3 py-1.5 rounded-xl border border-white/[0.04]">
              <span className="text-[10px] text-gray-400 uppercase font-semibold block">3Y CAGR</span>
              <span className="text-xs font-extrabold text-teal-400 font-mono mt-0.5 block">
                {diagnostic.portfolio3YCAGR}% p.a.
              </span>
            </div>
            <div className="bg-black/30 px-3 py-1.5 rounded-xl border border-white/[0.04]">
              <span className="text-[10px] text-gray-400 uppercase font-semibold block">5Y Capital</span>
              <span className="text-xs font-extrabold text-emerald-400 font-mono mt-0.5 block">
                {diagnostic.portfolio5YMultiplier}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Sector Concentration Bar */}
      <div className="space-y-2.5 pt-2 border-t border-white/[0.06]">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-white flex items-center gap-1.5">
            <Layers size={14} className="text-blue-400" />
            Interactive Sector Concentration Distribution
          </span>
          <span className="text-gray-400 text-[11px]">
            {diagnostic.sectors.map((s) => `${s.name}: ${s.percentage}%`).join(" · ")}
          </span>
        </div>

        {/* Stacked multi-segment bar */}
        <div className="w-full h-3 rounded-full overflow-hidden flex bg-white/10">
          {diagnostic.sectors.map((s) => (
            <div
              key={s.name}
              style={{ width: `${s.percentage}%`, backgroundColor: s.color }}
              className="h-full transition-all duration-500"
              title={`${s.name}: ${s.percentage}% (${s.count} equities)`}
            />
          ))}
        </div>

        {/* Sector Legend */}
        <div className="flex items-center gap-4 flex-wrap pt-1">
          {diagnostic.sectors.map((s) => (
            <div key={s.name} className="flex items-center gap-1.5 text-[11px]">
              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
              <span className="text-gray-300 font-medium">{s.name}</span>
              <span className="text-gray-500 font-mono font-bold">({s.percentage}%)</span>
            </div>
          ))}
        </div>
      </div>

      {/* Automated Concentration Warning Banner if > 40% */}
      {diagnostic.isConcentrationRisk && (
        <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/25 flex items-start gap-3 text-xs text-rose-300">
          <AlertTriangle size={18} className="text-rose-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-white">
              Sector Concentration Alert: {diagnostic.highestSector?.name} at {diagnostic.highestSector?.percentage}%
            </p>
            <p className="text-[11px] text-gray-300 mt-0.5">
              Portfolio has over 40% exposure to a single industry. Diversifying across non-correlated sectors reduces drawdowns during cyclical sector rotations.
            </p>
          </div>
        </div>
      )}

      {/* Red Flags List (if any) */}
      {diagnostic.redFlags.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-amber-300 flex items-center gap-1.5">
              <AlertTriangle size={14} className="text-amber-400" />
              Automated Red-Flag Risk Scanner
            </span>
            <span className="text-[10px] font-bold text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded-full">
              Attention Recommended
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
            {diagnostic.redFlags.map((flag, i) => (
              <div
                key={i}
                className="p-2.5 rounded-xl bg-black/30 border border-amber-500/20 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white font-mono bg-white/10 px-1.5 py-0.5 rounded">
                    {flag.symbol}
                  </span>
                  <span className="text-gray-300 text-[11px] truncate max-w-[220px]">
                    {flag.issue}
                  </span>
                </div>
                <span className="text-[10px] font-bold uppercase text-amber-400">Flag</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
