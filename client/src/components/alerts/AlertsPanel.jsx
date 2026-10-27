// client/src/components/alerts/AlertsPanel.jsx
import Card from "../ui/Card";
import {
  Bell,
  Trash2,
  CheckCircle2,
  Clock3,
  TrendingUp,
  TrendingDown,
  Plus,
  ArrowRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAlerts, deleteAlert } from "../../services/alertService";
import useAlertStore from "../../store/alertStore";
import CreateAlertModal from "./CreateAlertModal";
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

function AlertCard({ alert, onDelete }) {
  const isTriggered = alert.triggered;
  const isAbove = alert.condition === "above";
  const sym = cleanSymbol(alert.symbol);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 40 }}
      transition={{ duration: 0.2 }}
      className={`group relative rounded-2xl border p-3.5 transition-all ${
        isTriggered
          ? "border-emerald-500/25 bg-emerald-500/[0.04]"
          : "border-white/[0.06] bg-[#080d1a]/60 hover:bg-[#080d1a]"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        {/* Left Info */}
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              isTriggered
                ? "bg-emerald-500/15 text-emerald-400"
                : "bg-amber-500/10 text-amber-400"
            }`}
          >
            {isTriggered ? <CheckCircle2 size={16} /> : <Clock3 size={16} />}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Link
                to={`/stock/${sym}`}
                className="text-[13px] font-bold text-white hover:text-emerald-400 transition-colors"
              >
                {sym}
              </Link>
              <span
                className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${
                  isTriggered
                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25"
                    : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                }`}
              >
                {isTriggered ? "Triggered" : "Active"}
              </span>
            </div>

            <div className="flex items-center gap-1 mt-0.5 text-[11px] text-gray-400">
              {isAbove ? (
                <TrendingUp size={11} className="text-emerald-400" />
              ) : (
                <TrendingDown size={11} className="text-rose-400" />
              )}
              <span>
                {isAbove ? "≥" : "≤"} ₹{formatCurrency(alert.targetPrice)}
              </span>
              {alert.notes && (
                <span className="text-gray-500 truncate max-w-[120px]">
                  · {alert.notes}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right Delete */}
        <button
          onClick={() => onDelete(alert._id, alert.symbol)}
          className="opacity-0 group-hover:opacity-100 transition-all w-7 h-7 rounded-lg flex items-center justify-center bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 shrink-0"
          title="Delete alert"
        >
          <Trash2 size={13} />
        </button>
      </div>

      {isTriggered && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-7 rounded-r-full bg-emerald-400" />
      )}
    </motion.div>
  );
}

function AlertsPanel() {
  const { alerts, setAlerts, removeAlert } = useAlertStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 15000);
    return () => clearInterval(interval);
  }, []);

  const fetchAlerts = async () => {
    try {
      const data = await getAlerts();
      setAlerts(data);
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
      fetchAlerts();
    }
  };

  const triggered = alerts?.filter((a) => a.triggered).length || 0;
  const active = (alerts?.length || 0) - triggered;
  const previewAlerts = (alerts || []).slice(0, 5);

  return (
    <>
      <Card id="alerts" className="lg:col-span-6 flex flex-col justify-between">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Bell size={18} />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Price Alerts</h2>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  Realtime monitoring & email triggers
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setModalOpen(true)}
                className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white transition-all"
                title="Create alert"
              >
                <Plus size={15} />
              </button>

              <Link
                to="/alerts"
                className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors pl-1"
              >
                View All <ArrowRight size={13} />
              </Link>
            </div>
          </div>

          {/* Quick status pill row */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">
              {active} active
            </span>
            {triggered > 0 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {triggered} hit
              </span>
            )}
          </div>

          {/* List */}
          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {loading ? (
                [0, 1, 2].map((i) => (
                  <div key={i} className="h-14 rounded-2xl bg-white/5 animate-pulse" />
                ))
              ) : previewAlerts.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 py-8 text-center">
                  <Bell size={20} className="text-gray-600 mx-auto mb-2" />
                  <p className="text-xs text-gray-400 font-medium">No alerts set yet</p>
                  <p className="text-[11px] text-gray-600 mt-0.5">
                    Click + or set an alert from any stock details
                  </p>
                </div>
              ) : (
                previewAlerts.map((alert) => (
                  <AlertCard key={alert._id} alert={alert} onDelete={handleDelete} />
                ))
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Footer Link */}
        {alerts?.length > 5 && (
          <div className="pt-3 mt-3 border-t border-white/[0.06] text-center">
            <Link
              to="/alerts"
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              See all {alerts.length} alerts →
            </Link>
          </div>
        )}
      </Card>

      <CreateAlertModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        stock={{ symbol: "RELIANCE.NS", price: 1200 }}
        onAlertCreated={() => fetchAlerts()}
      />
    </>
  );
}

export default AlertsPanel;
