import Card from "../ui/Card";
import { motion, AnimatePresence } from "framer-motion";
import { Sparklines, SparklinesLine } from "react-sparklines";
import { useEffect, useState } from "react";
import { getWatchlist, removeFromWatchlist } from "../../services/watchlistService";
import { getLiveStocks } from "../../services/stockService";
import useWatchlistStore from "../../store/watchlistStore";
import { Trash2, Bell } from "lucide-react";
import CreateAlertModal from "../alerts/CreateAlertModal";
import { useNavigate } from "react-router-dom";
import StockLogo from "../ui/StockLogo";
function symbolInitials(symbol = "") {
  return symbol.replace(".NS", "").replace(".BO", "").slice(0, 2).toUpperCase();
}

function cleanSymbol(symbol = "") {
  return symbol.replace(".NS", "").replace(".BO", "");
}

function WatchlistWidget() {
  const { watchlist: stocks, setWatchlist, removeStock } = useWatchlistStore();
  const [loading, setLoading] = useState(true);
  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);
  const navigate = useNavigate();

  useEffect(() => { fetchWatchlist(); }, []);

  useEffect(() => {
    if (!stocks?.length) return;
    fetchLivePrices();
    const interval = setInterval(fetchLivePrices, 10000);
    return () => clearInterval(interval);
  }, [stocks.length]);

  const fetchWatchlist = async () => {
    try {
      const data = await getWatchlist();
      setWatchlist(data);
    } catch (error) {
      console.log("Watchlist Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLivePrices = async () => {
    try {
      const symbols = stocks.map((s) => s.symbol);
      const liveData = await getLiveStocks(symbols);
      const updated = stocks.map((stock) => {
        const live = liveData.find((item) => item.symbol === stock.symbol);
        if (!live) return stock;
        return {
          ...stock,
          price: `₹${live.price?.toFixed(2)}`,
          change: `${live.change?.toFixed(2)}%`,
          positive: live.positive,
        };
      });
      setWatchlist(updated);
    } catch (error) {
      console.log(error);
    }
  };

  const handleOpenAlert = (stock) => {
    setSelectedStock(stock);
    setAlertModalOpen(true);
  };

  const handleRemove = async (id) => {
    try {
      removeStock(id);
      await removeFromWatchlist(id);
    } catch (error) {
      console.log(error);
      fetchWatchlist();
    }
  };

  if (loading) {
    return (
      <Card className="lg:col-span-4">
        <div className="animate-pulse">
          <div className="h-5 w-28 rounded bg-white/10 mb-5" />
          <div className="space-y-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-14 rounded-xl bg-white/5" />
            ))}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card id="watchlist" className="lg:col-span-4 overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-bold">Watchlist</h2>
          <p className="text-[11px] text-gray-500 mt-0.5">Your tracked stocks</p>
        </div>

        {/* FIX #5 — navigate to /watchlist instead of scroll-to-self */}
        <button
          onClick={() => navigate("/watchlist")}
          className="text-green-400 text-xs hover:text-green-300 transition-colors"
        >
          View All →
        </button>
      </div>

      {/* Empty state */}
      {stocks?.length === 0 && (
        <div className="rounded-2xl border border-dashed border-white/10 py-10 text-center">
          <p className="text-gray-400 text-sm">No stocks in watchlist</p>
        </div>
      )}

      {/* Stock rows */}
      <div className="space-y-1">
        <AnimatePresence mode="popLayout">
          {stocks?.map((stock) => (
            <motion.div
              layout
              key={stock._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: 50 }}
              transition={{ duration: 0.2 }}
              onClick={() => navigate(`/stock/${stock.symbol}`)}
              whileHover={{ backgroundColor: "rgba(255,255,255,0.03)" }}
              className="group flex items-center justify-between rounded-xl
                         px-3 py-2.5 transition-all cursor-pointer min-w-0"
            >
              {/* LEFT */}
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <StockLogo symbol={stock.symbol} name={stock.name} size={36} />
                <div className="min-w-0">
                  <p className="text-[13px] font-bold text-white leading-none mb-0.5">
                    {cleanSymbol(stock.symbol)}
                  </p>
                  <p className="text-[11px] text-gray-500 truncate leading-none max-w-[120px]">
                    {stock.name}
                  </p>
                </div>
              </div>

              {/* SPARKLINE */}
              <div className="w-16 h-8 shrink-0 mx-2">
                <Sparklines data={stock.data || [5, 6, 7, 5, 8, 7, 9]} margin={2}>
                  <SparklinesLine
                    color={stock.positive ? "#22c55e" : "#f87171"}
                    style={{ fill: "none" }}
                  />
                </Sparklines>
              </div>

              {/* RIGHT */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="text-right min-w-[72px]">
                  <p className="text-[13px] font-bold text-white leading-none mb-0.5">
                    {stock.price || "—"}
                  </p>
                  <p className={`text-[11px] font-semibold leading-none
                    ${stock.positive ? "text-green-400" : "text-red-400"}`}>
                    {stock.positive ? "▲" : "▼"} {stock.change || "0.00%"}
                  </p>
                </div>

                <button
                  onClick={(e) => { e.stopPropagation(); handleOpenAlert(stock); }}
                  className="opacity-0 group-hover:opacity-100 transition-all w-8 h-8
                             rounded-lg flex items-center justify-center
                             bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 shrink-0"
                >
                  <Bell size={14} />
                </button>

                <button
                  onClick={(e) => { e.stopPropagation(); handleRemove(stock._id); }}
                  className="opacity-0 group-hover:opacity-100 transition-all w-8 h-8
                             rounded-lg flex items-center justify-center
                             bg-red-500/10 hover:bg-red-500/20 text-red-400 shrink-0"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
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