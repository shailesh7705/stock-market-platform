// client/src/pages/StockDetailsPage.jsx
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import AppLayout from "../components/layout/AppLayout";
import Card from "../components/ui/Card";
import {
  ArrowUpRight,
  ArrowDownRight,
  Bell,
  Bookmark,
  BookmarkCheck,
  ChevronLeft,
  Share2,
  TrendingUp,
} from "lucide-react";
import { motion } from "framer-motion";
import { getLiveStocks } from "../services/stockService";
import {
  addToWatchlist,
  removeFromWatchlist,
  getWatchlist,
} from "../services/watchlistService";
import StockDetailsChart from "../components/charts/StockDetailsChart";
import StockInsights from "../components/stocks/StockInsights";
import CreateAlertModal from "../components/alerts/CreateAlertModal";
import useWatchlistStore from "../store/watchlistStore";
import toast from "react-hot-toast";

function cleanSymbol(sym = "") {
  return sym.replace(".NS", "").replace(".BO", "").toUpperCase();
}

function StockDetailsPage() {
  const { symbol } = useParams();
  const [stock, setStock] = useState(null);
  const [loading, setLoading] = useState(true);
  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [inWatchlist, setInWatchlist] = useState(false);
  const [watchlistId, setWatchlistId] = useState(null);
  const [wlLoading, setWlLoading] = useState(false);

  const { watchlist, addStock, removeStock } = useWatchlistStore();

  const nsSymbol = symbol?.includes(".") ? symbol.toUpperCase() : `${symbol?.toUpperCase()}.NS`;
  const displaySymbol = cleanSymbol(symbol);

  useEffect(() => {
    fetchStock();
    checkWatchlist();
  }, [symbol]);

  const fetchStock = async () => {
    try {
      const data = await getLiveStocks([nsSymbol]);
      if (Array.isArray(data) && data.length > 0) {
        setStock(data[0]);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const checkWatchlist = async () => {
    try {
      const data = await getWatchlist();
      const found = (data || []).find(
        (s) => s.symbol === nsSymbol || cleanSymbol(s.symbol) === displaySymbol
      );
      if (found) {
        setInWatchlist(true);
        setWatchlistId(found._id);
      } else {
        setInWatchlist(false);
        setWatchlistId(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleWatchlistToggle = async () => {
    setWlLoading(true);
    try {
      if (inWatchlist && watchlistId) {
        await removeFromWatchlist(watchlistId);
        removeStock(watchlistId);
        setInWatchlist(false);
        setWatchlistId(null);
        toast.success(`${displaySymbol} removed from watchlist`);
      } else {
        const res = await addToWatchlist({
          symbol: nsSymbol,
          name: stock?.shortName || stock?.longName || displaySymbol,
        });
        addStock(res);
        setInWatchlist(true);
        setWatchlistId(res._id);
        toast.success(`${displaySymbol} added to watchlist!`, { icon: "⭐" });
      }
    } catch (err) {
      console.error(err);
      toast.error("Could not update watchlist");
    } finally {
      setWlLoading(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="max-w-7xl mx-auto space-y-6 animate-pulse">
          <div className="h-8 w-44 bg-white/5 rounded-xl" />
          <div className="h-16 w-80 bg-white/5 rounded-2xl" />
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            <div className="xl:col-span-8 h-96 bg-white/5 rounded-2xl" />
            <div className="xl:col-span-4 h-96 bg-white/5 rounded-2xl" />
          </div>
        </div>
      </AppLayout>
    );
  }

  const isPositive = stock?.positive;
  const changePercent = stock?.change ? stock.change.toFixed(2) : "0.00";

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-6 pb-12">
        {/* Breadcrumb Back Link */}
        <div className="flex items-center justify-between">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-white transition-colors"
          >
            <ChevronLeft size={16} /> Back to Dashboard
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
              Live Market Data
            </span>
          </div>
        </div>

        {/* Stock Hero Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-5 bg-[#0e1626] border border-white/[0.08] p-6 rounded-3xl"
        >
          {/* Left Title & Pricing */}
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl font-extrabold text-white tracking-tight">
                {displaySymbol}
              </h1>
              <span className="text-xs font-bold text-gray-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded-md">
                NSE · EQUITY
              </span>
              <div
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                  isPositive
                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                    : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                }`}
              >
                {isPositive ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                {isPositive ? "+" : ""}
                {changePercent}% Today
              </div>
            </div>

            <p className="text-sm text-gray-400 mt-1">
              {stock?.longName || stock?.shortName || displaySymbol}
            </p>

            <div className="flex items-baseline gap-3 mt-3">
              <span className="text-4xl font-extrabold text-white tracking-tight">
                ₹{stock?.price ? stock.price.toLocaleString("en-IN", { minimumFractionDigits: 2 }) : "—"}
              </span>
              <span className="text-xs text-gray-500">Real-time NSE Indian Rupee</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Watchlist Toggle */}
            <button
              onClick={handleWatchlistToggle}
              disabled={wlLoading}
              className={`h-11 px-5 rounded-2xl border flex items-center gap-2 font-bold text-xs transition-all disabled:opacity-50 ${
                inWatchlist
                  ? "bg-blue-500/15 border-blue-500/30 text-blue-400 hover:bg-blue-500/25"
                  : "bg-white/5 border-white/10 text-white hover:bg-white/10"
              }`}
            >
              {inWatchlist ? (
                <>
                  <BookmarkCheck size={16} /> Tracked in Watchlist
                </>
              ) : (
                <>
                  <Bookmark size={16} /> Add to Watchlist
                </>
              )}
            </button>

            {/* Set Alert Button */}
            <button
              onClick={() => setAlertModalOpen(true)}
              className="h-11 px-5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/25"
            >
              <Bell size={16} />
              Set Price Alert
            </button>
          </div>
        </motion.div>

        {/* Main Grid: Chart & Insights */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* Left Chart Card */}
          <div className="xl:col-span-8 space-y-6">
            <Card>
              <StockDetailsChart symbol={nsSymbol} />
            </Card>

            {/* Inline Quick Alert Trigger Card */}
            <div className="p-5 bg-gradient-to-r from-emerald-950/40 via-[#0e1626] to-[#0e1626] border border-emerald-500/20 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                  <Bell size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Want an email when {displaySymbol} hits your target?
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Our alert engine monitors prices every minute and sends an instant email notification.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setAlertModalOpen(true)}
                className="h-10 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold shrink-0 transition-all shadow-md shadow-emerald-500/20"
              >
                Create Alert Now
              </button>
            </div>
          </div>

          {/* Right Insights Column */}
          <div className="xl:col-span-4">
            <StockInsights stock={stock} />
          </div>
        </div>
      </div>

      {/* Alert Modal */}
      <CreateAlertModal
        open={alertModalOpen}
        onClose={() => setAlertModalOpen(false)}
        stock={{
          symbol: nsSymbol,
          price: stock?.price,
          name: stock?.shortName || displaySymbol,
        }}
      />
    </AppLayout>
  );
}

export default StockDetailsPage;
