// client/src/components/stocks/FinancialsTab.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import Card from "../ui/Card";
import Skeleton from "../ui/Skeleton";
import EmptyState from "../ui/EmptyState";
import { formatCompactINR, formatPercent } from "../../utils/format";
import {
  TrendingUp,
  FileSpreadsheet,
  PieChart,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle,
  HelpCircle,
  BarChart3,
  Calendar,
} from "lucide-react";

export default function FinancialsTab({ symbol }) {
  const [period, setPeriod] = useState("annual"); // "annual" | "quarterly"
  const [statementType, setStatementType] = useState("income"); // "income" | "balance" | "cashflow"
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    const fetchFinancials = async () => {
      try {
        const clean = symbol.replace(".NS", "").replace(".BO", "");
        const res = await axios.get(`/api/stocks/${clean}/financials?period=${period}`);
        if (active) {
          setData(res.data);
        }
      } catch (err) {
        if (active) {
          console.error("Failed to load financials:", err);
          setError(err.response?.data?.message || "Could not load financial statements.");
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchFinancials();
    return () => {
      active = false;
    };
  }, [symbol, period]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="h-24 bg-white/5 rounded-2xl" />
          <div className="h-24 bg-white/5 rounded-2xl" />
          <div className="h-24 bg-white/5 rounded-2xl" />
          <div className="h-24 bg-white/5 rounded-2xl" />
        </div>
        <div className="h-80 bg-white/5 rounded-3xl" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <EmptyState
        title="Financial Statements Unavailable"
        description={error || "Exchange filing history is not yet indexed for this symbol."}
      />
    );
  }

  const { incomeStatements = [], balanceSheets = [], cashFlowStatements = [], summary = {} } = data;

  const currentStatements =
    statementType === "income"
      ? incomeStatements
      : statementType === "balance"
      ? balanceSheets
      : cashFlowStatements;

  return (
    <div className="space-y-6">
      {/* ── Top Controls ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0a101d] border border-white/[0.08] p-4 rounded-2xl">
        {/* Statement Selector */}
        <div className="flex items-center gap-1.5 p-1 bg-white/[0.03] border border-white/5 rounded-xl overflow-x-auto">
          <button
            onClick={() => setStatementType("income")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              statementType === "income"
                ? "bg-blue-500 text-white shadow-md shadow-blue-500/20"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Income Statement (P&L)
          </button>
          <button
            onClick={() => setStatementType("balance")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              statementType === "balance"
                ? "bg-blue-500 text-white shadow-md shadow-blue-500/20"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Balance Sheet
          </button>
          <button
            onClick={() => setStatementType("cashflow")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              statementType === "cashflow"
                ? "bg-blue-500 text-white shadow-md shadow-blue-500/20"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Cash Flow
          </button>
        </div>

        {/* Period Selector (Annual vs Quarterly) */}
        <div className="flex items-center gap-1 p-1 bg-white/[0.03] border border-white/5 rounded-xl shrink-0">
          <button
            onClick={() => setPeriod("annual")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              period === "annual" ? "bg-amber-500 text-black shadow-sm" : "text-gray-400 hover:text-white"
            }`}
          >
            Annual
          </button>
          <button
            onClick={() => setPeriod("quarterly")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              period === "quarterly" ? "bg-amber-500 text-black shadow-sm" : "text-gray-400 hover:text-white"
            }`}
          >
            Quarterly
          </button>
        </div>
      </div>

      {/* ── Key Financial Ratios Bar ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
        <div className="p-4 rounded-2xl bg-[#0c1424] border border-white/10">
          <span className="text-[11px] font-semibold text-gray-400 block">ROCE</span>
          <span className="text-lg font-black text-emerald-400 font-mono mt-1 block">
            {summary.roce !== null ? `${summary.roce}%` : "—"}
          </span>
          <span className="text-[10px] text-gray-500 block mt-0.5">EBIT / Capital Employed</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#0c1424] border border-white/10">
          <span className="text-[11px] font-semibold text-gray-400 block">ROE</span>
          <span className="text-lg font-black text-teal-400 font-mono mt-1 block">
            {summary.roe !== null ? `${summary.roe}%` : "—"}
          </span>
          <span className="text-[10px] text-gray-500 block mt-0.5">Return on Equity</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#0c1424] border border-white/10">
          <span className="text-[11px] font-semibold text-gray-400 block">Operating Margin</span>
          <span className="text-lg font-black text-white font-mono mt-1 block">
            {summary.operatingMargin !== null ? `${summary.operatingMargin}%` : "—"}
          </span>
          <span className="text-[10px] text-gray-500 block mt-0.5">Core Efficiency</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#0c1424] border border-white/10">
          <span className="text-[11px] font-semibold text-gray-400 block">Debt to Equity</span>
          <span className="text-lg font-black text-amber-300 font-mono mt-1 block">
            {summary.debtToEquity !== null ? summary.debtToEquity : "—"}
          </span>
          <span className="text-[10px] text-gray-500 block mt-0.5">Solvency Multiple</span>
        </div>

        {summary.cagr3YRevenue !== null && (
          <div className="p-4 rounded-2xl bg-[#0c1424] border border-white/10 col-span-2 sm:col-span-1">
            <span className="text-[11px] font-semibold text-gray-400 block">3Y Revenue CAGR</span>
            <span className="text-lg font-black text-cyan-400 font-mono mt-1 block">
              {summary.cagr3YRevenue > 0 ? `+${summary.cagr3YRevenue}%` : `${summary.cagr3YRevenue}%`}
            </span>
            <span className="text-[10px] text-gray-500 block mt-0.5">Sales Compounding</span>
          </div>
        )}
      </div>

      {/* ── Statement Data Table ── */}
      <div className="overflow-x-auto rounded-3xl border border-white/10 bg-[#0e1626] shadow-xl">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-white/[0.08] bg-white/[0.02] text-[11px] uppercase tracking-wider text-gray-400">
              <th className="py-3.5 px-4 font-bold sticky left-0 bg-[#0e1626] z-10">Metric (INR)</th>
              {currentStatements.map((s, idx) => (
                <th key={idx} className="py-3.5 px-4 font-mono font-bold text-right whitespace-nowrap">
                  {s.endDate || `Period ${idx + 1}`}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 font-mono text-gray-300">
            {statementType === "income" && (
              <>
                <tr className="hover:bg-white/[0.02]">
                  <td className="py-3 px-4 font-sans font-bold text-white sticky left-0 bg-[#0e1626]">
                    Total Revenue
                  </td>
                  {currentStatements.map((s, i) => (
                    <td key={i} className="py-3 px-4 text-right font-bold text-white">
                      {formatCompactINR(s.totalRevenue)}
                    </td>
                  ))}
                </tr>
                <tr className="hover:bg-white/[0.02] text-xs">
                  <td className="py-2.5 px-4 font-sans text-gray-400 sticky left-0 bg-[#0e1626]">
                    Revenue Growth (YoY/QoQ)
                  </td>
                  {currentStatements.map((s, i) => (
                    <td
                      key={i}
                      className={`py-2.5 px-4 text-right font-bold ${
                        s.revenueGrowth > 0 ? "text-emerald-400" : s.revenueGrowth < 0 ? "text-rose-400" : "text-gray-500"
                      }`}
                    >
                      {s.revenueGrowth !== null && s.revenueGrowth !== undefined ? `${s.revenueGrowth > 0 ? "+" : ""}${s.revenueGrowth}%` : "—"}
                    </td>
                  ))}
                </tr>
                <tr className="hover:bg-white/[0.02]">
                  <td className="py-2.5 px-4 font-sans text-gray-300 sticky left-0 bg-[#0e1626]">
                    Operating Income (EBIT)
                  </td>
                  {currentStatements.map((s, i) => (
                    <td key={i} className="py-2.5 px-4 text-right">
                      {formatCompactINR(s.operatingIncome)}
                    </td>
                  ))}
                </tr>
                <tr className="hover:bg-white/[0.02]">
                  <td className="py-2.5 px-4 font-sans text-gray-300 sticky left-0 bg-[#0e1626]">
                    EBITDA
                  </td>
                  {currentStatements.map((s, i) => (
                    <td key={i} className="py-2.5 px-4 text-right">
                      {formatCompactINR(s.ebitda)}
                    </td>
                  ))}
                </tr>
                <tr className="hover:bg-white/[0.02] bg-emerald-500/[0.03]">
                  <td className="py-3 px-4 font-sans font-bold text-emerald-400 sticky left-0 bg-[#0e1626]">
                    Net Income (PAT)
                  </td>
                  {currentStatements.map((s, i) => (
                    <td key={i} className="py-3 px-4 text-right font-bold text-emerald-400">
                      {formatCompactINR(s.netIncome)}
                    </td>
                  ))}
                </tr>
                <tr className="hover:bg-white/[0.02]">
                  <td className="py-2.5 px-4 font-sans text-gray-400 sticky left-0 bg-[#0e1626]">
                    Net Margin %
                  </td>
                  {currentStatements.map((s, i) => (
                    <td key={i} className="py-2.5 px-4 text-right text-gray-300">
                      {s.netMargin !== null ? `${s.netMargin}%` : "—"}
                    </td>
                  ))}
                </tr>
                <tr className="hover:bg-white/[0.02]">
                  <td className="py-2.5 px-4 font-sans text-gray-400 sticky left-0 bg-[#0e1626]">
                    Diluted EPS
                  </td>
                  {currentStatements.map((s, i) => (
                    <td key={i} className="py-2.5 px-4 text-right text-amber-300">
                      {s.eps !== null ? `₹${Number(s.eps).toFixed(2)}` : "—"}
                    </td>
                  ))}
                </tr>
              </>
            )}

            {statementType === "balance" && (
              <>
                <tr className="hover:bg-white/[0.02]">
                  <td className="py-3 px-4 font-sans font-bold text-white sticky left-0 bg-[#0e1626]">
                    Total Assets
                  </td>
                  {currentStatements.map((s, i) => (
                    <td key={i} className="py-3 px-4 text-right font-bold text-white">
                      {formatCompactINR(s.totalAssets)}
                    </td>
                  ))}
                </tr>
                <tr className="hover:bg-white/[0.02]">
                  <td className="py-2.5 px-4 font-sans text-gray-300 sticky left-0 bg-[#0e1626]">
                    Current Assets
                  </td>
                  {currentStatements.map((s, i) => (
                    <td key={i} className="py-2.5 px-4 text-right">
                      {formatCompactINR(s.totalCurrentAssets)}
                    </td>
                  ))}
                </tr>
                <tr className="hover:bg-white/[0.02]">
                  <td className="py-2.5 px-4 font-sans text-gray-300 sticky left-0 bg-[#0e1626]">
                    Cash & Cash Equivalents
                  </td>
                  {currentStatements.map((s, i) => (
                    <td key={i} className="py-2.5 px-4 text-right text-teal-300">
                      {formatCompactINR(s.cash)}
                    </td>
                  ))}
                </tr>
                <tr className="hover:bg-white/[0.02]">
                  <td className="py-3 px-4 font-sans font-bold text-rose-300 sticky left-0 bg-[#0e1626]">
                    Total Liabilities
                  </td>
                  {currentStatements.map((s, i) => (
                    <td key={i} className="py-3 px-4 text-right font-bold text-rose-300">
                      {formatCompactINR(s.totalLiabilities)}
                    </td>
                  ))}
                </tr>
                <tr className="hover:bg-white/[0.02]">
                  <td className="py-2.5 px-4 font-sans text-gray-300 sticky left-0 bg-[#0e1626]">
                    Total Debt
                  </td>
                  {currentStatements.map((s, i) => (
                    <td key={i} className="py-2.5 px-4 text-right text-amber-300">
                      {formatCompactINR(s.totalDebt)}
                    </td>
                  ))}
                </tr>
                <tr className="hover:bg-white/[0.02] bg-blue-500/[0.03]">
                  <td className="py-3 px-4 font-sans font-bold text-blue-400 sticky left-0 bg-[#0e1626]">
                    Stockholder Equity (Net Worth)
                  </td>
                  {currentStatements.map((s, i) => (
                    <td key={i} className="py-3 px-4 text-right font-bold text-blue-400">
                      {formatCompactINR(s.stockholderEquity)}
                    </td>
                  ))}
                </tr>
              </>
            )}

            {statementType === "cashflow" && (
              <>
                <tr className="hover:bg-white/[0.02] bg-emerald-500/[0.03]">
                  <td className="py-3 px-4 font-sans font-bold text-emerald-400 sticky left-0 bg-[#0e1626]">
                    Operating Cash Flow (CFO)
                  </td>
                  {currentStatements.map((s, i) => (
                    <td key={i} className="py-3 px-4 text-right font-bold text-emerald-400">
                      {formatCompactINR(s.operatingCashFlow)}
                    </td>
                  ))}
                </tr>
                <tr className="hover:bg-white/[0.02]">
                  <td className="py-2.5 px-4 font-sans text-rose-300 sticky left-0 bg-[#0e1626]">
                    Capital Expenditure (Capex)
                  </td>
                  {currentStatements.map((s, i) => (
                    <td key={i} className="py-2.5 px-4 text-right text-rose-300">
                      {formatCompactINR(s.capitalExpenditures)}
                    </td>
                  ))}
                </tr>
                <tr className="hover:bg-white/[0.02] bg-teal-500/[0.03]">
                  <td className="py-3 px-4 font-sans font-bold text-teal-400 sticky left-0 bg-[#0e1626]">
                    Free Cash Flow (FCF)
                  </td>
                  {currentStatements.map((s, i) => (
                    <td key={i} className="py-3 px-4 text-right font-bold text-teal-400">
                      {formatCompactINR(s.freeCashFlow)}
                    </td>
                  ))}
                </tr>
                <tr className="hover:bg-white/[0.02]">
                  <td className="py-2.5 px-4 font-sans text-gray-300 sticky left-0 bg-[#0e1626]">
                    Investing Cash Flow
                  </td>
                  {currentStatements.map((s, i) => (
                    <td key={i} className="py-2.5 px-4 text-right">
                      {formatCompactINR(s.investingCashFlow)}
                    </td>
                  ))}
                </tr>
                <tr className="hover:bg-white/[0.02]">
                  <td className="py-2.5 px-4 font-sans text-gray-300 sticky left-0 bg-[#0e1626]">
                    Financing Cash Flow
                  </td>
                  {currentStatements.map((s, i) => (
                    <td key={i} className="py-2.5 px-4 text-right">
                      {formatCompactINR(s.financingCashFlow)}
                    </td>
                  ))}
                </tr>
              </>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
