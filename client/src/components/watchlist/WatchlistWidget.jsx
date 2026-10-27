// client/src/components/watchlist/WatchlistWidget.jsx
import Card from "../ui/Card";
import { motion, AnimatePresence } from "framer-motion";
import { Sparklines, SparklinesLine } from "react-sparklines";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getWatchlist, removeFromWatchlist } from "../../services/watchlistService";
import { getLiveStocks } from "../../services/stockService";
import useWatchlistStore from "../../store/watchlistStore";
import { Trash2, Bell, Bookmark, ArrowRight, TrendingUp, TrendingDown, Plus } from "lucide-react";
import CreateAlertModal from "../alerts/CreateAlertModal";
import CompanyLogo from "../ui/CompanyLogo";
import toast from "react-hot-toast";

function cleanSymbol(sym = "") {
  return sym.replace(".NS", "").replace(".BO", "").toUpperCase();
}

function WatchlistWidget() {
  const { watchlist, setWatchlist, removeStock } = useWatchlistStore();
  const [loading, setLoading] = useState(true);
  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);
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
    <Card id="watchlist" className="lg:col-span-6 flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Bookmark size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Watchlist</h2>
              <p className="text-[11px] text-gray-500 mt-0.5">
                {watchlist.length} tracked equities
              </p>
            </div>
          </div>

          <Link
            to="/watchlist"
            className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
          >
            View All <ArrowRight size={13} />
          </Link>
        </div>

        {/* Stock List */}
        <div className="space-y-2">
          {loading ? (
            [0, 1, 2].map((i) => (
              <div key={i} className="h-14 rounded-2xl bg-white/5 animate-pulse" />
            ))
          ) : previewStocks.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 py-8 text-center">
              <Bookmark size={22} className="text-gray-600 mx-auto mb-2" />
              <p className="text-xs text-gray-400 font-medium">No stocks in watchlist</p>
              <p className="text-[11px] text-gray-600 mt-0.5">
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
                    className="flex items-center justify-between p-3 rounded-2xl bg-[#080d1a]/50 hover:bg-[#080d1a] border border-white/[0.04] hover:border-white/10 transition-all cursor-pointer group"
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
                    <div className="w-16 h-7 shrink-0 mx-2 hidden sm:block">
                      <Sparklines data={stock.data || [20, 25, 22, 30, 28, 35]} margin={2}>
                        <SparklinesLine
                          color={stock.positive ? "#10b981" : "#f43f5e"}
                          style={{ fill: "none", strokeWidth: 2 }}
                        />
                      </Sparklines>
                    </div>

                    {/* Price and actions */}
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <div className="text-right">
                        <p className="text-[13px] font-extrabold text-white">
                          {stock.price || "—"}
                        </p>
                        <p
                          className={`text-[11px] font-bold ${
                            stock.positive ? "text-emerald-400" : "text-rose-400"
                          }`}
                        >
                          {stock.change || "0.00%"}
                        </p>
                      </div>

                      {/* Quick alert */}
                      <button
                        onClick={(e) => handleOpenAlert(e, stock)}
                        className="w-7 h-7 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                        title="Set Alert"
                      >
                        <Bell size={13} />
                      </button>

                      {/* Remove */}
                      <button
                        onClick={(e) => handleRemove(e, stock._id, stock.symbol)}
                        className="w-7 h-7 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                        title="Remove from Watchlist"
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
      </div>

      <CreateAlertModal
        open={alertModalOpen}
        onClose={() => setAlertModalOpen(false)}
        stock={selectedStock}
      />
    </Card>
  );
}

export default WatchlistWidget;
