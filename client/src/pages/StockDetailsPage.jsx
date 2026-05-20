import { useEffect, useState } from "react";
import { useParams }           from "react-router-dom";
import AppLayout               from "../components/layout/AppLayout";
import Card                    from "../components/ui/Card";
import { ArrowUpRight, ArrowDownRight, Bell, Bookmark, BookmarkCheck } from "lucide-react";
import { motion }              from "framer-motion";
import { getLiveStocks }       from "../services/stockService";
import { addToWatchlist, removeFromWatchlist, getWatchlist } from "../services/watchlistService";
import StockDetailsChart       from "../components/charts/StockDetailsChart";
import StockInsights           from "../components/stocks/StockInsights";
import CreateAlertModal        from "../components/alerts/CreateAlertModal";
import { useToast, ToastContainer } from "../components/ui/Toast";
import useWatchlistStore       from "../store/watchlistStore";

function StockDetailsPage() {
  const { symbol }  = useParams();
  const toast       = useToast();

  const [stock,          setStock]          = useState(null);
  const [loading,        setLoading]        = useState(true);
  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [inWatchlist,    setInWatchlist]    = useState(false);
  const [watchlistId,    setWatchlistId]    = useState(null);
  const [wlLoading,      setWlLoading]      = useState(false);

  const { watchlist, addStock, removeStock } = useWatchlistStore();

  // FIX — ensure symbol always has .NS suffix for Yahoo Finance
  const nsSymbol = symbol?.includes(".")
    ? symbol
    : `${symbol}.NS`;

  useEffect(() => {
    fetchStock();
    checkWatchlist();
  }, [symbol]);

  const fetchStock = async () => {
    try {
      const data = await getLiveStocks([nsSymbol]);
      setStock(data[0]);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  // Check if already in watchlist
  const checkWatchlist = async () => {
    try {
      const data = await getWatchlist();
      const found = data.find(
        (s) => s.symbol === nsSymbol || s.symbol === symbol
      );
      if (found) {
        setInWatchlist(true);
        setWatchlistId(found._id);
      }
    } catch (err) {
      console.log(err);
    }
  };

  const handleWatchlist = async () => {
    setWlLoading(true);
    try {
      if (inWatchlist) {
        await removeFromWatchlist(watchlistId);
        removeStock(watchlistId);
        setInWatchlist(false);
        setWatchlistId(null);
        toast.info("Removed from watchlist", `${symbol} removed`);
      } else {
        const res = await addToWatchlist({
          symbol: nsSymbol,
          name:   stock?.shortName || stock?.longName || symbol,
        });
        addStock(res);
        setInWatchlist(true);
        setWatchlistId(res._id);
        toast.success("Added to watchlist", `${symbol} is now being tracked`);
      }
    } catch (err) {
      console.log(err);
      toast.error("Failed", "Could not update watchlist");
    } finally {
      setWlLoading(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="space-y-6 animate-pulse">
          <div className="h-10 w-64 bg-white/5 rounded-xl" />
          <div className="h-6  w-32 bg-white/5 rounded-xl" />
          <div className="h-80 w-full bg-white/5 rounded-2xl" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <ToastContainer toasts={toast.toasts} onRemove={toast.remove} />

      <div className="space-y-6">

        {/* ── Header ─────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0  }}
          className="flex flex-col lg:flex-row lg:items-center justify-between gap-5"
        >
          {/* Left */}
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl font-bold">
                {symbol?.replace(".NS", "").replace(".BO", "")}
              </h1>
              {stock?.shortName && (
                <span className="text-sm text-gray-500">{stock.shortName}</span>
              )}
              <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full
                               text-xs font-semibold
                               ${stock?.positive
                                 ? "bg-green-500/10 text-green-400 border border-green-500/20"
                                 : "bg-red-500/10 text-red-400 border border-red-500/20"}`}>
                {stock?.positive
                  ? <ArrowUpRight size={13} />
                  : <ArrowDownRight size={13} />}
                {stock?.change?.toFixed(2)}%
              </div>
            </div>

            <p className="text-4xl font-bold mt-3 text-white">
              ₹{stock?.price?.toFixed(2)}
            </p>
            <p className="text-gray-500 text-sm mt-1">Real-time market price</p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {/* FIX — Watchlist button wired up */}
            <button
              onClick={handleWatchlist}
              disabled={wlLoading}
              className={`h-11 px-5 rounded-xl border flex items-center gap-2
                          font-medium text-sm transition-all disabled:opacity-60
                          ${inWatchlist
                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
                            : "bg-white/5 border-white/10 text-white hover:bg-white/10"}`}
            >
              {inWatchlist
                ? <><BookmarkCheck size={16} /> Watching</>
                : <><Bookmark      size={16} /> Watchlist</>}
            </button>

            {/* FIX — Alert button opens CreateAlertModal */}
            <button
              onClick={() => setAlertModalOpen(true)}
              className="h-11 px-5 rounded-xl bg-green-500 hover:bg-green-400
                         text-black font-semibold flex items-center gap-2
                         transition-all shadow-lg shadow-green-500/20"
            >
              <Bell size={16} />
              Create Alert
            </button>
          </div>
        </motion.div>

        {/* ── Main Grid ──────────────────────────────────────────── */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">

          {/* Chart — FIX: pass symbol prop */}
          <Card className="xl:col-span-8">
            <StockDetailsChart symbol={nsSymbol} />
          </Card>

          {/* Insights */}
          <div className="xl:col-span-4 space-y-6">
            <StockInsights stock={stock} />
          </div>
        </div>
      </div>

      {/* FIX — Alert modal with real stock data */}
      <CreateAlertModal
        open={alertModalOpen}
        onClose={() => setAlertModalOpen(false)}
        stock={{
          symbol: nsSymbol,
          price:  stock?.price ? `₹${stock.price.toFixed(2)}` : null,
          name:   stock?.shortName || symbol,
        }}
      />
    </AppLayout>
  );
}

export default StockDetailsPage;