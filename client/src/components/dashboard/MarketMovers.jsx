// client/src/components/dashboard/MarketMovers.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../ui/Card";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Flame, BarChart2 } from "lucide-react";
import { getMarketMovers } from "../../services/marketService";

function cleanSymbol(sym = "") {
  return sym.replace(".NS", "").replace(".BO", "").toUpperCase();
}

function formatVolume(vol) {
  if (!vol) return "—";
  if (vol >= 10000000) return `${(vol / 10000000).toFixed(2)} Cr`;
  if (vol >= 100000) return `${(vol / 100000).toFixed(2)} L`;
  return vol.toLocaleString("en-IN");
}

function MarketMovers() {
  const [activeTab, setActiveTab] = useState("Gainers");
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchMovers();
    const interval = setInterval(fetchMovers, 20000);
    return () => clearInterval(interval);
  }, []);

  const fetchMovers = async () => {
    try {
      const data = await getMarketMovers();
      if (Array.isArray(data)) setStocks(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredStocks = () => {
    if (!stocks || stocks.length === 0) return [];
    if (activeTab === "Gainers") {
      return [...stocks].sort((a, b) => b.change - a.change).slice(0, 5);
    }
    if (activeTab === "Losers") {
      return [...stocks].sort((a, b) => a.change - b.change).slice(0, 5);
    }
    // Most Active by Volume
    return [...stocks].sort((a, b) => (b.volume || 0) - (a.volume || 0)).slice(0, 5);
  };

  return (
    <Card id="market-movers" className="lg:col-span-6 flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Flame size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Market Movers</h2>
              <p className="text-[11px] text-gray-500 mt-0.5">Top performing NSE equities</p>
            </div>
          </div>

          {/* Tab Selector */}
          <div className="flex items-center gap-1 bg-[#080d1a] border border-white/[0.08] p-1 rounded-xl">
            {["Gainers", "Losers", "Active"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === tab
                    ? "bg-emerald-500 text-black shadow-sm"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Stock List */}
        <div className="space-y-2">
          {loading ? (
            [0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="h-13 rounded-xl bg-white/5 animate-pulse" />
            ))
          ) : getFilteredStocks().length === 0 ? (
            <div className="text-center py-8 text-xs text-gray-500">
              Market movers data loading...
            </div>
          ) : (
            getFilteredStocks().map((stock) => {
              const sym = cleanSymbol(stock.symbol);
              const isPositive = stock.change >= 0;

              return (
                <div
                  key={stock.symbol}
                  onClick={() => navigate(`/stock/${sym}`)}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-[#080d1a]/50 hover:bg-[#080d1a] border border-white/[0.04] hover:border-white/10 transition-all cursor-pointer group"
                >
                  {/* Left: Symbol & Name */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/[0.07] flex items-center justify-center text-[10px] font-bold text-gray-300 shrink-0">
                      {sym.slice(0, 2)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[13px] font-bold text-white group-hover:text-emerald-400 transition-colors">
                          {sym}
                        </span>
                        <span className="text-[9px] font-semibold text-gray-500">NSE</span>
                      </div>
                      <p className="text-[11px] text-gray-400 truncate mt-0.5">
                        {stock.name}
                      </p>
                    </div>
                  </div>

                  {/* Right: Price & Percent Change */}
                  <div className="text-right shrink-0 ml-3">
                    <p className="text-[13px] font-extrabold text-white">
                      ₹{stock.price ? stock.price.toLocaleString("en-IN", { minimumFractionDigits: 2 }) : "—"}
                    </p>
                    <div
                      className={`inline-flex items-center gap-0.5 text-[11px] font-bold px-1.5 py-0.2 rounded mt-0.5 ${
                        isPositive
                          ? "text-emerald-400 bg-emerald-500/10"
                          : "text-rose-400 bg-rose-500/10"
                      }`}
                    >
                      {isPositive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                      {isPositive ? "+" : ""}
                      {stock.change ? stock.change.toFixed(2) : "0.00"}%
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </Card>
  );
}

export default MarketMovers;
