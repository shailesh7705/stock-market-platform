// client/src/pages/MarketsPage.jsx
import React, { useEffect, useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import AppLayout from "../components/layout/AppLayout";
import CompanyLogo from "../components/ui/CompanyLogo";
import SEO from "../components/common/SEO";
import Disclaimer from "../components/common/Disclaimer";
import Skeleton from "../components/ui/Skeleton";
import EmptyState from "../components/ui/EmptyState";
import { formatCompactINR, formatPercent } from "../utils/format";
import useAuthStore from "../store/authStore";
import axios from "axios";
import toast from "react-hot-toast";
import {
  SlidersHorizontal,
  Download,
  Bookmark,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Search,
  Scale,
  RefreshCw,
  X,
  Check,
} from "lucide-react";

const SECTORS = [
  "Technology",
  "Financial Services",
  "Healthcare",
  "Consumer Defensive",
  "Consumer Cyclical",
  "Energy",
  "Industrials",
  "Basic Materials",
  "Utilities",
  "Real Estate",
  "Communication Services",
];

const PRESET_BUTTONS = [
  { id: "all", label: "All Equities" },
  { id: "high-roe", label: "High ROE Compounders" },
  { id: "coffee-can", label: "Coffee Can Leaders" },
  { id: "undervalued-value", label: "Undervalued Value" },
  { id: "dividend-aristocrats", label: "Dividend Aristocrats" },
  { id: "zero-debt", label: "Zero Debt" },
];

export default function MarketsPage() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const preset = params.get("preset") || "all";
  const [stocks, setStocks] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filterBuilderOpen, setFilterBuilderOpen] = useState(false);

  // Filter state
  const [search, setSearch] = useState("");
  const [minRoe, setMinRoe] = useState("");
  const [maxPe, setMaxPe] = useState("");
  const [minPulse, setMinPulse] = useState("");
  const [maxDebtToEquity, setMaxDebtToEquity] = useState("");
  const [minDividendYield, setMinDividendYield] = useState("");
  const [selectedSectors, setSelectedSectors] = useState([]);

  // Sorting
  const [sortBy, setSortBy] = useState("marketCap");
  const [sortOrder, setSortOrder] = useState("desc");

  // Selected for comparison
  const [selectedForCompare, setSelectedForCompare] = useState([]);

  // Saved screens
  const [savedScreens, setSavedScreens] = useState([]);
  const [screenName, setScreenName] = useState("");
  const [saveModalOpen, setSaveModalOpen] = useState(false);

  const fetchScreener = async () => {
    setLoading(true);
    try {
      const filters = {};
      if (search.trim()) filters.search = search.trim();
      if (minRoe) filters.roe = { min: Number(minRoe) };
      if (maxPe) filters.pe = { max: Number(maxPe) };
      if (minPulse) filters.pulseScore = { min: Number(minPulse) };
      if (maxDebtToEquity) filters.debtToEquity = { max: Number(maxDebtToEquity) };
      if (minDividendYield) filters.dividendYield = { min: Number(minDividendYield) };
      if (selectedSectors.length > 0) filters.sectors = selectedSectors;

      const res = await axios.post("/api/screener/query", {
        filters,
        preset: preset !== "all" ? preset : null,
        sortBy,
        sortOrder,
        page,
        limit: 50,
      });

      setStocks(res.data?.data || []);
      setTotal(res.data?.total || 0);
    } catch (err) {
      console.error("Screener query error:", err);
      toast.error("Failed to execute screener query");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScreener();
  }, [preset, sortBy, sortOrder, page, search, selectedSectors]);

  // Load user saved screens
  useEffect(() => {
    if (!user) return;
    axios
      .get("/api/screener/saved")
      .then((res) => setSavedScreens(res.data?.screens || []))
      .catch(() => {});
  }, [user]);

  const handlePresetSelect = (id) => {
    setPage(1);
    if (id === "all") {
      setParams({});
    } else {
      setParams({ preset: id });
    }
  };

  const handleExportCsv = async () => {
    try {
      const filters = {};
      if (minRoe) filters.roe = { min: Number(minRoe) };
      if (maxPe) filters.pe = { max: Number(maxPe) };
      if (minPulse) filters.pulseScore = { min: Number(minPulse) };
      if (selectedSectors.length > 0) filters.sectors = selectedSectors;

      const res = await axios.post(
        "/api/screener/query",
        {
          filters,
          preset: preset !== "all" ? preset : null,
          sortBy,
          sortOrder,
          format: "csv",
        },
        { responseType: "blob" }
      );

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `screener-${preset || "custom"}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("CSV export downloaded");
    } catch {
      toast.error("Failed to export CSV");
    }
  };

  const handleSaveScreen = async () => {
    if (!screenName.trim()) {
      toast.error("Please enter a screen name");
      return;
    }
    try {
      const filters = {
        roe: minRoe ? { min: Number(minRoe) } : undefined,
        pe: maxPe ? { max: Number(maxPe) } : undefined,
        pulseScore: minPulse ? { min: Number(minPulse) } : undefined,
        debtToEquity: maxDebtToEquity ? { max: Number(maxDebtToEquity) } : undefined,
        dividendYield: minDividendYield ? { min: Number(minDividendYield) } : undefined,
        sectors: selectedSectors.length > 0 ? selectedSectors : undefined,
      };

      const res = await axios.post("/api/screener/saved", {
        name: screenName.trim(),
        filters,
        sortBy,
        sortOrder,
      });

      setSavedScreens([res.data.screen, ...savedScreens.filter((s) => s.name !== screenName.trim())]);
      setSaveModalOpen(false);
      setScreenName("");
      toast.success("Screen saved successfully!");
    } catch {
      toast.error("Could not save screen");
    }
  };

  const toggleSector = (sec) => {
    if (selectedSectors.includes(sec)) {
      setSelectedSectors(selectedSectors.filter((s) => s !== sec));
    } else {
      setSelectedSectors([...selectedSectors, sec]);
    }
  };

  const toggleCompareSelect = (symbol) => {
    const clean = symbol.replace(".NS", "");
    if (selectedForCompare.includes(clean)) {
      setSelectedForCompare(selectedForCompare.filter((s) => s !== clean));
    } else {
      if (selectedForCompare.length >= 4) {
        toast.error("You can compare up to 4 stocks at a time");
        return;
      }
      setSelectedForCompare([...selectedForCompare, clean]);
    }
  };

  const handleLaunchCompare = () => {
    if (selectedForCompare.length === 0) return;
    navigate(`/compare?symbols=${selectedForCompare.join(",")}`);
  };

  return (
    <AppLayout>
      <SEO
        title="Full NSE Universe Screener & Market Discovery | StockPulse"
        description="Screen all NSE equities using valuation multiples, ROE, ROCE, debt ratios, technical indicators, and PulseScores. Save custom screens and export data."
        canonicalUrl="https://stockpulse.in/markets"
      />

      <div className="space-y-6 pb-12">
        {/* ── Header ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <SlidersHorizontal size={18} />
              </span>
              <p className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                Equity Screener
              </p>
            </div>
            <h1 className="text-3xl font-extrabold text-white mt-1">Full NSE Screener</h1>
            <p className="text-xs text-gray-400 mt-1">
              Filter across all 2,364+ NSE companies with custom ranges, algorithmic PulseScores and instant CSV export.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            {/* Compare Launch Button */}
            {selectedForCompare.length > 0 && (
              <button
                onClick={handleLaunchCompare}
                className="h-10 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-md shadow-blue-500/20 animate-in fade-in"
              >
                <Scale size={14} />
                Compare ({selectedForCompare.length})
              </button>
            )}

            {/* Filter Drawer Toggle */}
            <button
              onClick={() => setFilterBuilderOpen(!filterBuilderOpen)}
              className={`h-10 px-4 rounded-xl border flex items-center gap-2 text-xs font-bold transition-all ${
                filterBuilderOpen
                  ? "bg-amber-500 text-black border-amber-500"
                  : "bg-white/5 border-white/10 text-white hover:bg-white/10"
              }`}
            >
              <SlidersHorizontal size={14} />
              Filter Builder
              {filterBuilderOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {/* CSV Export */}
            <button
              onClick={handleExportCsv}
              className="h-10 px-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white transition-all text-xs font-bold flex items-center gap-1.5"
              title="Export results to CSV"
            >
              <Download size={14} />
              <span className="hidden sm:inline">Export</span>
            </button>

            {/* Save Screen Button */}
            {user && (
              <button
                onClick={() => setSaveModalOpen(true)}
                className="h-10 px-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white transition-all text-xs font-bold flex items-center gap-1.5"
                title="Save this screen"
              >
                <Bookmark size={14} />
                <span className="hidden sm:inline">Save</span>
              </button>
            )}
          </div>
        </div>

        {/* ── Quick Presets Bar ── */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {PRESET_BUTTONS.map((btn) => (
            <button
              key={btn.id}
              onClick={() => handlePresetSelect(btn.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                preset === btn.id
                  ? "bg-amber-500 text-black shadow-md shadow-amber-500/20"
                  : "bg-white/5 text-gray-400 hover:text-white border border-white/5"
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>

        {/* ── Expandable Filter Builder Drawer ── */}
        {filterBuilderOpen && (
          <div className="p-5 rounded-3xl bg-[#0c1424] border border-white/10 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <SlidersHorizontal size={16} className="text-amber-400" />
                Custom Filter Rules
              </h3>
              <button
                onClick={() => {
                  setMinRoe("");
                  setMaxPe("");
                  setMinPulse("");
                  setMaxDebtToEquity("");
                  setMinDividendYield("");
                  setSelectedSectors([]);
                  setSearch("");
                }}
                className="text-xs font-semibold text-gray-400 hover:text-white transition-colors"
              >
                Reset Filters
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-[11px] font-semibold text-gray-400 block mb-1">
                  Min ROE (%)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 15"
                  value={minRoe}
                  onChange={(e) => setMinRoe(e.target.value)}
                  className="w-full bg-[#080d1a] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-gray-400 block mb-1">
                  Max P/E Ratio
                </label>
                <input
                  type="number"
                  placeholder="e.g. 25"
                  value={maxPe}
                  onChange={(e) => setMaxPe(e.target.value)}
                  className="w-full bg-[#080d1a] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-gray-400 block mb-1">
                  Min PulseScore (0-100)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 65"
                  value={minPulse}
                  onChange={(e) => setMinPulse(e.target.value)}
                  className="w-full bg-[#080d1a] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-gray-400 block mb-1">
                  Max Debt to Equity
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 0.5"
                  value={maxDebtToEquity}
                  onChange={(e) => setMaxDebtToEquity(e.target.value)}
                  className="w-full bg-[#080d1a] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-amber-500/50"
                />
              </div>
            </div>

            {/* Sectors Checklist */}
            <div>
              <label className="text-[11px] font-semibold text-gray-400 block mb-2">
                Filter by Sectors
              </label>
              <div className="flex items-center gap-1.5 flex-wrap">
                {SECTORS.map((sec) => {
                  const isChecked = selectedSectors.includes(sec);
                  return (
                    <button
                      key={sec}
                      onClick={() => toggleSector(sec)}
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all ${
                        isChecked
                          ? "bg-blue-500/20 text-blue-300 border border-blue-500/40"
                          : "bg-white/5 text-gray-400 hover:text-white border border-transparent"
                      }`}
                    >
                      {sec}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={fetchScreener}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs shadow-md shadow-amber-500/20 transition-all flex items-center gap-1.5"
              >
                <RefreshCw size={13} />
                Apply Filters
              </button>
            </div>
          </div>
        )}

        {/* ── Search and Universe Stats ── */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative w-72">
            <Search size={14} className="absolute left-3.5 top-3 text-gray-500" />
            <input
              type="text"
              placeholder="Search symbol or name in screener..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#0c1424] border border-white/10 rounded-2xl pl-9 pr-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50"
            />
          </div>

          <span className="text-xs text-gray-400 font-mono">
            Showing <strong className="text-white">{stocks.length}</strong> of{" "}
            <strong className="text-white">{total}</strong> companies
          </span>
        </div>

        {/* ── Screener Table ── */}
        {loading ? (
          <div className="space-y-3">
            <Skeleton variant="card" height="56px" />
            <Skeleton variant="card" height="320px" />
          </div>
        ) : stocks.length === 0 ? (
          <EmptyState
            title="No Companies Matched"
            description="No stocks currently meet all criteria in this universe. Try broadening your filter ranges."
          />
        ) : (
          <div className="overflow-x-auto rounded-3xl border border-white/10 bg-[#0e1626] shadow-xl">
            <table className="w-full min-w-[850px] text-left text-xs">
              <thead className="text-[10px] uppercase tracking-wider text-gray-400 bg-white/[0.02] border-b border-white/[0.08]">
                <tr>
                  <th className="px-4 py-3.5 w-10 text-center">Compare</th>
                  <th className="px-4 py-3.5">Company</th>
                  <th
                    className="cursor-pointer hover:text-white"
                    onClick={() => {
                      setSortBy("pulseScore");
                      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                    }}
                  >
                    PulseScore {sortBy === "pulseScore" ? (sortOrder === "asc" ? "↑" : "↓") : ""}
                  </th>
                  <th
                    className="cursor-pointer hover:text-white"
                    onClick={() => {
                      setSortBy("price");
                      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                    }}
                  >
                    Price {sortBy === "price" ? (sortOrder === "asc" ? "↑" : "↓") : ""}
                  </th>
                  <th
                    className="cursor-pointer hover:text-white"
                    onClick={() => {
                      setSortBy("marketCap");
                      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                    }}
                  >
                    Market Cap {sortBy === "marketCap" ? (sortOrder === "asc" ? "↑" : "↓") : ""}
                  </th>
                  <th
                    className="cursor-pointer hover:text-white"
                    onClick={() => {
                      setSortBy("pe");
                      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                    }}
                  >
                    P/E {sortBy === "pe" ? (sortOrder === "asc" ? "↑" : "↓") : ""}
                  </th>
                  <th
                    className="cursor-pointer hover:text-white"
                    onClick={() => {
                      setSortBy("roe");
                      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                    }}
                  >
                    ROE % {sortBy === "roe" ? (sortOrder === "asc" ? "↑" : "↓") : ""}
                  </th>
                  <th>D/E</th>
                  <th>Yield %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono text-gray-300">
                {stocks.map((stock) => {
                  const cleanSym = stock.symbol.replace(".NS", "");
                  const isChecked = selectedForCompare.includes(cleanSym);

                  return (
                    <tr key={stock.symbol} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleCompareSelect(stock.symbol)}
                          className="rounded border-white/20 text-blue-500 focus:ring-0 cursor-pointer"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <Link to={`/stock/${cleanSym}`} className="flex items-center gap-3">
                          <CompanyLogo symbol={cleanSym} companyName={stock.companyName} size={32} />
                          <div>
                            <span className="block font-extrabold text-white hover:text-blue-400 transition-colors font-sans">
                              {cleanSym}
                            </span>
                            <span className="block text-[11px] text-gray-400 font-sans line-clamp-1">
                              {stock.companyName} · {stock.sector}
                            </span>
                          </div>
                        </Link>
                      </td>
                      <td className="font-bold text-amber-300 font-mono">
                        {stock.pulseScore !== null ? stock.pulseScore : "—"}
                      </td>
                      <td className="font-bold text-white">
                        ₹{Number(stock.price || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="text-gray-300">
                        {formatCompactINR(stock.marketCap)}
                      </td>
                      <td className="text-white">
                        {stock.pe ? Number(stock.pe).toFixed(1) : "—"}
                      </td>
                      <td className="text-teal-400 font-bold">
                        {stock.roe ? `${Number(stock.roe).toFixed(1)}%` : "—"}
                      </td>
                      <td className="text-gray-300">
                        {stock.debtToEquity !== null && stock.debtToEquity !== undefined ? stock.debtToEquity : "—"}
                      </td>
                      <td className="text-emerald-400 font-bold">
                        {stock.dividendYield ? `${Number(stock.dividendYield).toFixed(1)}%` : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <Disclaimer variant="full" className="mt-8" />
      </div>

      {/* ── Save Screen Modal ── */}
      {saveModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#0e1626] border border-white/10 rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-white">Save Custom Screen</h3>
              <button
                onClick={() => setSaveModalOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-gray-400">
              Save your active filters for instant access and alerts on qualifying stocks.
            </p>

            <input
              type="text"
              placeholder="e.g. My Multibagger Screen"
              value={screenName}
              onChange={(e) => setScreenName(e.target.value)}
              className="w-full bg-[#080d1a] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500/50"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setSaveModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-gray-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveScreen}
                className="px-4 py-2 rounded-xl bg-amber-500 text-black font-extrabold text-xs shadow-md shadow-amber-500/20"
              >
                Save Screen
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
