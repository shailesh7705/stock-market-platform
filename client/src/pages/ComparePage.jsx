// client/src/pages/ComparePage.jsx
import React, { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import AppLayout from "../components/layout/AppLayout";
import CompanyLogo from "../components/ui/CompanyLogo";
import Skeleton from "../components/ui/Skeleton";
import EmptyState from "../components/ui/EmptyState";
import SEO from "../components/common/SEO";
import Disclaimer from "../components/common/Disclaimer";
import { formatCompactINR, formatPercent } from "../utils/format";
import axios from "axios";
import {
  Scale,
  Plus,
  X,
  Search,
  Sparkles,
  Award,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle,
} from "lucide-react";

export default function ComparePage() {
  const [params, setParams] = useSearchParams();
  const rawSymbols = params.get("symbols") || "RELIANCE,TCS,INFY";
  const [symbols, setSymbols] = useState(
    rawSymbols
      .split(",")
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean)
      .slice(0, 4)
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [compareData, setCompareData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sync state to URL params
  useEffect(() => {
    if (symbols.length > 0) {
      setParams({ symbols: symbols.join(",") });
    }
  }, [symbols]);

  // Load comparison data
  useEffect(() => {
    let active = true;
    if (symbols.length === 0) {
      setCompareData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const load = async () => {
      try {
        const res = await axios.get(`/api/stocks/compare?symbols=${symbols.join(",")}`);
        if (active) {
          setCompareData(res.data);
        }
      } catch (err) {
        console.error("Failed to compare stocks:", err);
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [symbols]);

  // Handle symbol search
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await axios.get(`/api/stocks/search?q=${encodeURIComponent(searchQuery)}`);
        setSearchResults(res.data || []);
      } catch {
        // Ignore
      } finally {
        setSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const addSymbol = (sym) => {
    const clean = sym.replace(".NS", "").toUpperCase();
    if (symbols.length < 4 && !symbols.includes(clean)) {
      setSymbols([...symbols, clean]);
      setSearchQuery("");
      setSearchResults([]);
    }
  };

  const removeSymbol = (sym) => {
    setSymbols(symbols.filter((s) => s !== sym));
  };

  const stocks = compareData?.stocks || [];
  const highlights = compareData?.highlights || {};

  return (
    <AppLayout>
      <SEO
        title={`Compare Stocks: ${symbols.join(" vs ")} | StockPulse`}
        description={`Side-by-side fundamentals, valuation multiples, PulseScore and performance comparison for ${symbols.join(", ")}.`}
        canonicalUrl={`https://stockpulse.in/compare?symbols=${symbols.join(",")}`}
      />

      <div className="max-w-7xl mx-auto space-y-6 pb-12">
        {/* ── Page Header ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Scale size={18} />
              </span>
              <p className="text-[11px] font-bold uppercase tracking-wider text-blue-400">
                Research Depth
              </p>
            </div>
            <h1 className="text-3xl font-extrabold text-white mt-1">Stock Comparison</h1>
            <p className="text-xs text-gray-400 mt-1">
              Analyze up to 4 companies side by side across valuation, profitability, balance sheet health and PulseScores.
            </p>
          </div>

          {/* Add Stock Search Input */}
          {symbols.length < 4 && (
            <div className="relative w-full sm:w-72">
              <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-[#0c1424] border border-white/10 focus-within:border-blue-500/50">
                <Search size={16} className="text-gray-400" />
                <input
                  type="text"
                  placeholder="Add stock to compare..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent text-xs text-white placeholder-gray-500 focus:outline-none w-full"
                />
              </div>

              {/* Search dropdown results */}
              {searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-[#0e1626] border border-white/10 rounded-2xl shadow-2xl z-30 max-h-60 overflow-y-auto divide-y divide-white/5">
                  {searchResults.slice(0, 6).map((item) => (
                    <button
                      key={item.symbol}
                      onClick={() => addSymbol(item.symbol)}
                      className="w-full text-left px-4 py-2.5 hover:bg-white/5 flex items-center justify-between transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <CompanyLogo symbol={item.symbol} size={24} />
                        <div>
                          <span className="text-xs font-bold text-white block">
                            {item.symbol.replace(".NS", "")}
                          </span>
                          <span className="text-[10px] text-gray-400 block line-clamp-1">
                            {item.companyName || item.name}
                          </span>
                        </div>
                      </div>
                      <Plus size={14} className="text-blue-400" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Active Symbols Chips ── */}
        <div className="flex items-center gap-2 flex-wrap">
          {symbols.map((sym) => (
            <div
              key={sym}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-white"
            >
              <CompanyLogo symbol={sym} size={18} />
              <span>{sym}</span>
              {symbols.length > 1 && (
                <button
                  onClick={() => removeSymbol(sym)}
                  className="text-gray-400 hover:text-white transition-colors p-0.5"
                  title="Remove stock"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          ))}
          <span className="text-xs text-gray-500">{symbols.length} / 4 stocks selected</span>
        </div>

        {/* ── Comparison Matrix Table ── */}
        {loading ? (
          <div className="space-y-4">
            <div className="h-32 bg-white/5 rounded-3xl animate-pulse" />
            <div className="h-96 bg-white/5 rounded-3xl animate-pulse" />
          </div>
        ) : stocks.length === 0 ? (
          <EmptyState
            title="No Stocks Selected"
            description="Use the search bar above to select stocks to compare side by side."
          />
        ) : (
          <div className="overflow-x-auto rounded-3xl border border-white/10 bg-[#0e1626] shadow-2xl">
            <table className="w-full text-left text-xs min-w-[700px]">
              <thead>
                <tr className="border-b border-white/[0.08] bg-white/[0.02]">
                  <th className="py-4 px-5 text-gray-400 uppercase tracking-wider text-[11px] font-bold w-1/4 sticky left-0 bg-[#0e1626] z-10">
                    Company
                  </th>
                  {stocks.map((stock) => (
                    <th key={stock.symbol} className="py-4 px-5 align-top">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <CompanyLogo symbol={stock.symbol} companyName={stock.name} size={36} />
                          <div>
                            <Link
                              to={`/stock/${stock.symbol}`}
                              className="text-sm font-extrabold text-white hover:text-blue-400 transition-colors"
                            >
                              {stock.symbol}
                            </Link>
                            <span className="text-[11px] text-gray-400 block line-clamp-1">
                              {stock.name}
                            </span>
                          </div>
                        </div>

                        {symbols.length > 1 && (
                          <button
                            onClick={() => removeSymbol(stock.symbol)}
                            className="text-gray-500 hover:text-white p-1"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>

                      <div className="mt-3 flex items-baseline gap-2 font-mono">
                        <span className="text-lg font-black text-white">
                          ₹{Number(stock.price || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </span>
                        <span
                          className={`text-xs font-bold ${
                            stock.change >= 0 ? "text-emerald-400" : "text-rose-400"
                          }`}
                        >
                          {stock.change >= 0 ? "+" : ""}
                          {stock.changePercent}%
                        </span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-white/5 font-mono text-gray-300">
                {/* ── Section: Valuation ── */}
                <tr className="bg-white/[0.02]">
                  <td
                    colSpan={stocks.length + 1}
                    className="py-2.5 px-5 text-[11px] font-bold uppercase tracking-wider text-blue-400 font-sans"
                  >
                    Valuation & Multiples
                  </td>
                </tr>
                <tr className="hover:bg-white/[0.02]">
                  <td className="py-3 px-5 font-sans font-bold text-gray-300 sticky left-0 bg-[#0e1626]">
                    P/E Ratio (TTM)
                  </td>
                  {stocks.map((s) => {
                    const isBest = highlights.lowestPE === s.symbol;
                    return (
                      <td key={s.symbol} className="py-3 px-5">
                        <div className="flex items-center gap-1.5">
                          <span className={isBest ? "text-emerald-400 font-bold" : "text-white"}>
                            {s.valuation?.pe ?? "—"}
                          </span>
                          {isBest && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 font-sans font-bold">
                              Lowest
                            </span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
                <tr className="hover:bg-white/[0.02]">
                  <td className="py-3 px-5 font-sans font-semibold text-gray-400 sticky left-0 bg-[#0e1626]">
                    Price to Book (P/B)
                  </td>
                  {stocks.map((s) => (
                    <td key={s.symbol} className="py-3 px-5 text-white">
                      {s.valuation?.pb ?? "—"}
                    </td>
                  ))}
                </tr>
                <tr className="hover:bg-white/[0.02]">
                  <td className="py-3 px-5 font-sans font-semibold text-gray-400 sticky left-0 bg-[#0e1626]">
                    Dividend Yield
                  </td>
                  {stocks.map((s) => (
                    <td key={s.symbol} className="py-3 px-5 text-emerald-400 font-bold">
                      {s.valuation?.dividendYield !== null ? `${s.valuation.dividendYield}%` : "—"}
                    </td>
                  ))}
                </tr>
                <tr className="hover:bg-white/[0.02]">
                  <td className="py-3 px-5 font-sans font-semibold text-gray-400 sticky left-0 bg-[#0e1626]">
                    Market Capitalization
                  </td>
                  {stocks.map((s) => (
                    <td key={s.symbol} className="py-3 px-5 text-white">
                      {formatCompactINR(s.marketCap)}
                    </td>
                  ))}
                </tr>

                {/* ── Section: Profitability ── */}
                <tr className="bg-white/[0.02]">
                  <td
                    colSpan={stocks.length + 1}
                    className="py-2.5 px-5 text-[11px] font-bold uppercase tracking-wider text-teal-400 font-sans"
                  >
                    Profitability & Capital Efficiency
                  </td>
                </tr>
                <tr className="hover:bg-white/[0.02]">
                  <td className="py-3 px-5 font-sans font-bold text-gray-300 sticky left-0 bg-[#0e1626]">
                    Return on Equity (ROE)
                  </td>
                  {stocks.map((s) => {
                    const isBest = highlights.highestROE === s.symbol;
                    return (
                      <td key={s.symbol} className="py-3 px-5">
                        <div className="flex items-center gap-1.5">
                          <span className={isBest ? "text-emerald-400 font-bold" : "text-white"}>
                            {s.profitability?.roe !== null ? `${s.profitability.roe}%` : "—"}
                          </span>
                          {isBest && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 font-sans font-bold">
                              Highest
                            </span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
                <tr className="hover:bg-white/[0.02]">
                  <td className="py-3 px-5 font-sans font-semibold text-gray-400 sticky left-0 bg-[#0e1626]">
                    Operating Margin %
                  </td>
                  {stocks.map((s) => (
                    <td key={s.symbol} className="py-3 px-5 text-white">
                      {s.profitability?.operatingMargin !== null ? `${s.profitability.operatingMargin}%` : "—"}
                    </td>
                  ))}
                </tr>
                <tr className="hover:bg-white/[0.02]">
                  <td className="py-3 px-5 font-sans font-semibold text-gray-400 sticky left-0 bg-[#0e1626]">
                    Net Margin %
                  </td>
                  {stocks.map((s) => (
                    <td key={s.symbol} className="py-3 px-5 text-white">
                      {s.profitability?.profitMargin !== null ? `${s.profitability.profitMargin}%` : "—"}
                    </td>
                  ))}
                </tr>

                {/* ── Section: Solvency & Health ── */}
                <tr className="bg-white/[0.02]">
                  <td
                    colSpan={stocks.length + 1}
                    className="py-2.5 px-5 text-[11px] font-bold uppercase tracking-wider text-amber-400 font-sans"
                  >
                    Financial Health & Solvency
                  </td>
                </tr>
                <tr className="hover:bg-white/[0.02]">
                  <td className="py-3 px-5 font-sans font-bold text-gray-300 sticky left-0 bg-[#0e1626]">
                    Debt to Equity
                  </td>
                  {stocks.map((s) => {
                    const isBest = highlights.lowestDebtToEquity === s.symbol;
                    return (
                      <td key={s.symbol} className="py-3 px-5">
                        <div className="flex items-center gap-1.5">
                          <span className={isBest ? "text-emerald-400 font-bold" : "text-white"}>
                            {s.health?.debtToEquity ?? "—"}
                          </span>
                          {isBest && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 font-sans font-bold">
                              Cleanest
                            </span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>

                {/* ── Section: PulseScore ── */}
                <tr className="bg-white/[0.02]">
                  <td
                    colSpan={stocks.length + 1}
                    className="py-2.5 px-5 text-[11px] font-bold uppercase tracking-wider text-purple-400 font-sans"
                  >
                    StockPulse Quantitative Intelligence
                  </td>
                </tr>
                <tr className="hover:bg-white/[0.02]">
                  <td className="py-3 px-5 font-sans font-bold text-gray-300 sticky left-0 bg-[#0e1626]">
                    PulseScore (100-pt Moat)
                  </td>
                  {stocks.map((s) => {
                    const isBest = highlights.highestPulseScore === s.symbol;
                    return (
                      <td key={s.symbol} className="py-3 px-5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-base font-black text-amber-300 font-mono">
                            {s.pulseScore?.score ?? "—"}
                          </span>
                          <span className="text-[11px] font-bold text-gray-400">
                            (Grade {s.pulseScore?.grade || "—"})
                          </span>
                          {isBest && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-400 font-sans font-bold">
                              Top Moat
                            </span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>

                {/* ── Section: Returns ── */}
                <tr className="bg-white/[0.02]">
                  <td
                    colSpan={stocks.length + 1}
                    className="py-2.5 px-5 text-[11px] font-bold uppercase tracking-wider text-emerald-400 font-sans"
                  >
                    Historical Returns
                  </td>
                </tr>
                <tr className="hover:bg-white/[0.02]">
                  <td className="py-3 px-5 font-sans font-semibold text-gray-400 sticky left-0 bg-[#0e1626]">
                    1 Month Return
                  </td>
                  {stocks.map((s) => (
                    <td
                      key={s.symbol}
                      className={`py-3 px-5 font-bold ${
                        s.returns?.return1M >= 0 ? "text-emerald-400" : "text-rose-400"
                      }`}
                    >
                      {s.returns?.return1M !== null ? `${s.returns.return1M >= 0 ? "+" : ""}${s.returns.return1M}%` : "—"}
                    </td>
                  ))}
                </tr>
                <tr className="hover:bg-white/[0.02]">
                  <td className="py-3 px-5 font-sans font-semibold text-gray-400 sticky left-0 bg-[#0e1626]">
                    6 Month Return
                  </td>
                  {stocks.map((s) => (
                    <td
                      key={s.symbol}
                      className={`py-3 px-5 font-bold ${
                        s.returns?.return6M >= 0 ? "text-emerald-400" : "text-rose-400"
                      }`}
                    >
                      {s.returns?.return6M !== null ? `${s.returns.return6M >= 0 ? "+" : ""}${s.returns.return6M}%` : "—"}
                    </td>
                  ))}
                </tr>
                <tr className="hover:bg-white/[0.02]">
                  <td className="py-3 px-5 font-sans font-semibold text-gray-400 sticky left-0 bg-[#0e1626]">
                    1 Year Return
                  </td>
                  {stocks.map((s) => (
                    <td
                      key={s.symbol}
                      className={`py-3 px-5 font-bold ${
                        s.returns?.return1Y >= 0 ? "text-emerald-400" : "text-rose-400"
                      }`}
                    >
                      {s.returns?.return1Y !== null ? `${s.returns.return1Y >= 0 ? "+" : ""}${s.returns.return1Y}%` : "—"}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}

        <Disclaimer variant="full" className="mt-8" />
      </div>
    </AppLayout>
  );
}
