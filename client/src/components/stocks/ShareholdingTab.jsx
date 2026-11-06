// client/src/components/stocks/ShareholdingTab.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import Card from "../ui/Card";
import Skeleton from "../ui/Skeleton";
import EmptyState from "../ui/EmptyState";
import {
  Users,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Info,
  CheckCircle2,
  PieChart,
} from "lucide-react";

export default function ShareholdingTab({ symbol }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    const fetchShareholding = async () => {
      try {
        const clean = symbol.replace(".NS", "").replace(".BO", "");
        const res = await axios.get(`/api/stocks/${clean}/shareholding`);
        if (active) {
          setData(res.data);
        }
      } catch (err) {
        if (active) {
          console.error("Failed to load shareholding:", err);
          setError("Could not load shareholding pattern filings.");
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchShareholding();
    return () => {
      active = false;
    };
  }, [symbol]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 bg-white/5 rounded-2xl" />
          ))}
        </div>
        <div className="h-64 bg-white/5 rounded-3xl" />
      </div>
    );
  }

  if (error || !data || !data.quarters || data.quarters.length === 0) {
    return (
      <EmptyState
        title="Shareholding Filings Unavailable"
        description="Quarterly ownership pattern filings have not yet been lodged for this equity."
      />
    );
  }

  const { quarters = [], insights = [] } = data;
  const latest = quarters[0] || {};
  const prev = quarters[1] || {};

  const fiiDelta = latest.fii && prev.fii ? Number((latest.fii - prev.fii).toFixed(2)) : null;
  const diiDelta = latest.dii && prev.dii ? Number((latest.dii - prev.dii).toFixed(2)) : null;
  const promoterDelta = latest.promoter && prev.promoter ? Number((latest.promoter - prev.promoter).toFixed(2)) : null;

  return (
    <div className="space-y-6">
      {/* ── Latest Quarter Summary Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Promoters */}
        <div className="p-4 rounded-2xl bg-[#0c1424] border border-blue-500/20 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-blue-400">Promoters</span>
            {promoterDelta !== null && (
              <span className={`text-[10px] font-mono font-bold ${promoterDelta >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                {promoterDelta >= 0 ? `+${promoterDelta}%` : `${promoterDelta}%`}
              </span>
            )}
          </div>
          <span className="text-2xl font-black text-white font-mono mt-1 block">
            {latest.promoter}%
          </span>
          <span className="text-[10px] text-gray-500 block mt-0.5">{latest.period}</span>
        </div>

        {/* FII */}
        <div className="p-4 rounded-2xl bg-[#0c1424] border border-emerald-500/20">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-400">FII / FPIs</span>
            {fiiDelta !== null && (
              <span className={`text-[10px] font-mono font-bold ${fiiDelta >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                {fiiDelta >= 0 ? `+${fiiDelta}%` : `${fiiDelta}%`}
              </span>
            )}
          </div>
          <span className="text-2xl font-black text-white font-mono mt-1 block">
            {latest.fii}%
          </span>
          <span className="text-[10px] text-gray-500 block mt-0.5">Foreign Institutional</span>
        </div>

        {/* DII */}
        <div className="p-4 rounded-2xl bg-[#0c1424] border border-teal-500/20">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-teal-400">DII / Mutual Funds</span>
            {diiDelta !== null && (
              <span className={`text-[10px] font-mono font-bold ${diiDelta >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                {diiDelta >= 0 ? `+${diiDelta}%` : `${diiDelta}%`}
              </span>
            )}
          </div>
          <span className="text-2xl font-black text-white font-mono mt-1 block">
            {latest.dii}%
          </span>
          <span className="text-[10px] text-gray-500 block mt-0.5">MFs: {latest.mutualFunds || "—"}%</span>
        </div>

        {/* Retail & Others */}
        <div className="p-4 rounded-2xl bg-[#0c1424] border border-white/10">
          <span className="text-[11px] font-bold text-gray-400 block">Public & Retail</span>
          <span className="text-2xl font-black text-white font-mono mt-1 block">
            {latest.retailAndOthers}%
          </span>
          <span className="text-[10px] text-gray-500 block mt-0.5">Non-institutional</span>
        </div>

        {/* Promoter Pledge */}
        <div
          className={`p-4 rounded-2xl border ${
            latest.promoterPledgedPercent > 20
              ? "bg-rose-500/10 border-rose-500/30"
              : latest.promoterPledgedPercent > 0
              ? "bg-amber-500/10 border-amber-500/30"
              : "bg-emerald-500/10 border-emerald-500/30"
          } col-span-2 sm:col-span-1`}
        >
          <span className="text-[11px] font-bold text-gray-300 block">Promoter Pledge</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span
              className={`text-2xl font-black font-mono ${
                latest.promoterPledgedPercent > 20
                  ? "text-rose-400"
                  : latest.promoterPledgedPercent > 0
                  ? "text-amber-400"
                  : "text-emerald-400"
              }`}
            >
              {latest.promoterPledgedPercent}%
            </span>
          </div>
          <span className="text-[10px] text-gray-400 block mt-0.5">
            {latest.promoterPledgedPercent === 0 ? "Zero Pledge (Clean)" : "Shares as collateral"}
          </span>
        </div>
      </div>

      {/* ── Smart Signals / Institutional Insights ── */}
      {insights.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {insights.map((insight, idx) => (
            <div
              key={idx}
              className={`p-3.5 rounded-2xl border flex items-start gap-3 ${
                insight.type === "positive"
                  ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-300"
                  : insight.type === "warning"
                  ? "bg-amber-500/5 border-amber-500/20 text-amber-300"
                  : "bg-blue-500/5 border-blue-500/20 text-blue-300"
              }`}
            >
              <div className="mt-0.5 shrink-0">
                {insight.type === "positive" ? (
                  <CheckCircle2 size={16} className="text-emerald-400" />
                ) : insight.type === "warning" ? (
                  <AlertTriangle size={16} className="text-amber-400" />
                ) : (
                  <Info size={16} className="text-blue-400" />
                )}
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">{insight.title}</h4>
                <p className="text-[11px] text-gray-400 mt-0.5 leading-relaxed">{insight.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Historical Quarters Table (8 Quarters) ── */}
      <div className="overflow-x-auto rounded-3xl border border-white/10 bg-[#0e1626] shadow-xl">
        <div className="p-4 border-b border-white/[0.08] flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <PieChart size={16} className="text-blue-400" />
            Quarterly Ownership Trend (8 Quarters)
          </h3>
          <span className="text-[11px] text-gray-400">Values in %</span>
        </div>

        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-white/[0.08] bg-white/[0.02] text-[11px] uppercase tracking-wider text-gray-400">
              <th className="py-3 px-4 font-bold sticky left-0 bg-[#0e1626]">Category</th>
              {quarters.map((q, idx) => (
                <th key={idx} className="py-3 px-4 text-right font-mono font-bold whitespace-nowrap">
                  {q.period}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 font-mono text-gray-300">
            <tr className="hover:bg-white/[0.02]">
              <td className="py-3 px-4 font-sans font-bold text-blue-400 sticky left-0 bg-[#0e1626]">
                Promoters
              </td>
              {quarters.map((q, idx) => (
                <td key={idx} className="py-3 px-4 text-right font-bold text-white">
                  {q.promoter}%
                </td>
              ))}
            </tr>
            <tr className="hover:bg-white/[0.02]">
              <td className="py-2.5 px-4 font-sans font-bold text-emerald-400 sticky left-0 bg-[#0e1626]">
                FII (Foreign)
              </td>
              {quarters.map((q, idx) => (
                <td key={idx} className="py-2.5 px-4 text-right text-emerald-400">
                  {q.fii}%
                </td>
              ))}
            </tr>
            <tr className="hover:bg-white/[0.02]">
              <td className="py-2.5 px-4 font-sans font-bold text-teal-400 sticky left-0 bg-[#0e1626]">
                DII (Domestic)
              </td>
              {quarters.map((q, idx) => (
                <td key={idx} className="py-2.5 px-4 text-right text-teal-400">
                  {q.dii}%
                </td>
              ))}
            </tr>
            <tr className="hover:bg-white/[0.02]">
              <td className="py-2 px-4 font-sans text-gray-400 pl-8 sticky left-0 bg-[#0e1626]">
                ↳ Mutual Funds
              </td>
              {quarters.map((q, idx) => (
                <td key={idx} className="py-2 px-4 text-right text-gray-400">
                  {q.mutualFunds}%
                </td>
              ))}
            </tr>
            <tr className="hover:bg-white/[0.02]">
              <td className="py-2.5 px-4 font-sans text-gray-300 sticky left-0 bg-[#0e1626]">
                Public / Retail
              </td>
              {quarters.map((q, idx) => (
                <td key={idx} className="py-2.5 px-4 text-right text-gray-300">
                  {q.retailAndOthers}%
                </td>
              ))}
            </tr>
            <tr className="hover:bg-white/[0.02] bg-white/[0.01]">
              <td className="py-2.5 px-4 font-sans font-semibold text-amber-400 sticky left-0 bg-[#0e1626]">
                Promoter Pledge %
              </td>
              {quarters.map((q, idx) => (
                <td
                  key={idx}
                  className={`py-2.5 px-4 text-right font-bold ${
                    q.promoterPledgedPercent > 0 ? "text-amber-400" : "text-gray-500"
                  }`}
                >
                  {q.promoterPledgedPercent}%
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
