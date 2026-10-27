// client/src/pages/AlertsPage.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AppLayout from "../components/layout/AppLayout";
import Card from "../components/ui/Card";
import {
  Bell,
  Plus,
  Trash2,
  CheckCircle2,
  Clock3,
  TrendingUp,
  TrendingDown,
  Mail,
  RefreshCw,
  ExternalLink,
  Search,
  Filter,
  AlertCircle,
  Play,
  Pause,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getAlerts, deleteAlert, toggleAlert, sendTestAlert } from "../services/alertService";
import { getLiveStocks } from "../services/stockService";
import useAlertStore from "../store/alertStore";
import useAuthStore from "../store/authStore";
import CreateAlertModal from "../components/alerts/CreateAlertModal";
import toast from "react-hot-toast";

function cleanSymbol(sym = "") {
  return sym.replace(".NS", "").replace(".BO", "").toUpperCase();
}

function formatCurrency(val) {
  if (val === undefined || val === null || isNaN(val)) return "—";
  return Number(val).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatRelativeTime(date) {
  if (!date) return "";
  const diff = Math.floor((Date.now() - new Date(date)) / 60000);
  if (diff < 1) return "Just now";
  if (diff < 60) return `${diff}m ago`;
  const h = Math.floor(diff / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function AlertsPage() {
  const { alerts, setAlerts, removeAlert } = useAlertStore();
  const { user } = useAuthStore();
  const [livePrices, setLivePrices] = useState({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // "all" | "active" | "triggered"
  const [searchQuery, setSearchQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalStock, setModalStock] = useState(null);
  const [testingEmail, setTestingEmail] = useState(false);

  useEffect(() => {
    fetchAlertsData();
    const interval = setInterval(fetchAlertsData, 15000);
    return () => clearInterval(interval);
  }, []);

  const fetchAlertsData = async () => {
    try {
      const data = await getAlerts();
      setAlerts(data);

      // Fetch live prices for distinct symbols
      if (Array.isArray(data) && data.length > 0) {
        const uniqueSymbols = [...new Set(data.map((a) => a.symbol))];
        const live = await getLiveStocks(uniqueSymbols);
        const map = {};
        for (const item of live) {
          if (item?.symbol) map[item.symbol] = item.price;
        }
        setLivePrices(map);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, symbol) => {
    try {
      removeAlert(id);
      await deleteAlert(id);
      toast.success(`Alert for ${cleanSymbol(symbol)} deleted`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete alert");
      fetchAlertsData();
    }
  };

  const handleToggle = async (id, symbol) => {
    try {
      const updated = await toggleAlert(id);
      const updatedList = alerts.map((a) => (a._id === id ? updated : a));
      setAlerts(updatedList);
      toast.success(
        updated.triggered
          ? "Alert triggered"
          : updated.active
          ? `Alert for ${cleanSymbol(symbol)} re-armed`
          : `Alert paused`
      );
    } catch (err) {
      console.error(err);
      toast.error("Failed to update alert");
    }
  };

  const handleSendTestEmail = async () => {
    try {
      setTestingEmail(true);
      await sendTestAlert({
        symbol: "RELIANCE.NS",
        targetPrice: 1300,
        condition: "above",
      });
      toast.success(`Verification email sent to ${user?.email || "your email"}! Check your inbox.`);
    } catch (err) {
      console.error(err);
      toast.error("Could not send test email. Please check server logs.");
    } finally {
      setTestingEmail(false);
    }
  };

  // Filtered alerts
  const filteredAlerts = (alerts || []).filter((alert) => {
    if (filter === "active" && (alert.triggered || alert.active === false)) return false;
    if (filter === "triggered" && !alert.triggered) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchSymbol = alert.symbol.toLowerCase().includes(q);
      const matchNotes = (alert.notes || "").toLowerCase().includes(q);
      if (!matchSymbol && !matchNotes) return false;
    }
    return true;
  });

  const totalCount = alerts?.length || 0;
  const triggeredCount = alerts?.filter((a) => a.triggered).length || 0;
  const activeCount = totalCount - triggeredCount;

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-6 pb-12">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-white tracking-tight">Stock Price Alerts</h1>
              <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                Realtime Cron Active
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Monitored every 60 seconds with instant email triggers to{" "}
              <strong className="text-gray-200">{user?.email}</strong>
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Test Email Button */}
            <button
              onClick={handleSendTestEmail}
              disabled={testingEmail}
              className="h-10 px-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white text-xs font-semibold flex items-center gap-2 transition-all disabled:opacity-50"
              title="Verify your email integration with a test alert"
            >
              <Mail size={14} className={testingEmail ? "animate-bounce text-blue-400" : "text-blue-400"} />
              {testingEmail ? "Sending..." : "Test Email Alert"}
            </button>

            {/* Create Alert Button */}
            <button
              onClick={() => {
                setModalStock({ symbol: "RELIANCE.NS", price: livePrices["RELIANCE.NS"] || 1200 });
                setModalOpen(true);
              }}
              className="h-10 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20"
            >
              <Plus size={15} />
              Set Price Alert
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="flex items-center gap-4 py-4 px-5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
              <Clock3 size={22} />
            </div>
            <div>
              <p className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold">
                Active Monitoring
              </p>
              <p className="text-2xl font-extrabold text-white mt-0.5">{activeCount}</p>
            </div>
          </Card>

          <Card className="flex items-center gap-4 py-4 px-5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <CheckCircle2 size={22} />
            </div>
            <div>
              <p className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold">
                Target Hits Triggered
              </p>
              <p className="text-2xl font-extrabold text-white mt-0.5">{triggeredCount}</p>
            </div>
          </Card>

          <Card className="flex items-center gap-4 py-4 px-5">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
              <Bell size={22} />
            </div>
            <div>
              <p className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold">
                Total Tracked
              </p>
              <p className="text-2xl font-extrabold text-white mt-0.5">{totalCount}</p>
            </div>
          </Card>
        </div>

        {/* Filters and Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          {/* Tabs */}
          <div className="flex items-center gap-1 bg-[#0e1626] border border-white/10 p-1 rounded-xl w-full sm:w-auto">
            {[
              { id: "all", label: `All (${totalCount})` },
              { id: "active", label: `Active (${activeCount})` },
              { id: "triggered", label: `Triggered (${triggeredCount})` },
            ].map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setFilter(id)}
                className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  filter === id
                    ? "bg-emerald-500 text-black shadow-md"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Filter by symbol or note..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 rounded-xl bg-[#0e1626] border border-white/10 pl-9 pr-3 text-xs text-white outline-none focus:border-emerald-500/40 transition-all placeholder:text-gray-600"
            />
          </div>
        </div>

        {/* Alerts List */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-44 rounded-2xl bg-[#0e1626] border border-white/5 p-5" />
            ))}
          </div>
        ) : filteredAlerts.length === 0 ? (
          <Card className="text-center py-16 px-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mx-auto mb-4">
              <Bell size={26} />
            </div>
            <h3 className="text-base font-bold text-white mb-1">No alerts found</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto mb-6">
              {filter === "all"
                ? "You haven't created any price alerts yet. Pick a stock to monitor and receive instant email triggers."
                : `No ${filter} alerts matching your search criteria.`}
            </p>
            <button
              onClick={() => {
                setModalStock({ symbol: "RELIANCE.NS", price: livePrices["RELIANCE.NS"] || 1200 });
                setModalOpen(true);
              }}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold inline-flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20"
            >
              <Plus size={14} /> Set Your First Alert
            </button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence mode="popLayout">
              {filteredAlerts.map((alert) => {
                const sym = cleanSymbol(alert.symbol);
                const current = livePrices[alert.symbol];
                const isTriggered = alert.triggered;
                const isAbove = alert.condition === "above";

                // Calculate distance to target if current price is available
                let distanceText = "";
                let distancePercent = 0;
                if (current && !isTriggered) {
                  const diff = alert.targetPrice - current;
                  const pct = ((diff / current) * 100).toFixed(1);
                  distancePercent = Math.min(100, Math.max(0, 100 - Math.abs(parseFloat(pct))));
                  distanceText = `${Math.abs(parseFloat(pct))}% ${diff > 0 ? "away" : "surpassed"}`;
                }

                return (
                  <motion.div
                    key={alert._id}
                    layout
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card
                      className={`relative overflow-hidden flex flex-col justify-between h-full border ${
                        isTriggered
                          ? "border-emerald-500/30 bg-[#0c1a24]/90"
                          : alert.active === false
                          ? "border-white/5 opacity-60"
                          : "border-white/[0.08] hover:border-white/20"
                      }`}
                    >
                      {/* Top status indicator line */}
                      <div
                        className={`absolute top-0 left-0 right-0 h-[2px] ${
                          isTriggered
                            ? "bg-emerald-500"
                            : alert.active === false
                            ? "bg-gray-600"
                            : "bg-amber-400"
                        }`}
                      />

                      <div>
                        {/* Top row: Symbol and Status */}
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <Link
                                to={`/stock/${sym}`}
                                className="text-base font-bold text-white hover:text-emerald-400 transition-colors flex items-center gap-1 group"
                              >
                                {sym}
                                <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                              </Link>
                              <span className="text-[10px] font-semibold text-gray-500 bg-white/5 px-1.5 py-0.5 rounded">
                                NSE
                              </span>
                            </div>
                            <p className="text-[11px] text-gray-500 mt-0.5">
                              Created {formatRelativeTime(alert.createdAt)}
                            </p>
                          </div>

                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              isTriggered
                                ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                                : alert.active === false
                                ? "bg-gray-500/10 text-gray-400 border-gray-500/20"
                                : "bg-amber-500/15 text-amber-400 border-amber-500/30"
                            }`}
                          >
                            {isTriggered ? "✓ Triggered" : alert.active === false ? "Paused" : "● Active"}
                          </span>
                        </div>

                        {/* Price Comparison Box */}
                        <div className="grid grid-cols-2 gap-2 bg-[#080d1a] border border-white/[0.05] p-3 rounded-xl mb-3">
                          <div>
                            <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">
                              Target Price
                            </p>
                            <div className="flex items-center gap-1 mt-0.5">
                              {isAbove ? (
                                <TrendingUp size={13} className="text-emerald-400" />
                              ) : (
                                <TrendingDown size={13} className="text-rose-400" />
                              )}
                              <span className="text-[15px] font-bold text-white">
                                ₹{formatCurrency(alert.targetPrice)}
                              </span>
                            </div>
                            <span className="text-[10px] text-gray-400">
                              {isAbove ? "≥ Reaches Above" : "≤ Drops Below"}
                            </span>
                          </div>

                          <div>
                            <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">
                              Current Price
                            </p>
                            <p className="text-[15px] font-bold text-gray-200 mt-0.5">
                              ₹{formatCurrency(isTriggered ? alert.triggeredPrice || current : current)}
                            </p>
                            <span className="text-[10px] text-emerald-400">
                              {isTriggered ? "Hit Price" : distanceText || "Live Tracked"}
                            </span>
                          </div>
                        </div>

                        {/* Progress Bar towards target */}
                        {!isTriggered && current && (
                          <div className="mb-3">
                            <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="bg-gradient-to-r from-blue-500 to-emerald-400 h-1.5 rounded-full transition-all duration-500"
                                style={{ width: `${distancePercent}%` }}
                              />
                            </div>
                          </div>
                        )}

                        {/* Notes if any */}
                        {alert.notes && (
                          <p className="text-[11px] text-gray-400 italic bg-white/[0.02] border border-white/[0.04] px-2.5 py-1.5 rounded-lg mb-3">
                            "{alert.notes}"
                          </p>
                        )}
                      </div>

                      {/* Bottom action bar */}
                      <div className="flex items-center justify-between pt-3 border-t border-white/[0.06] mt-2">
                        <div className="flex items-center gap-2">
                          {isTriggered ? (
                            <button
                              onClick={() => handleToggle(alert._id, alert.symbol)}
                              className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
                              title="Reset and monitor this price again"
                            >
                              <RefreshCw size={12} /> Re-Arm Alert
                            </button>
                          ) : (
                            <button
                              onClick={() => handleToggle(alert._id, alert.symbol)}
                              className="text-[11px] font-medium text-gray-400 hover:text-white flex items-center gap-1 transition-colors"
                            >
                              {alert.active ? (
                                <>
                                  <Pause size={12} /> Pause
                                </>
                              ) : (
                                <>
                                  <Play size={12} /> Resume
                                </>
                              )}
                            </button>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          <Link
                            to={`/stock/${sym}`}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                            title="View stock details"
                          >
                            <ExternalLink size={14} />
                          </Link>
                          <button
                            onClick={() => handleDelete(alert._id, alert.symbol)}
                            className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-all"
                            title="Delete alert"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Modal */}
      <CreateAlertModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        stock={modalStock}
        onAlertCreated={() => fetchAlertsData()}
      />
    </AppLayout>
  );
}

export default AlertsPage;
