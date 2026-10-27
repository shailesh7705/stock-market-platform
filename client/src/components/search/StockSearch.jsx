// client/src/components/search/StockSearch.jsx
import { Search, Plus, Check, Bell, ExternalLink, X, TrendingUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { searchStocks } from "../../services/stockService";
import { addToWatchlist } from "../../services/watchlistService";
import useWatchlistStore from "../../store/watchlistStore";
import CreateAlertModal from "../alerts/CreateAlertModal";
import toast from "react-hot-toast";

function cleanSymbol(sym = "") {
  return sym.replace(".NS", "").replace(".BO", "").toUpperCase();
}

function StockSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [addingSymbol, setAddingSymbol] = useState("");
  const [alertStock, setAlertStock] = useState(null);

  const { watchlist, addStock } = useWatchlistStore();
  const navigate = useNavigate();
  const wrapperRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Debounced search
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 1) {
      setResults([]);
      setShowDropdown(false);
      setSelectedIndex(-1);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        const data = await searchStocks(trimmed);
        setResults(Array.isArray(data) ? data : []);
        setShowDropdown(true);
        setSelectedIndex(-1);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 180);

    return () => clearTimeout(timer);
  }, [query]);

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (!showDropdown || results.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      e.preventDefault();
      handleSelectStock(results[selectedIndex]);
    } else if (e.key === "Escape") {
      setShowDropdown(false);
    }
  };

  const handleSelectStock = (stock) => {
    setShowDropdown(false);
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
      const res = await addToWatchlist({
        symbol: stock.symbol,
        name: stock.name,
      });
      addStock(res);
      toast.success(`${cleanSymbol(stock.symbol)} added to watchlist!`, { icon: "⭐" });
    } catch (err) {
      toast.error("Could not add to watchlist");
    } finally {
      setAddingSymbol("");
    }
  };

  const handleOpenAlert = (e, stock) => {
    e.stopPropagation();
    setShowDropdown(false);
    setAlertStock(stock);
  };

  return (
    <>
      <div className="relative w-full" ref={wrapperRef}>
        {/* Search Input Box */}
        <div className="relative flex items-center">
          <Search size={15} className="absolute left-3.5 text-gray-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Search NSE stocks (e.g. Reliance, TCS, HDFC)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => {
              if (results.length > 0) setShowDropdown(true);
            }}
            onKeyDown={handleKeyDown}
            className="w-full h-10 rounded-xl bg-[#080d1a] border border-white/10 pl-9 pr-8 text-xs text-white outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all placeholder:text-gray-500 font-medium"
          />
          {query && (
            <button
              onClick={() => {
                setQuery("");
                setResults([]);
                setShowDropdown(false);
              }}
              className="absolute right-2.5 text-gray-500 hover:text-white transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Results Dropdown */}
        <AnimatePresence>
          {showDropdown && (
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.98 }}
              transition={{ duration: 0.15 }}
              className="absolute left-0 right-0 top-12 max-h-96 bg-[#0e1626] border border-white/10 rounded-2xl shadow-2xl shadow-black/80 z-50 overflow-hidden divide-y divide-white/[0.04]"
            >
              {loading ? (
                <div className="p-4 text-center text-xs text-gray-400 flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4 text-emerald-400" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.2" />
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                  Searching NSE stocks...
                </div>
              ) : results.length === 0 ? (
                <div className="p-4 text-center text-xs text-gray-500">
                  No matching stocks found for "{query}"
                </div>
              ) : (
                <div className="overflow-y-auto max-h-80 divide-y divide-white/[0.04]">
                  {results.map((stock, idx) => {
                    const sym = cleanSymbol(stock.symbol);
                    const isInWl = watchlist.some((w) => w.symbol === stock.symbol);
                    const isSelected = selectedIndex === idx;

                    return (
                      <div
                        key={stock.symbol}
                        onClick={() => handleSelectStock(stock)}
                        className={`flex items-center justify-between px-3.5 py-2.5 cursor-pointer transition-colors ${
                          isSelected ? "bg-white/10" : "hover:bg-white/[0.04]"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 font-bold text-[11px] flex items-center justify-center shrink-0 border border-emerald-500/20">
                            {sym.slice(0, 2)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-white group-hover:text-emerald-400">
                                {sym}
                              </span>
                              <span className="text-[9px] font-semibold text-gray-500 bg-white/5 px-1 py-0.2 rounded">
                                NSE
                              </span>
                            </div>
                            <p className="text-[11px] text-gray-400 truncate mt-0.5">
                              {stock.name}
                            </p>
                          </div>
                        </div>

                        {/* Quick Action Buttons */}
                        <div className="flex items-center gap-1 shrink-0 ml-2">
                          {/* Alert Trigger button */}
                          <button
                            type="button"
                            onClick={(e) => handleOpenAlert(e, stock)}
                            className="w-7 h-7 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 flex items-center justify-center transition-all"
                            title="Set Price Alert"
                          >
                            <Bell size={13} />
                          </button>

                          {/* Watchlist toggle button */}
                          <button
                            type="button"
                            onClick={(e) => handleAddWatchlist(e, stock)}
                            disabled={isInWl || addingSymbol === stock.symbol}
                            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                              isInWl
                                ? "bg-emerald-500/15 text-emerald-400 opacity-60"
                                : "bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white"
                            }`}
                            title={isInWl ? "Already in Watchlist" : "Add to Watchlist"}
                          >
                            {isInWl ? <Check size={13} /> : <Plus size={13} />}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Alert modal when triggered from search */}
      <CreateAlertModal
        open={Boolean(alertStock)}
        onClose={() => setAlertStock(null)}
        stock={alertStock}
      />
    </>
  );
}

export default StockSearch;
