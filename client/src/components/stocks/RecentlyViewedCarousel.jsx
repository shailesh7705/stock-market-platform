// client/src/components/stocks/RecentlyViewedCarousel.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import CompanyLogo from "../ui/CompanyLogo";
import { ArrowUpRight, ArrowDownRight, Clock, ChevronRight } from "lucide-react";

const STORAGE_KEY = "stockpulse_recently_viewed";

export function saveRecentlyViewedStock(stock) {
  if (!stock || !stock.symbol) return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    let list = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(list)) list = [];

    const clean = stock.symbol.replace(".NS", "").replace(".BO", "").toUpperCase();
    const entry = {
      symbol: clean,
      rawSymbol: stock.symbol,
      name: stock.name || stock.shortName || clean,
      price: stock.price || 0,
      change: stock.change ?? 0,
      positive: stock.positive ?? (stock.change >= 0),
      score: stock.pulseScore?.score || stock.score || null,
      grade: stock.pulseScore?.grade || stock.grade || null,
      timestamp: Date.now(),
    };

    // Filter out existing and prepend new
    list = [entry, ...list.filter((item) => item.symbol !== clean)].slice(0, 6);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new Event("stockpulse_recent_updated"));
  } catch (err) {
    console.warn("Could not save recently viewed stock:", err);
  }
}

export default function RecentlyViewedCarousel({ currentSymbol }) {
  const [recentStocks, setRecentStocks] = useState([]);
  const navigate = useNavigate();

  const loadRecent = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const list = JSON.parse(raw);
        if (Array.isArray(list)) {
          setRecentStocks(list);
        }
      }
    } catch (e) {
      console.warn("Failed to load recently viewed stocks:", e);
    }
  };

  useEffect(() => {
    loadRecent();
    const handleUpdate = () => loadRecent();
    window.addEventListener("stockpulse_recent_updated", handleUpdate);
    return () => window.removeEventListener("stockpulse_recent_updated", handleUpdate);
  }, []);

  if (!recentStocks.length) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
          <Clock size={14} className="text-blue-400" />
          Recently Analyzed Equities
        </h3>
        <span className="text-[11px] text-gray-500 font-medium">Quick-Switch Terminal</span>
      </div>

      {/* Horizontal Strip */}
      <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/10">
        {recentStocks.map((item) => {
          const isCurrent = currentSymbol && item.symbol === currentSymbol.replace(".NS", "").replace(".BO", "").toUpperCase();
          const isPositive = item.positive ?? (item.change >= 0);

          return (
            <div
              key={item.symbol}
              onClick={() => navigate(`/stock/${item.symbol}`)}
              className={`shrink-0 flex items-center gap-3 px-3.5 py-2.5 rounded-2xl border transition-all cursor-pointer group ${
                isCurrent
                  ? "bg-blue-500/10 border-blue-500/40 ring-1 ring-blue-500/20 shadow-md shadow-blue-500/10"
                  : "bg-[#0e1626] border-white/[0.08] hover:bg-white/[0.04] hover:border-white/20"
              }`}
            >
              <CompanyLogo symbol={item.symbol} companyName={item.name} size={32} />

              <div className="min-w-0 pr-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors">
                    {item.symbol}
                  </span>
                  {item.grade && (
                    <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-white/5 border border-white/10 text-emerald-400 font-mono">
                      {item.score ? `${item.score}` : ""} {item.grade}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs font-extrabold text-white font-mono tabular-nums">
                    ₹{item.price ? Number(item.price).toLocaleString("en-IN", { minimumFractionDigits: 1, maximumFractionDigits: 2 }) : "—"}
                  </span>
                  <span
                    className={`text-[10px] font-bold font-mono inline-flex items-center gap-0.5 ${
                      isPositive ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {isPositive ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                    {isPositive ? "+" : ""}
                    {typeof item.change === "number" ? `${item.change.toFixed(2)}%` : item.change}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
