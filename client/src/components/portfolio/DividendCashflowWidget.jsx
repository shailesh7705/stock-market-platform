// client/src/components/portfolio/DividendCashflowWidget.jsx
import React from "react";
import { Link } from "react-router-dom";
import { Calendar, ArrowRight } from "lucide-react";

function formatINR(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

export default function DividendCashflowWidget({ summary }) {
  const income = summary?.annualDividendIncome || 0;
  const yoc = summary?.yieldOnCost || 0;
  const leaders = summary?.topDividendPayers || [];

  return (
    <div className="rounded-3xl border border-white/10 bg-[#0e1626] p-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-extrabold text-white">Dividend Cashflow</h2>
          <p className="text-[11px] text-gray-400 mt-0.5">Estimated from live exchange trailing dividends.</p>
        </div>
        <Link
          to="/events"
          className="text-[11px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
          title="View scheduled ex-dividend calendar"
        >
          Calendar <ArrowRight size={12} />
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-4">
        <div className="rounded-2xl bg-[#080d18] border border-white/10 p-3">
          <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Annual Cashflow</p>
          <p className="text-xl font-black text-emerald-300 font-mono mt-1">{formatINR(income)}</p>
        </div>
        <div className="rounded-2xl bg-[#080d18] border border-white/10 p-3">
          <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Yield on Cost</p>
          <p className="text-xl font-black text-amber-300 font-mono mt-1">{Number(yoc).toFixed(2)}%</p>
        </div>
      </div>

      <div className="mt-4">
        <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Top Dividend Payers</p>
        {leaders.length === 0 ? (
          <p className="text-xs text-gray-500 mt-2">None of the current holdings have a trailing dividend.</p>
        ) : (
          <div className="mt-2 space-y-1.5">
            {leaders.map((holding) => (
              <div key={holding.symbol} className="flex items-center justify-between text-xs">
                <span className="font-bold text-white">{holding.symbol.replace(".NS", "")}</span>
                <span className="font-mono text-emerald-300">{formatINR(holding.annualDividendCash)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
