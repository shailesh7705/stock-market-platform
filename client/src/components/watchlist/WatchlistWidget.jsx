// client/src/components/watchlist/WatchlistWidget.jsx
import Card from "../ui/Card";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getWatchlist, removeFromWatchlist } from "../../services/watchlistService";
import { getLiveStocks } from "../../services/stockService";
import useWatchlistStore from "../../store/watchlistStore";
import { Trash2, Bell, Bookmark, ArrowRight, TrendingUp, TrendingDown, Plus } from "lucide-react";
import CreateAlertModal from "../alerts/CreateAlertModal";
import CompanyLogo from "../ui/CompanyLogo";
import Sparkline from "../ui/Sparkline";
import toast from "react-hot-toast";

function cleanSymbol(sym = "") {
  return sym.replace(".NS", "").replace(".BO", "").toUpperCase();
}

function WatchlistWidget() {
  const { watchlist, setWatchlist, removeStock } = useWatchlistStore();
  const watchlistRef = useRef(watchlist);
  watchlistRef.current = watchlist;
  const [loading, setLoading] = useState(true);
  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchWatchlist();
  }, []);

  useEffect(() => {
    const refresh = () => {
      if (watchlistRef.current?.length && document.visibilityState === "visible") {
        fetchLivePrices();
      }
    };
    refresh();
    const interval = setInterval(refresh, 20000);
    return () => clearInterval(interval);
  }, []);

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
      const current = watchlistRef.current || [];
      const symbols = current.map((s) => s.symbol);
      if (symbols.length === 0) return;
      const liveData = await getLiveStocks(symbols);
      const updated = current.map((stock) => {
        const live = liveData.find((item) => item.symbol === stock.symbol);
        if (!live) return stock;
        return {
          ...stock,
          price: `₹${live.price?.toFixed(2)}`,
          change: `${live.change >= 0 ? "+" : ""}${live.change?.toFixed(2)}%`,
          positive: live.positive,
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
      toast.error("Failed to remove from watchlist");
      fetchWatchlist();
    }
  };

  const previewStocks = (watchlist || []).slice(0, 5);

  return (
    <Card className="flex flex-col h-full bg-[#0b101d] border border-white/[0.06] rounded-3xl p-5 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Bookmark size={15} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide">Watchlist</h3>
            <p className="text-[11px] text-gray-400 font-mono">
              {watchlist?.length || 0} equities tracked
            </p>
          </div>
        </div>

        <Link
          to="/watchlist"
          className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors group"
        >
          View All
          <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {/* Content */}
      <div className="flex-1 mt-3">
        {loading ? (
          <div className="flex flex-col gap-2">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-16 rounded-2xl bg-white/[0.02] border border-white/[0.03] animate-pulse"
              />
            ))}
          </div>
        ) : previewStocks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center px-4">
            <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-gray-500 mb-3">
              <Bookmark size={20} />
            </div>
            <p className="text-xs font-semibold text-gray-300">Your watchlist is empty</p>
            <p className="text-[11px] text-gray-500 mt-1 max-w-[200px]">
              Use the search bar above to add stocks to track
            </p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {previewStocks.map((stock) => {
              const sym = cleanSymbol(stock.symbol);
              return (
                <motion.div
                  key={stock._id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 40 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => navigate(`/stock/${sym}`)}
                  className="flex items-center justify-between p-3 rounded-2xl bg-[#080d1a]/50 hover:bg-[#080d1a] border border-white/[0.04] hover:border-white/10 transition-all cursor-pointer group mb-2"
                >
                  {/* Left Symbol & Name with Logo */}
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <CompanyLogo symbol={sym} companyName={stock.name} size={32} />
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

                  {/* Sparkline mini chart */}
                  <div className="w-16 h-7 shrink-0 mx-2 hidden sm:flex items-center justify-center">
                    {Array.isArray(stock.data) && stock.data.length > 1 ? (
                      <Sparkline
                        data={stock.data}
                        positive={stock.positive}
                        width={64}
                        height={24}
                        strokeWidth={1.8}
                      />
                    ) : null}
                  </div>

                  {/* Price & Change */}
                  <div className="text-right shrink-0 mr-2">
                    <span className="text-xs font-bold text-white font-mono block">
                      {stock.price || "—"}
                    </span>
                    <span
                      className={`text-[10px] font-bold font-mono inline-flex items-center gap-0.5 ${
                        stock.positive ? "text-emerald-400" : "text-rose-400"
                      }`}
                    >
                      {stock.positive ? (
                        <TrendingUp size={11} />
                      ) : (
                        <TrendingDown size={11} />
                      )}
                      {stock.change || "0.00%"}
                    </span>
                  </div>

                  {/* Actions on hover */}
                  <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={(e) => handleOpenAlert(e, stock)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-amber-400 hover:bg-amber-400/10 transition-colors"
                      title="Set Alert"
                    >
                      <Bell size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleRemove(e, stock._id, stock.symbol)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-rose-400 hover:bg-rose-400/10 transition-colors"
                      title="Remove"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {/* Set Alert Modal */}
      {selectedStock && (
        <CreateAlertModal
          isOpen={alertModalOpen}
          onClose={() => {
            setAlertModalOpen(false);
            setSelectedStock(null);
          }}
          prefillStock={selectedStock}
        />
      )}
    </Card>
  );
}

export default WatchlistWidget;
