// client/src/components/alerts/CreateAlertModal.jsx
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { X, Bell, TrendingUp, TrendingDown, Target, Sparkles, Mail, Check } from "lucide-react";
import { createAlert } from "../../services/alertService";
import useAlertStore from "../../store/alertStore";
import useAuthStore from "../../store/authStore";
import toast from "react-hot-toast";

function CreateAlertModal({ open, onClose, stock, onAlertCreated }) {
  const [targetPrice, setTargetPrice] = useState("");
  const [condition, setCondition] = useState("above"); // "above" | "below"
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const { addAlert } = useAlertStore();
  const { user } = useAuthStore();

  const rawSymbol = stock?.symbol || "";
  const cleanSymbol = rawSymbol.replace(".NS", "").replace(".BO", "").toUpperCase();
  const currentPriceNumeric = parseFloat(
    String(stock?.price || stock?.numericPrice || "0").replace(/[^0-9.]/g, "")
  );

  useEffect(() => {
    if (open && currentPriceNumeric > 0 && !targetPrice) {
      // Default target to +5% above current price
      const defaultTarget = (currentPriceNumeric * 1.05).toFixed(2);
      setTargetPrice(defaultTarget);
      setCondition("above");
    }
  }, [open, currentPriceNumeric]);

  const handlePercentageClick = (percent) => {
    if (!currentPriceNumeric) return;
    const factor = 1 + percent / 100;
    const calc = (currentPriceNumeric * factor).toFixed(2);
    setTargetPrice(calc);
    if (percent >= 0) {
      setCondition("above");
    } else {
      setCondition("below");
    }
  };

  const handleCreate = async () => {
    const numericTarget = parseFloat(targetPrice);
    if (!numericTarget || isNaN(numericTarget) || numericTarget <= 0) {
      toast.error("Please enter a valid target price");
      return;
    }

    if (!rawSymbol) {
      toast.error("Stock symbol is required");
      return;
    }

    try {
      setLoading(true);
      const newAlert = await createAlert({
        symbol: rawSymbol,
        targetPrice: numericTarget,
        condition,
        notes,
      });

      addAlert(newAlert);
      toast.success(
        `Alert set for ${cleanSymbol} at ₹${numericTarget.toLocaleString("en-IN")}`,
        {
          icon: "🔔",
          duration: 4000,
        }
      );

      if (onAlertCreated) onAlertCreated(newAlert);

      setTargetPrice("");
      setNotes("");
      onClose();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to create alert");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center z-[100] px-4 py-6 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            initial={{ scale: 0.94, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.94, opacity: 0, y: 16 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-md bg-[#0e1626] border border-white/10 rounded-3xl shadow-2xl shadow-black/70 overflow-hidden my-auto"
          >
            {/* Top accent bar */}
            <div className="h-[3px] bg-gradient-to-r from-emerald-500 via-teal-400 to-blue-500" />

            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shadow-inner">
                    <Bell size={20} className="text-amber-400" />
                  </div>
                  <div>
                    <h2 className="text-[17px] font-bold text-white leading-tight">
                      Set Price Alert
                    </h2>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                        {cleanSymbol}
                      </span>
                      <span className="text-[11px] text-gray-400 font-medium">NSE · Realtime</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Current Market Price Banner */}
              {currentPriceNumeric > 0 && (
                <div className="flex items-center justify-between px-4 py-3 bg-[#080d1a] border border-white/[0.07] rounded-2xl mb-5">
                  <div>
                    <p className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">
                      Current Price
                    </p>
                    <p className="text-[18px] font-extrabold text-white mt-0.5">
                      ₹{currentPriceNumeric.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                    Live NSE
                  </span>
                </div>
              )}

              {/* Quick % Target Adjustment Chips */}
              {currentPriceNumeric > 0 && (
                <div className="mb-5">
                  <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Sparkles size={12} className="text-amber-400" /> Quick Target Select
                  </p>
                  <div className="grid grid-cols-5 gap-1.5">
                    {[
                      { label: "+2%", val: 2 },
                      { label: "+5%", val: 5 },
                      { label: "+10%", val: 10 },
                      { label: "-5%", val: -5 },
                      { label: "-10%", val: -10 },
                    ].map(({ label, val }) => (
                      <button
                        key={label}
                        type="button"
                        onClick={() => handlePercentageClick(val)}
                        className={`py-1.5 rounded-xl text-[12px] font-bold border transition-all ${
                          val > 0
                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20"
                            : "bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/20"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Condition Selector */}
              <div className="mb-5">
                <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider mb-2">
                  Alert Condition
                </p>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setCondition("above")}
                    className={`flex items-center justify-center gap-2 p-3 rounded-2xl border transition-all text-center ${
                      condition === "above"
                        ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400 font-bold"
                        : "bg-white/[0.02] border-white/[0.08] text-gray-400 hover:border-white/20 hover:text-gray-200"
                    }`}
                  >
                    <TrendingUp size={16} />
                    <span className="text-[12px]">Rises Above (≥)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCondition("below")}
                    className={`flex items-center justify-center gap-2 p-3 rounded-2xl border transition-all text-center ${
                      condition === "below"
                        ? "bg-rose-500/15 border-rose-500/40 text-rose-400 font-bold"
                        : "bg-white/[0.02] border-white/[0.08] text-gray-400 hover:border-white/20 hover:text-gray-200"
                    }`}
                  >
                    <TrendingDown size={16} />
                    <span className="text-[12px]">Drops Below (≤)</span>
                  </button>
                </div>
              </div>

              {/* Target Price Input */}
              <div className="mb-5">
                <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider mb-2">
                  Target Price
                </p>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-[16px] font-bold">
                    ₹
                  </span>
                  <input
                    type="number"
                    step="any"
                    placeholder="0.00"
                    value={targetPrice}
                    onChange={(e) => setTargetPrice(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                    className="w-full h-13 rounded-2xl bg-[#080d1a] border border-white/10 pl-9 pr-4 outline-none text-white text-[16px] font-bold focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all placeholder:text-gray-700"
                  />
                </div>
              </div>

              {/* Notes (Optional) */}
              <div className="mb-5">
                <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider mb-2">
                  Note / Reminder (Optional)
                </p>
                <input
                  type="text"
                  placeholder="e.g. Take profit target or dip buy limit"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full h-11 rounded-xl bg-[#080d1a] border border-white/10 px-3.5 outline-none text-white text-[13px] focus:border-emerald-500/40 transition-all placeholder:text-gray-600"
                />
              </div>

              {/* Delivery info & summary */}
              <div className="p-3 bg-white/[0.03] border border-white/[0.06] rounded-2xl mb-6 space-y-2">
                <div className="flex items-center gap-2 text-[12px] text-gray-300">
                  <Mail size={14} className="text-emerald-400 shrink-0" />
                  <span className="truncate">
                    Trigger will email: <strong className="text-white">{user?.email || "your registered email"}</strong>
                  </span>
                </div>
                {targetPrice && (
                  <div className="flex items-center gap-2 text-[11px] text-gray-400 pt-1 border-t border-white/[0.04]">
                    <Target size={12} className="text-amber-400 shrink-0" />
                    <span>
                      Alert when <span className="text-white font-semibold">{cleanSymbol}</span>{" "}
                      {condition === "above" ? "crosses above" : "falls below"}{" "}
                      <span className="text-emerald-400 font-bold">₹{parseFloat(targetPrice || "0").toLocaleString("en-IN")}</span>
                    </span>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="button"
                onClick={handleCreate}
                disabled={loading}
                className="w-full h-12 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black text-[14px] font-extrabold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.2" />
                      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                    </svg>
                    Setting Alert...
                  </span>
                ) : (
                  <>
                    <Check size={16} />
                    Confirm & Set Alert
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default CreateAlertModal;
