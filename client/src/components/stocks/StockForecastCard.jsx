// client/src/components/stocks/StockForecastCard.jsx
import React, { useState, useMemo } from "react";
import Card from "../ui/Card";
import {
  TrendingUp,
  Target,
  Sparkles,
  Calendar,
  Layers,
  Award,
  Zap,
  ShieldCheck,
  ChevronRight,
  HelpCircle,
  ArrowUpRight,
  Clock,
  BarChart3,
  Compass,
} from "lucide-react";
import { calculateForecast } from "../../utils/forecastEngine";

export default function StockForecastCard({ details, livePrice }) {
  const [selectedHorizon, setSelectedHorizon] = useState("all"); // 'all' | '1Y' | '3Y' | '5Y'
  const [selectedScenario, setSelectedScenario] = useState("base"); // 'bear' | 'base' | 'bull'

  const price = Number(livePrice || details?.price || 0);

  // Compute or refresh forecast if live price changes
  const forecast = useMemo(() => {
    if (!details) return null;
    return calculateForecast(details, price, details.pulseScore);
  }, [details, price]);

  if (!forecast || !forecast.oneYear || !forecast.threeYear || !forecast.fiveYear) {
    return null;
  }

  const { oneYear, threeYear, fiveYear, summary } = forecast;

  const horizons = [
    {
      key: "1Y",
      horizonData: oneYear,
      tag: "Near-Term Horizon",
      icon: Clock,
      color: "blue",
      border: "border-blue-500/30",
      bg: "bg-blue-500/10",
      text: "text-blue-400",
      badge: "Wall St / Dalal St Target",
    },
    {
      key: "3Y",
      horizonData: threeYear,
      tag: "Business Cycle",
      icon: TrendingUp,
      color: "teal",
      border: "border-teal-500/30",
      bg: "bg-teal-500/10",
      text: "text-teal-400",
      badge: "Earnings Compounding",
    },
    {
      key: "5Y",
      horizonData: fiveYear,
      tag: "Coffee Can Horizon",
      icon: Award,
      color: "emerald",
      border: "border-emerald-500/30",
      bg: "bg-emerald-500/10",
      text: "text-emerald-400",
      badge: "Structural Compounder",
    },
  ];

  return (
    <Card className="p-6 md:p-8 rounded-3xl bg-gradient-to-br from-[#0c1322] via-[#09101d] to-[#0d1627] border border-white/10 shadow-2xl relative overflow-hidden space-y-6">
      <div className="no-print absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* ── Header ── */}
      <div className="no-print flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/[0.08] pb-6 relative z-10">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-black font-extrabold shadow-md shadow-cyan-500/20">
              <Compass size={18} className="text-white" />
            </span>
            <h3 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
              Multi-Year Price & Return Forecast
              <span className="text-[11px] font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-0.5 rounded-full">
                1Y · 3Y · 5Y Horizon
              </span>
            </h3>
          </div>
          <p className="text-xs text-gray-400 max-w-2xl leading-relaxed">
            Quantitative valuation projection synthesizing Wall St/Dalal St analyst targets, 100-Point PulseScore™ quality moat, and multi-year ROE capital reinvestment.
          </p>
        </div>

        {/* Scenario Toggle */}
        <div className="scenario-selector no-print flex items-center gap-2 bg-[#080d18] border border-white/10 p-1 rounded-2xl shrink-0">
          <span className="text-[11px] font-semibold text-gray-500 px-2 hidden sm:inline">Scenario:</span>
          <button
            onClick={() => setSelectedScenario("bear")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              selectedScenario === "bear"
                ? "bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Bear Case
          </button>
          <button
            onClick={() => setSelectedScenario("base")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              selectedScenario === "base"
                ? "bg-emerald-500 text-black shadow-md shadow-emerald-500/25"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Base Case (Expected)
          </button>
          <button
            onClick={() => setSelectedScenario("bull")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              selectedScenario === "bull"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Bull Case
          </button>
        </div>
      </div>

      {/* ── Summary Indicator Strip ── */}
      <div className="no-print grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-white/[0.02] border border-white/[0.06] p-3.5 rounded-2xl">
        <div>
          <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold block">
            Outlook Profile
          </span>
          <span className={`font-bold mt-0.5 block truncate ${summary.outlookClass}`}>
            {summary.outlook}
          </span>
        </div>
        <div>
          <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold block">
            Analyst Stance
          </span>
          <span className="font-bold text-white mt-0.5 block truncate">
            {summary.analystConsensus}
          </span>
        </div>
        <div>
          <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold block">
            PulseScore Quality Anchor
          </span>
          <span className="font-bold text-white mt-0.5 block font-mono">
            {summary.pulseScoreRef} / 100 · Grade {summary.gradeRef}
          </span>
        </div>
        <div>
          <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold block">
            Dividend Shield
          </span>
          <span className="font-bold text-white mt-0.5 block truncate">
            {summary.dividendCompounding}
          </span>
        </div>
      </div>

      <div className="print-only print-keep">
        <h4 className="text-sm font-bold mb-2">1Y / 3Y / 5Y Forecast (Base Case)</h4>
        <table>
          <thead>
            <tr>
              <th>Horizon</th>
              <th>Target</th>
              <th>Expected Return</th>
              <th>CAGR</th>
            </tr>
          </thead>
          <tbody>
            {horizons.map(({ key, horizonData }) => {
              const base = horizonData.scenarios.base;
              return (
                <tr key={key}>
                  <td>{horizonData.horizon}</td>
                  <td>₹{Number(base.price).toLocaleString("en-IN", { maximumFractionDigits: 2 })}</td>
                  <td>{base.returnPct >= 0 ? "+" : ""}{base.returnPct}%</td>
                  <td>{base.cagrPct}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── 3 Horizon Forecast Cards (1Y · 3Y · 5Y) ── */}
      <div className="no-print grid grid-cols-1 md:grid-cols-3 gap-5 relative z-10">
        {horizons.map(({ key, horizonData, tag, icon: Icon, border, bg, text, badge }) => {
          const scenarioData = horizonData.scenarios[selectedScenario];
          const isSelected = selectedHorizon === key || selectedHorizon === "all";
          const returnPositive = scenarioData.returnPct >= 0;

          return (
            <div
              key={key}
              onClick={() => setSelectedHorizon(selectedHorizon === key ? "all" : key)}
              className={`p-5 rounded-2xl border transition-all cursor-pointer relative group ${
                selectedHorizon === key
                  ? "bg-white/[0.06] border-white/30 shadow-xl ring-1 ring-cyan-500/30"
                  : "bg-white/[0.02] border-white/[0.08] hover:bg-white/[0.04] hover:border-white/20"
              }`}
            >
              {/* Card Header with Horizon & Tag */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-xl ${bg} border ${border} flex items-center justify-center ${text}`}>
                    <Icon size={16} />
                  </div>
                  <div>
                    <h4 className="text-base font-extrabold text-white flex items-center gap-1.5">
                      {horizonData.horizon}
                      <span className="text-[10px] font-normal text-gray-400">
                        ({horizonData.timeframe.split(" ")[0]} {horizonData.timeframe.split(" ")[1]})
                      </span>
                    </h4>
                    <span className="text-[10px] text-gray-400 font-semibold">{tag}</span>
                  </div>
                </div>

                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${bg} ${border} ${text}`}>
                  {badge}
                </span>
              </div>

              {/* Target Price */}
              <div className="space-y-1 mb-4">
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block">
                  Projected Target ({selectedScenario.toUpperCase()})
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl lg:text-3xl font-black text-white font-mono tracking-tight">
                    ₹{scenarioData.price.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  {scenarioData.multiplier && (
                    <span className="text-xs font-extrabold text-cyan-400 font-mono bg-cyan-500/10 px-1.5 py-0.5 rounded">
                      {scenarioData.multiplier}
                    </span>
                  )}
                </div>
              </div>

              {/* Return Metrics Grid */}
              <div className="grid grid-cols-2 gap-2 pt-3 border-t border-white/[0.06]">
                <div className="bg-black/20 p-2.5 rounded-xl border border-white/[0.04]">
                  <span className="text-[10px] text-gray-400 font-medium block">Total Return</span>
                  <span
                    className={`text-sm font-extrabold font-mono inline-flex items-center gap-0.5 mt-0.5 ${
                      returnPositive ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    <ArrowUpRight size={13} className={returnPositive ? "" : "rotate-90"} />
                    {returnPositive ? "+" : ""}
                    {scenarioData.returnPct}%
                  </span>
                </div>

                <div className="bg-black/20 p-2.5 rounded-xl border border-white/[0.04]">
                  <span className="text-[10px] text-gray-400 font-medium block">Annualized CAGR</span>
                  <span className="text-sm font-extrabold font-mono text-cyan-400 mt-0.5 block">
                    {scenarioData.cagrPct}% p.a.
                  </span>
                </div>
              </div>

              {/* Scenario Range Bar */}
              <div className="mt-4 pt-3 border-t border-white/[0.04] space-y-1.5">
                <div className="flex items-center justify-between text-[10px] text-gray-500 font-mono">
                  <span>Bear: ₹{horizonData.scenarios.bear.price.toLocaleString("en-IN")}</span>
                  <span className="text-white font-bold">Base: ₹{horizonData.scenarios.base.price.toLocaleString("en-IN")}</span>
                  <span>Bull: ₹{horizonData.scenarios.bull.price.toLocaleString("en-IN")}</span>
                </div>
                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden flex">
                  <div className="h-full bg-rose-500/70" style={{ width: "25%" }} />
                  <div className="h-full bg-emerald-500" style={{ width: "45%" }} />
                  <div className="h-full bg-cyan-400/80" style={{ width: "30%" }} />
                </div>
              </div>

              {/* Methodology Footer Note */}
              <div className="mt-3 text-[10px] text-gray-500 italic truncate">
                {horizonData.methodology}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Compounding Roadmap Progression ── */}
      <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-3">
        <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <BarChart3 size={14} className="text-cyan-400" />
            Capital Growth Pathway (Starting from LTP: ₹{price.toLocaleString("en-IN")})
          </span>
          <span className="text-[11px] text-gray-400 normal-case font-normal">
            Assumes steady Coffee Can reinvestment
          </span>
        </h4>

        <div className="grid grid-cols-4 gap-2 text-center text-xs">
          <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
            <span className="text-[10px] text-gray-500 font-semibold block">Now (LTP)</span>
            <span className="text-sm font-bold text-white font-mono mt-0.5 block">
              ₹{price.toLocaleString("en-IN")}
            </span>
            <span className="text-[10px] text-gray-400 font-mono">1.00x Base</span>
          </div>

          <div className="p-2.5 rounded-xl bg-blue-500/5 border border-blue-500/20">
            <span className="text-[10px] text-blue-400 font-semibold block">After 1 Year</span>
            <span className="text-sm font-bold text-white font-mono mt-0.5 block">
              ₹{oneYear.scenarios[selectedScenario].price.toLocaleString("en-IN")}
            </span>
            <span className="text-[10px] text-blue-400 font-mono font-bold">
              {oneYear.scenarios[selectedScenario].returnPct >= 0 ? "+" : ""}
              {oneYear.scenarios[selectedScenario].returnPct}%
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-teal-500/5 border border-teal-500/20">
            <span className="text-[10px] text-teal-400 font-semibold block">After 3 Years</span>
            <span className="text-sm font-bold text-white font-mono mt-0.5 block">
              ₹{threeYear.scenarios[selectedScenario].price.toLocaleString("en-IN")}
            </span>
            <span className="text-[10px] text-teal-400 font-mono font-bold">
              +{threeYear.scenarios[selectedScenario].returnPct}% ({threeYear.scenarios[selectedScenario].cagrPct}% CAGR)
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
            <span className="text-[10px] text-emerald-400 font-semibold block">After 5 Years</span>
            <span className="text-sm font-bold text-white font-mono mt-0.5 block">
              ₹{fiveYear.scenarios[selectedScenario].price.toLocaleString("en-IN")}
            </span>
            <span className="text-[10px] text-emerald-400 font-mono font-bold">
              +{fiveYear.scenarios[selectedScenario].returnPct}% ({fiveYear.scenarios[selectedScenario].multiplier})
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}
