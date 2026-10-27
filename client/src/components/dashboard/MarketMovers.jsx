// client/src/components/dashboard/MarketMovers.jsx
import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../ui/Card";
import CompanyLogo from "../ui/CompanyLogo";
import { getMarketMovers } from "../../services/marketService";
import {
  TrendingUp,
  TrendingDown,
  Flame,
  Info,
  ExternalLink,
  RefreshCw,
  Clock,
  ShieldCheck,
  ChevronRight,
  BarChart3,
  Layers,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function cleanSymbol(sym = "") {
  return (sym || "").replace(".NS", "").replace(".BO", "").toUpperCase();
}

function formatINR(val) {
  if (val === undefined || val === null || isNaN(val)) return "—";
  return Number(val).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatVolume(vol) {
  if (!vol || isNaN(vol)) return "—";
  if (vol >= 10000000) return `${(vol / 10000000).toFixed(2)} Cr`;
  if (vol >= 100000) return `${(vol / 100000).toFixed(2)} L`;
  if (vol >= 1000) return `${(vol / 1000).toFixed(1)}k`;
  return vol.toLocaleString("en-IN");
}

// ─── Lightweight SVG Sparkline ────────────────────────────────────────────────
function Sparkline({ data = [], positive = true, width = 84, height = 24 }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data
    .map((val, i) => {
      const x = (i / (data.length - 1)) * (width - 4) + 2;
      const y = height - ((val - min) / range) * (height - 6) - 3;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  const strokeColor = positive ? "#10b981" : "#ef4444";

  return (
    <svg width={width} height={height} className="overflow-visible select-none shrink-0">
      <polyline
        fill="none"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

export default function MarketMovers() {
  const [capCategory, setCapCategory] = useState("large"); // "large" | "mid" | "small"
  const [directionTab, setDirectionTab] = useState("gainers"); // "gainers" | "losers"
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showMethodology, setShowMethodology] = useState(false);
  const navigate = useNavigate();

  const fetchMoversData = async () => {
    try {
      setLoading(true);
      const res = await getMarketMovers();
      setData(res);
    } catch (err) {
      console.error("[MarketMovers] Fetch failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMoversData();
    const interval = setInterval(fetchMoversData, 30000); // 30s auto-refresh
    return () => clearInterval(interval);
  }, []);

  // Current active stock list based on chosen Cap and Direction
  const currentStocks = useMemo(() => {
    if (!data) return [];

    // Support new categorized structure
    if (data.categories && data.categories[capCategory]) {
      const group = data.categories[capCategory];
      const list = directionTab === "gainers" ? group.gainers : group.losers;
      return Array.isArray(list) ? list : [];
    }

    // Fallback if flat array is returned
    const list = Array.isArray(data) ? data : data.stocks || [];
    if (directionTab === "gainers") {
      return [...list].sort((a, b) => b.change - a.change);
    }
    return [...list].sort((a, b) => a.change - b.change);
  }, [data, capCategory, directionTab]);

  const methodology = data?.methodology;
  const marketStatus = methodology?.marketStatus;

  return (
    <Card id="market-movers" className="lg:col-span-12 flex flex-col justify-between overflow-hidden">
      <div>
        {/* ── Top Header Bar ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Flame size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-white tracking-tight">
                  Today's Top Movers
                </h2>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                  NSE Realtime
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Top gainers & losers categorized by official SEBI market-cap benchmark
              </p>
            </div>
          </div>

          {/* Right Action: Refresh & Methodology Button */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowMethodology((p) => !p)}
              className={`h-9 px-3 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                showMethodology
                  ? "bg-white/15 border-white/25 text-white"
                  : "bg-white/5 border-white/10 text-gray-400 hover:text-white"
              }`}
              title="View SEBI Market Cap Classification Rules"
            >
              <Info size={13} />
              <span className="hidden sm:inline">SEBI Classification</span>
            </button>

            <button
              onClick={fetchMoversData}
              disabled={loading}
              className="h-9 w-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all disabled:opacity-50"
              title="Refresh Quotes"
            >
              <RefreshCw size={13} className={loading ? "animate-spin text-emerald-400" : ""} />
            </button>
          </div>
        </div>

        {/* ── Expandable SEBI Methodology Badge & Details ── */}
        <AnimatePresence>
          {showMethodology && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden bg-[#080d1a] border-b border-white/[0.06] p-4 text-xs"
            >
              <div className="flex items-start gap-3">
                <ShieldCheck className="text-emerald-400 shrink-0 mt-0.5" size={16} />
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">
                      SEBI Equity Categorization Methodology
                    </span>
                    <span className="text-[10px] text-gray-400 font-mono">
                      (Mutual Fund Regulations Benchmark)
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-1 text-gray-300">
                    <div className="bg-[#0e1626] border border-white/5 p-2 rounded-lg">
                      <span className="font-bold text-emerald-400">Large Cap:</span>{" "}
                      Top 100 stocks by full market capitalization (&gt; ₹50,000 Cr approx).
                    </div>
                    <div className="bg-[#0e1626] border border-white/5 p-2 rounded-lg">
                      <span className="font-bold text-blue-400">Mid Cap:</span>{" "}
                      101st – 250th stocks by market cap (₹15,000 – ₹50,000 Cr approx).
                    </div>
                    <div className="bg-[#0e1626] border border-white/5 p-2 rounded-lg">
                      <span className="font-bold text-purple-400">Small Cap:</span>{" "}
                      251st company onwards by market cap (&lt; ₹15,000 Cr approx).
                    </div>
                  </div>
                  <p className="text-[11px] text-gray-500 italic pt-1">
                    * Stocks with missing, stale, or unverified market capitalization data are strictly excluded from ranking calculations.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Controls Bar: Market-Cap Segmented Control & Direction Tabs ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 pb-4">
          {/* Segmented Control: Large Cap | Mid Cap | Small Cap */}
          <div className="flex items-center gap-1 bg-[#080d1a] border border-white/10 p-1 rounded-2xl w-full sm:w-auto">
            {[
              { id: "large", label: "Large Cap", count: data?.categories?.large?.all?.length || 20 },
              { id: "mid", label: "Mid Cap", count: data?.categories?.mid?.all?.length || 20 },
              { id: "small", label: "Small Cap", count: data?.categories?.small?.all?.length || 20 },
            ].map(({ id, label, count }) => (
              <button
                key={id}
                onClick={() => setCapCategory(id)}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  capCategory === id
                    ? "bg-white/15 text-white shadow-md border border-white/15"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <span>{label}</span>
                <span className="text-[10px] text-gray-400 font-mono opacity-80">
                  ({count})
                </span>
              </button>
            ))}
          </div>

          {/* Direction Tabs: Top Gainers vs Top Losers */}
          <div className="flex items-center gap-1 bg-[#080d1a] border border-white/10 p-1 rounded-2xl w-full sm:w-auto">
            <button
              onClick={() => setDirectionTab("gainers")}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                directionTab === "gainers"
                  ? "bg-emerald-500 text-black shadow-md shadow-emerald-500/20"
                  : "text-gray-400 hover:text-emerald-400"
              }`}
            >
              <TrendingUp size={13} />
              <span>Top Gainers</span>
            </button>

            <button
              onClick={() => setDirectionTab("losers")}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                directionTab === "losers"
                  ? "bg-rose-500 text-white shadow-md shadow-rose-500/20"
                  : "text-gray-400 hover:text-rose-400"
              }`}
            >
              <TrendingDown size={13} />
              <span>Top Losers</span>
            </button>
          </div>
        </div>

        {/* ── Table View (Desktop) & Cards (Mobile) ── */}
        {loading && !data ? (
          <div className="space-y-2 py-4">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 rounded-2xl bg-white/[0.03] animate-pulse" />
            ))}
          </div>
        ) : currentStocks.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-xs">
            No stocks found in this category for the current session.
          </div>
        ) : (
          <div>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/[0.06] text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                    <th className="py-3 px-3">Company & Ticker</th>
                    <th className="py-3 px-3 text-right">Price</th>
                    <th className="py-3 px-3 text-right">1D Change</th>
                    <th className="py-3 px-3 text-center">Session Trend</th>
                    <th className="py-3 px-3 text-right">Volume</th>
                    <th className="py-3 px-3 text-right">Market Cap</th>
                    <th className="py-3 px-3 text-center">Chart</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04] text-xs">
                  {currentStocks.map((stock) => {
                    const sym = cleanSymbol(stock.symbol);
                    const isPositive = stock.change >= 0;

                    return (
                      <tr
                        key={stock.symbol}
                        onClick={() => navigate(`/stock/${sym}`)}
                        className="hover:bg-white/[0.03] transition-colors cursor-pointer group"
                      >
                        {/* Company & Ticker */}
                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-3">
                            <CompanyLogo
                              symbol={stock.symbol}
                              companyName={stock.name}
                              size={38}
                            />
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-extrabold text-white text-[13px] group-hover:text-emerald-400 transition-colors">
                                  {sym}
                                </span>
                                <span className="text-[9px] font-semibold text-gray-400 bg-white/5 px-1 py-0.2 rounded">
                                  NSE
                                </span>
                              </div>
                              <p className="text-[11px] text-gray-400 truncate max-w-xs mt-0.5">
                                {stock.name}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Price */}
                        <td className="py-3.5 px-3 text-right font-mono font-bold text-white text-[13px]">
                          ₹{formatINR(stock.price)}
                        </td>

                        {/* 1D % Change & Absolute Change */}
                        <td className="py-3.5 px-3 text-right">
                          <div
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold font-mono ${
                              isPositive
                                ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                                : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                            }`}
                          >
                            {isPositive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                            {isPositive ? "+" : ""}
                            {stock.change ? stock.change.toFixed(2) : "0.00"}%
                          </div>
                          {stock.changeAmount !== undefined && (
                            <p className="text-[10px] text-gray-400 font-mono mt-0.5">
                              {stock.changeAmount >= 0 ? "+" : ""}₹{formatINR(stock.changeAmount)}
                            </p>
                          )}
                        </td>

                        {/* Sparkline */}
                        <td className="py-3.5 px-3 text-center">
                          <div className="flex justify-center">
                            <Sparkline
                              data={stock.sparkline || [stock.dayLow || stock.price, stock.price]}
                              positive={isPositive}
                              width={88}
                              height={24}
                            />
                          </div>
                        </td>

                        {/* Volume */}
                        <td className="py-3.5 px-3 text-right font-mono text-gray-300">
                          {formatVolume(stock.volume)}
                        </td>

                        {/* Market Cap */}
                        <td className="py-3.5 px-3 text-right font-mono font-semibold text-gray-200">
                          {stock.marketCapFormatted || "—"}
                        </td>

                        {/* Action / Click Link */}
                        <td className="py-3.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/stock/${sym}`);
                            }}
                            className="w-8 h-8 rounded-xl bg-white/5 hover:bg-emerald-500/20 text-gray-400 hover:text-emerald-400 flex items-center justify-center transition-all mx-auto"
                            title={`Open ${sym} Chart`}
                          >
                            <ExternalLink size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Responsive Cards View */}
            <div className="md:hidden space-y-3 pt-2">
              {currentStocks.map((stock) => {
                const sym = cleanSymbol(stock.symbol);
                const isPositive = stock.change >= 0;

                return (
                  <div
                    key={stock.symbol}
                    onClick={() => navigate(`/stock/${sym}`)}
                    className="p-3.5 rounded-2xl bg-[#080d1a] border border-white/5 active:scale-[0.99] transition-all cursor-pointer"
                  >
                    <div className="flex items-center justify-between gap-3 mb-2.5">
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <CompanyLogo symbol={stock.symbol} companyName={stock.name} size={36} />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1">
                            <span className="font-extrabold text-white text-xs">{sym}</span>
                            <span className="text-[9px] text-gray-500 bg-white/5 px-1 rounded">NSE</span>
                          </div>
                          <p className="text-[10px] text-gray-400 truncate">{stock.name}</p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="font-mono font-bold text-white text-sm">
                          ₹{formatINR(stock.price)}
                        </p>
                        <div
                          className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full mt-0.5 ${
                            isPositive
                              ? "bg-emerald-500/15 text-emerald-400"
                              : "bg-rose-500/15 text-rose-400"
                          }`}
                        >
                          {isPositive ? "+" : ""}
                          {stock.change ? stock.change.toFixed(2) : "0.00"}%
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-white/[0.04] text-[10px] font-mono text-gray-400">
                      <div>
                        Vol: <span className="text-gray-200">{formatVolume(stock.volume)}</span>
                      </div>
                      <div>
                        MCap:{" "}
                        <span className="text-gray-200">
                          {stock.marketCapFormatted || "—"}
                        </span>
                      </div>
                      <Sparkline
                        data={stock.sparkline || [stock.dayLow || stock.price, stock.price]}
                        positive={isPositive}
                        width={60}
                        height={18}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Footer Timestamp & Market Status ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-4 mt-4 border-t border-white/[0.06] text-[11px] text-gray-500">
        <div className="flex items-center gap-2">
          <Clock size={12} className="text-gray-400" />
          <span>
            Last updated:{" "}
            {methodology?.lastUpdated
              ? new Date(methodology.lastUpdated).toLocaleTimeString("en-IN", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                  hour12: true,
                })
              : "Just now"}
          </span>
          <span className="text-gray-600">·</span>
          <span className="text-gray-400">
            {marketStatus?.session || "Regular Trading Session"}
          </span>
        </div>

        <div className="text-[10px] text-gray-500">
          Rankings refreshed dynamically per trading volume &amp; quote changes
        </div>
      </div>
    </Card>
  );
}
