// client/src/components/alerts/AlertsPanel.jsx
import Card from "../ui/Card";
import { Bell, Trash2, CheckCircle2, Clock3, TrendingUp, TrendingDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect } from "react";
import { getAlerts, deleteAlert } from "../../services/alertService";
import useAlertStore from "../../store/alertStore";
import { useToast, ToastContainer } from "../ui/Toast";

function formatTime(date) {
  const diff = Math.floor((Date.now() - new Date(date)) / 60000);
  if (diff < 1)  return "Just now";
  if (diff < 60) return `${diff}m ago`;
  const h = Math.floor(diff / 60);
  if (h < 24)    return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function AlertCard({ alert, onDelete }) {
  const isTriggered = alert.triggered;
  const isAbove     = alert.condition === "above";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1,  y: 0  }}
      exit={{    opacity: 0,  x: 60 }}
      transition={{ duration: 0.2 }}
      className={`group relative rounded-2xl border p-4 transition-all
        ${isTriggered
          ? "border-emerald-500/20 bg-emerald-500/[0.04]"
          : "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]"}`}
    >
      <div className="flex items-start justify-between gap-3">

        {/* Left — icon + details */}
        <div className="flex items-start gap-3 min-w-0">

          {/* Status icon */}
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5
            ${isTriggered
              ? "bg-emerald-500/15 text-emerald-400"
              : "bg-yellow-500/10 text-yellow-400"}`}>
            {isTriggered
              ? <CheckCircle2 size={16} />
              : <Clock3       size={16} />}
          </div>

          <div className="min-w-0 flex-1">
            {/* Symbol + status badge */}
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="text-[13px] font-bold text-white">
                {alert.symbol?.replace(".NS", "")}
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md
                ${isTriggered
                  ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                  : "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"}`}>
                {isTriggered ? "✓ Triggered" : "● Active"}
              </span>
            </div>

            {/* Target price + condition */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                {isAbove
                  ? <TrendingUp  size={11} className="text-emerald-400" />
                  : <TrendingDown size={11} className="text-red-400" />}
                <span className="text-[11px] text-gray-500">
                  {isAbove ? "Above" : "Below"}
                  {" "}<span className="text-white font-semibold">₹{alert.targetPrice}</span>
                </span>
              </div>
            </div>

            {/* Time */}
            <p className="text-[10px] text-gray-600 mt-1.5">
              {formatTime(alert.createdAt)}
            </p>
          </div>
        </div>

        {/* Delete button */}
        <button
          onClick={() => onDelete(alert._id, alert.symbol)}
          className="opacity-0 group-hover:opacity-100 transition-all
                     w-8 h-8 rounded-lg flex items-center justify-center
                     bg-red-500/10 hover:bg-red-500/20 text-red-400 shrink-0"
        >
          <Trash2 size={13} />
        </button>
      </div>

      {/* Triggered glow line */}
      {isTriggered && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2
                         w-[2px] h-8 rounded-r-full bg-emerald-400" />
      )}
    </motion.div>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-white/[0.06] p-4 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-white/5 shrink-0" />
        <div className="flex-1">
          <div className="flex gap-2 mb-2">
            <div className="h-3 w-16 bg-white/5 rounded" />
            <div className="h-3 w-14 bg-white/5 rounded" />
          </div>
          <div className="h-2.5 w-24 bg-white/5 rounded mb-1.5" />
          <div className="h-2 w-12 bg-white/5 rounded" />
        </div>
      </div>
    </div>
  );
}

function AlertsPanel() {
  const { alerts, setAlerts, removeAlert } = useAlertStore();
  const toast = useToast();

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchAlerts = async () => {
    try {
      const data = await getAlerts();
      setAlerts(data);
    } catch (error) {
      console.log(error);
    }
  };

  const handleDelete = async (id, symbol) => {
    try {
      removeAlert(id);
      await deleteAlert(id);
      toast.success(
        "Alert removed",
        `${symbol?.replace(".NS", "")} alert deleted`
      );
    } catch (error) {
      console.log(error);
      fetchAlerts();
      toast.error("Failed to delete", "Please try again");
    }
  };

  const triggered = alerts?.filter((a) => a.triggered).length || 0;
  const active    = (alerts?.length || 0) - triggered;

  return (
    <>
      <ToastContainer toasts={toast.toasts} onRemove={toast.remove} />

      <Card id="alerts" className="lg:col-span-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-yellow-500/10 border border-yellow-500/20
                            flex items-center justify-center">
              <Bell size={18} className="text-yellow-400" />
            </div>
            <div>
              <h2 className="text-base font-bold">Active Alerts</h2>
              <p className="text-[11px] text-gray-500 mt-0.5">Live market monitoring</p>
            </div>
          </div>

          {/* Stats pills */}
          <div className="flex items-center gap-2">
            {triggered > 0 && (
              <span className="text-[10px] font-bold px-2 py-1 rounded-lg
                               bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {triggered} triggered
              </span>
            )}
            <span className="text-[10px] font-bold px-2 py-1 rounded-lg
                             bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
              {active} active
            </span>
          </div>
        </div>

        {/* List */}
        <div className="space-y-2.5">
          <AnimatePresence mode="popLayout">
            {!alerts ? (
              [0, 1, 2].map((i) => <SkeletonCard key={i} />)
            ) : alerts.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-2xl border border-dashed border-white/[0.07]
                           py-10 text-center"
              >
                <Bell size={24} className="text-gray-700 mx-auto mb-2" />
                <p className="text-[13px] text-gray-500 font-medium">No alerts set yet</p>
                <p className="text-[11px] text-gray-600 mt-1">
                  Set a price alert from any stock's watchlist
                </p>
              </motion.div>
            ) : (
              alerts.map((alert) => (
                <AlertCard
                  key={alert._id}
                  alert={alert}
                  onDelete={handleDelete}
                />
              ))
            )}
          </AnimatePresence>
        </div>

      </Card>
    </>
  );
}

export default AlertsPanel;