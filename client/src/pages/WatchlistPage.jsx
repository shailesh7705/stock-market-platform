// client/src/pages/WatchlistPage.jsx
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AppLayout from "../components/layout/AppLayout";
import Card from "../components/ui/Card";
import {
  Bookmark,
  Bell,
  Trash2,
  ExternalLink,
  TrendingUp,
  TrendingDown,
  Search,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
} from "lucide-react";
import { Sparklines, SparklinesLine } from "react-sparklines";
import { motion, AnimatePresence } from "framer-motion";
import { getWatchlist, removeFromWatchlist, addToWatchlist } from "../services/watchlistService";
import { getLiveStocks, searchStocks } from "../services/stockService";
import useWatchlistStore from "../store/watchlistStore";
import CreateAlertModal from "../components/alerts/CreateAlertModal";
import StockLogo from "../components/ui/StockLogo";
import toast from "react-hot-toast";

function cleanSymbol(sym = "") {
  return sym.replace(".NS", "").replace(".BO", "").toUpperCase();
}

function WatchlistPage() {
  const { watchlist, setWatchlist, removeStock, addStock } = useWatchlistStore();
  const [loading, setLoading] = useState(true);
  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [addQuery, setAddQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchWatchlist();
  }, []);

  useEffect(() => {
    if (!watchlist?.length) return;
    fetchLivePrices();
    const interval = setInterval(fetchLivePrices, 15000);
    return () => clearInterval(interval);
  }, [watchlist.length]);

  const fetchWatchlist = async () => {
    try {
      const data = await getWatchlist();
      setWatchlist(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLivePrices = async () => {
    try {
      const symbols = watchlist.map((s) => s.symbol);
      const liveData = await getLiveStocks(symbols);
      const updated = watchlist.map((stock) => {
        const live = liveData.find((item) => item.symbol === stock.symbol);
        if (!live) return stock;
        return {
          ...stock,
          price: `₹${live.price?.toFixed(2)}`,
          numericPrice: live.price,
          change: `${live.change >= 0 ? "+" : ""}${live.change?.toFixed(2)}%`,
          changePercent: live.change,
          positive: live.positive,
          dayHigh: live.high,
          dayLow: live.low,
          fiftyTwoWeekHigh: live.fiftyTwoWeekHigh,
          fiftyTwoWeekLow: live.fiftyTwoWeekLow,
        };
      });
      setWatchlist(updated);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenAlert = (e, stock) => {
    e.stopPropagation();
    setSelectedStock(stock);
    setAlertModalOpen(true);
  };

  const handleRemove = async (e, id, symbol) => {
    e.stopPropagation();
    try {
      removeStock(id);
      await removeFromWatchlist(id);
      toast.success(`${cleanSymbol(symbol)} removed from watchlist`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to remove stock");
      fetchWatchlist();
    }
  };

  // Quick search & add
  useEffect(() => {
    if (!addQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        setSearching(true);
        const data = await searchStocks(addQuery.trim());
        setSearchResults(data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setSearching(false);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [addQuery]);

  const handleQuickAdd = async (stock) => {
    if (watchlist.some((w) => w.symbol === stock.symbol)) {
      toast.error(`${cleanSymbol(stock.symbol)} is already tracked`);
      return;
    }
    try {
      const saved = await addToWatchlist({
        symbol: stock.symbol,
        name: stock.name,
      });
      addStock(saved);
      toast.success(`${cleanSymbol(stock.symbol)} added to watchlist!`);
      setAddQuery("");
      setSearchResults([]);
    } catch (err) {
      toast.error("Failed to add stock");
    }
  };

  const filteredWatchlist = (watchlist || []).filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return s.symbol.toLowerCase().includes(q) || (s.name || "").toLowerCase().includes(q);
  });

  const positiveCount = (watchlist || []).filter((s) => s.positive).length;
  const negativeCount = (watchlist || []).length - positiveCount;

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-6 pb-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-white tracking-tight">Watchlist</h1>
              <span className="text-xs font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2.5 py-0.5 rounded-full">
                {watchlist.length} Tracked
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Real-time NSE tracking with 1-click price target alerts
            </p>
          </div>

          {/* Quick Add Stock Input */}
          <div className="relative w-full md:w-80">
            <div className="relative flex items-center">
              <Search size={14} className="absolute left-3.5 text-gray-500" />
              <input
                type="text"
                placeholder="Search stock to add to watchlist..."
                value={addQuery}
                onChange={(e) => setAddQuery(e.target.value)}
                className="w-full h-10 rounded-xl bg-[#0e1626] border border-white/10 pl-9 pr-4 text-xs text-white outline-none focus:border-emerald-500/40 transition-all placeholder:text-gray-500 font-medium"
              />
            </div>

            {/* Quick Add Dropdown */}
            {searchResults.length > 0 && (
              <div className="absolute left-0 right-0 top-12 bg-[#0e1626] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden divide-y divide-white/[0.04] max-h-60 overflow-y-auto">
                {searchResults.map((stock) => (
                  <div
                    key={stock.symbol}
                    onClick={() => handleQuickAdd(stock)}
                    className="flex items-center justify-between px-3.5 py-2.5 hover:bg-white/5 cursor-pointer transition-colors"
                  >
                    <div>
                      <span className="text-xs font-bold text-white">{cleanSymbol(stock.symbol)}</span>
                      <p className="text-[11px] text-gray-400 truncate max-w-[200px]">{stock.name}</p>
                    </div>
                    <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded flex items-center gap-1">
                      <Plus size={11} /> Add
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="flex items-center gap-4 py-4 px-5">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
              <Bookmark size={22} />
            </div>
            <div>
              <p className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold">
                Total Assets
              </p>
              <p className="text-2xl font-extrabold text-white mt-0.5">{watchlist.length}</p>
            </div>
          </Card>

          <Card className="flex items-center gap-4 py-4 px-5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <TrendingUp size={22} />
            </div>
            <div>
              <p className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold">
                Gaining Today
              </p>
              <p className="text-2xl font-extrabold text-emerald-400 mt-0.5">{positiveCount}</p>
            </div>
          </Card>

          <Card className="flex items-center gap-4 py-4 px-5">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
              <TrendingDown size={22} />
            </div>
            <div>
              <p className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold">
                Declining Today
              </p>
              <p className="text-2xl font-extrabold text-rose-400 mt-0.5">{negativeCount}</p>
            </div>
          </Card>
        </div>

        {/* Watchlist Table */}
        <Card className="p-0 overflow-hidden border border-white/[0.08]">
          <div className="p-4 border-b border-white/[0.08] flex items-center justify-between">
            <h2 className="text-sm font-bold text-white">Tracked Equities</h2>
            <div className="w-64">
              <input
                type="text"
                placeholder="Filter watchlist..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-8 rounded-lg bg-[#080d1a] border border-white/10 px-3 text-xs text-white outline-none focus:border-emerald-500/40"
              />
            </div>
          </div>

          {loading ? (
            <div className="p-6 space-y-3 animate-pulse">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-16 rounded-xl bg-white/5" />
              ))}
            </div>
          ) : filteredWatchlist.length === 0 ? (
            <div className="text-center py-16 px-4">
              <Bookmark size={28} className="text-gray-600 mx-auto mb-3" />
              <p className="text-sm font-bold text-white mb-1">Your watchlist is empty</p>
              <p className="text-xs text-gray-500 max-w-sm mx-auto mb-4">
                Use the search box above to track any Indian NSE stock and monitor real-time prices.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {filteredWatchlist.map((stock) => {
                const sym = cleanSymbol(stock.symbol);
                return (
                  <div
                    key={stock._id}
                    onClick={() => navigate(`/stock/${sym}`)}
                    className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors cursor-pointer group"
                  >
                    {/* Left: Symbol & Name with Logo */}
                    <div className="flex items-center gap-3.5 min-w-0 md:w-1/3">
                      <StockLogo symbol={sym} name={stock.name} size={40} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">
                            {sym}
                          </span>
                          <span className="text-[10px] font-semibold text-gray-500 bg-white/5 px-1.5 py-0.2 rounded">
                            NSE
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 truncate mt-0.5">{stock.name}</p>
                      </div>
                    </div>

                    {/* Middle: Sparkline */}
                    <div className="w-24 h-8 shrink-0 hidden lg:block">
                      <Sparklines data={stock.data || [20, 25, 22, 30, 28, 35]} margin={2}>
                        <SparklinesLine
                          color={stock.positive ? "#10b981" : "#f43f5e"}
                          style={{ fill: "none", strokeWidth: 2 }}
                        />
                      </Sparklines>
                    </div>

                    {/* Right: Price, % Change & Actions */}
                    <div className="flex items-center justify-between md:justify-end gap-5">
                      <div className="text-right">
                        <p className="text-base font-extrabold text-white">{stock.price || "—"}</p>
                        <p
                          className={`text-xs font-bold inline-flex items-center gap-0.5 mt-0.5 ${
                            stock.positive ? "text-emerald-400" : "text-rose-400"
                          }`}
                        >
                          {stock.positive ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                          {stock.change || "0.00%"}
                        </p>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => handleOpenAlert(e, stock)}
                          className="h-9 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-xs font-bold flex items-center gap-1.5 transition-all border border-amber-500/20"
                          title="Set Price Alert"
                        >
                          <Bell size={13} />
                          <span className="hidden sm:inline">Set Alert</span>
                        </button>

                        <button
                          onClick={(e) => handleRemove(e, stock._id, stock.symbol)}
                          className="w-9 h-9 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 flex items-center justify-center transition-all"
                          title="Remove from Watchlist"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      <CreateAlertModal
        open={alertModalOpen}
        onClose={() => setAlertModalOpen(false)}
        stock={selectedStock}
      />
    </AppLayout>
  );
}

export default WatchlistPage;
