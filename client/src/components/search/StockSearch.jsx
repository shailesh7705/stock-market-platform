// client/src/components/search/StockSearch.jsx
import {
  Search,
  Plus,
  Check,
  Bell,
  ExternalLink,
  X,
  TrendingUp,
  Sparkles,
  Command,
  ArrowRight,
  Flame,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { searchStocks } from "../../services/stockService";
import { addToWatchlist } from "../../services/watchlistService";
import useWatchlistStore from "../../store/watchlistStore";
import CreateAlertModal from "../alerts/CreateAlertModal";
import CompanyLogo from "../ui/CompanyLogo";
import toast from "react-hot-toast";

const POPULAR_SEARCHES = [
  { symbol: "RELIANCE.NS", name: "Reliance Industries Limited", tag: "NIFTY 50" },
  { symbol: "TCS.NS", name: "Tata Consultancy Services", tag: "IT Bluechip" },
  { symbol: "HDFCBANK.NS", name: "HDFC Bank Limited", tag: "Banking" },
  { symbol: "INFY.NS", name: "Infosys Limited", tag: "IT Growth" },
  { symbol: "BHARTIARTL.NS", name: "Bharti Airtel Limited", tag: "Telecom" },
  { symbol: "SUZLON.NS", name: "Suzlon Energy Limited", tag: "Energy" },
];

function cleanSymbol(sym = "") {
  return sym.replace(".NS", "").replace(".BO", "").toUpperCase();
}

export default function StockSearch({ inline = false, placeholder = "Search 2,360+ NSE stocks..." }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [addingSymbol, setAddingSymbol] = useState("");
  const [alertStock, setAlertStock] = useState(null);

  const { watchlist, addStock } = useWatchlistStore();
  const navigate = useNavigate();
  const inputRef = useRef(null);

  // Global Keyboard Shortcut: Ctrl+K or ⌘K
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [isOpen]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
      setResults([]);
      setSelectedIndex(-1);
    }
  }, [isOpen]);

  // Debounced Search
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 1) {
      setResults([]);
      setSelectedIndex(-1);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        const data = await searchStocks(trimmed);
        setResults(Array.isArray(data) ? data : []);
        setSelectedIndex(-1);
      } catch (err) {
        console.error("[StockSearch] Error:", err);
      } finally {
        setLoading(false);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [query]);

  // Arrow key navigation
  const handleKeyDown = (e) => {
    const list = results.length > 0 ? results : POPULAR_SEARCHES;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < list.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : list.length - 1));
    } else if (e.key === "Enter" && selectedIndex >= 0 && list[selectedIndex]) {
      e.preventDefault();
      handleSelectStock(list[selectedIndex]);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  const handleSelectStock = (stock) => {
    setIsOpen(false);
    setQuery("");
    const sym = cleanSymbol(stock.symbol);
    navigate(`/stock/${sym}`);
  };

  const handleAddWatchlist = async (e, stock) => {
    e.stopPropagation();
    const isAlready = watchlist.some((w) => w.symbol === stock.symbol);
    if (isAlready) {
      toast.error(`${cleanSymbol(stock.symbol)} is already in your watchlist`);
      return;
    }

    try {
      setAddingSymbol(stock.symbol);
      const added = await addToWatchlist(stock.symbol, stock.name);
      addStock(added);
      toast.success(`${cleanSymbol(stock.symbol)} added to watchlist`);
    } catch {
      toast.error("Failed to add to watchlist");
    } finally {
      setAddingSymbol("");
    }
  };

  const handleOpenAlert = (e, stock) => {
    e.stopPropagation();
    setIsOpen(false);
    setAlertStock(stock);
  };

  const displayedList = results.length > 0 ? results : [];

  return (
    <>
      {/* ── Navbar Trigger Pill (Unbreakable, Fixed & Sleek) ── */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="w-full h-9.5 px-3 rounded-xl bg-[#0f1422] hover:bg-[#131b2e] border border-white/[0.08] hover:border-white/20 flex items-center justify-between gap-2.5 transition-all text-gray-400 hover:text-gray-200 group select-none shadow-xs"
        title="Search stocks (Ctrl + K)"
      >
        <div className="flex items-center gap-2 min-w-0">
          <Search size={14} className="text-gray-400 group-hover:text-emerald-400 transition-colors shrink-0" />
          <span className="text-xs truncate font-medium text-gray-400 group-hover:text-gray-300">
            {placeholder}
          </span>
        </div>

        {/* Keyboard shortcut hint badge */}
        <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-white/[0.05] border border-white/10 text-[10px] font-mono text-gray-400 font-semibold group-hover:border-emerald-500/30 group-hover:text-emerald-400 transition-colors shrink-0">
          <span>Ctrl</span>
          <span>K</span>
        </kbd>
      </button>

      {/* ── Luxury Command Palette Modal Overlay (Raycast / Linear Style) ── */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-start justify-center pt-14 sm:pt-20 px-4">
            {/* Backdrop with Blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/75 backdrop-blur-md"
            />

            {/* Modal Dialog Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="relative w-full max-w-2xl bg-[#0e1422] border border-white/15 rounded-3xl shadow-2xl shadow-black/90 overflow-hidden divide-y divide-white/[0.08] z-10"
            >
              {/* Input Header */}
              <div className="relative flex items-center px-4 py-3.5 bg-[#0a0e17]">
                <Search size={18} className="text-emerald-400 shrink-0 mr-3" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search by company name or ticker (e.g. Reliance, TCS, HDFC)..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full bg-transparent text-sm font-medium text-white placeholder:text-gray-500 outline-none"
                />
                {query ? (
                  <button
                    onClick={() => {
                      setQuery("");
                      setResults([]);
                    }}
                    className="p-1 rounded-lg text-gray-500 hover:text-white transition-colors"
                  >
                    <X size={16} />
                  </button>
                ) : (
                  <span className="text-[10px] font-mono text-gray-500 bg-white/5 border border-white/10 px-1.5 py-0.5 rounded">
                    ESC to close
                  </span>
                )}
              </div>

              {/* Body: Results or Trending */}
              <div className="max-h-[380px] overflow-y-auto divide-y divide-white/[0.04]">
                {loading ? (
                  <div className="p-8 text-center text-xs text-gray-400 flex items-center justify-center gap-2">
                    <svg className="animate-spin w-4 h-4 text-emerald-400" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.2" />
                      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                    </svg>
                    Searching 2,360+ verified NSE equities...
                  </div>
                ) : query && displayedList.length === 0 ? (
                  <div className="p-8 text-center text-xs text-gray-500">
                    No matching stocks found for <span className="text-white font-semibold">"{query}"</span>
                  </div>
                ) : query && displayedList.length > 0 ? (
                  <div>
                    <div className="px-4 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider bg-white/[0.02]">
                      Search Results ({displayedList.length})
                    </div>
                    {displayedList.map((stock, idx) => {
                      const sym = cleanSymbol(stock.symbol);
                      const isInWl = watchlist.some((w) => w.symbol === stock.symbol);
                      const isSelected = selectedIndex === idx;

                      return (
                        <div
                          key={stock.symbol}
                          onClick={() => handleSelectStock(stock)}
                          className={`flex items-center justify-between px-4 py-3 cursor-pointer transition-colors group ${
                            isSelected ? "bg-white/10" : "hover:bg-white/[0.04]"
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <CompanyLogo symbol={stock.symbol} companyName={stock.name} size={36} />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-[13px] font-extrabold text-white group-hover:text-emerald-400 transition-colors">
                                  {sym}
                                </span>
                                <span className="text-[9px] font-semibold text-gray-400 bg-white/5 border border-white/10 px-1.5 py-0.2 rounded">
                                  NSE
                                </span>
                              </div>
                              <p className="text-xs text-gray-400 truncate mt-0.5">
                                {stock.name}
                              </p>
                            </div>
                          </div>

                          {/* Quick Actions */}
                          <div className="flex items-center gap-2 shrink-0 ml-3">
                            <button
                              type="button"
                              onClick={(e) => handleOpenAlert(e, stock)}
                              className="w-8 h-8 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 flex items-center justify-center transition-all"
                              title="Set Price Alert"
                            >
                              <Bell size={14} />
                            </button>

                            <button
                              type="button"
                              onClick={(e) => handleAddWatchlist(e, stock)}
                              disabled={isInWl || addingSymbol === stock.symbol}
                              className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                                isInWl
                                  ? "bg-emerald-500/20 text-emerald-400 opacity-60"
                                  : "bg-white/5 hover:bg-white/15 text-gray-300 hover:text-white"
                              }`}
                              title={isInWl ? "In Watchlist" : "Add to Watchlist"}
                            >
                              {isInWl ? <Check size={14} /> : <Plus size={14} />}
                            </button>

                            <div className="w-8 h-8 rounded-xl bg-white/5 hover:bg-emerald-500/20 text-gray-400 hover:text-emerald-400 flex items-center justify-center transition-all">
                              <ArrowRight size={14} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div>
                    {/* Trending Stocks Suggestion */}
                    <div className="px-4 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5 bg-white/[0.02]">
                      <Flame size={12} className="text-amber-400" />
                      <span>Trending NSE Equities</span>
                    </div>

                    <div className="divide-y divide-white/[0.04]">
                      {POPULAR_SEARCHES.map((stock, idx) => {
                        const sym = cleanSymbol(stock.symbol);
                        const isInWl = watchlist.some((w) => w.symbol === stock.symbol);
                        const isSelected = selectedIndex === idx;

                        return (
                          <div
                            key={stock.symbol}
                            onClick={() => handleSelectStock(stock)}
                            className={`flex items-center justify-between px-4 py-3 cursor-pointer transition-colors group ${
                              isSelected ? "bg-white/10" : "hover:bg-white/[0.04]"
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <CompanyLogo symbol={stock.symbol} companyName={stock.name} size={36} />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-[13px] font-extrabold text-white group-hover:text-emerald-400 transition-colors">
                                    {sym}
                                  </span>
                                  <span className="text-[9px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.2 rounded">
                                    {stock.tag}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-400 truncate mt-0.5">
                                  {stock.name}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0 ml-3">
                              <button
                                type="button"
                                onClick={(e) => handleAddWatchlist(e, stock)}
                                disabled={isInWl}
                                className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                                  isInWl
                                    ? "bg-emerald-500/20 text-emerald-400 opacity-60"
                                    : "bg-white/5 hover:bg-white/15 text-gray-300 hover:text-white"
                                }`}
                                title={isInWl ? "In Watchlist" : "Add to Watchlist"}
                              >
                                {isInWl ? <Check size={14} /> : <Plus size={14} />}
                              </button>
                              <div className="w-8 h-8 rounded-xl bg-white/5 group-hover:bg-emerald-500/20 text-gray-400 group-hover:text-emerald-400 flex items-center justify-center transition-all">
                                <ArrowRight size={14} />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer Controls */}
              <div className="flex items-center justify-between px-4 py-2.5 bg-[#0a0e17] text-[11px] text-gray-500">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 font-mono text-[9px]">↑</kbd>
                    <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 font-mono text-[9px]">↓</kbd>
                    to navigate
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 font-mono text-[9px]">↵</kbd>
                    to open
                  </span>
                </div>
                <span>Direct NSE Realtime Index</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Alert modal when triggered from search */}
      <CreateAlertModal
        open={Boolean(alertStock)}
        onClose={() => setAlertStock(null)}
        stock={alertStock}
      />
    </>
  );
}
