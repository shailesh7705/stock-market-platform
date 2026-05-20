// client/src/components/alerts/CreateAlertModal.jsx
import { motion, AnimatePresence } from "framer-motion";
import { useState }                from "react";
import { X, Bell, TrendingUp, TrendingDown, Target } from "lucide-react";
import { createAlert }             from "../../services/alertService";
import { useToast, ToastContainer } from "../ui/Toast";

function CreateAlertModal({ open, onClose, stock }) {
  const [targetPrice, setTargetPrice] = useState("");
  const [condition,   setCondition]   = useState("above"); // "above" | "below"
  const [loading,     setLoading]     = useState(false);
  const toast = useToast();

  const symbol = stock?.symbol?.replace(".NS", "").replace(".BO", "") || "";

  const handleCreate = async () => {
    if (!targetPrice || isNaN(targetPrice)) {
      toast.error("Invalid price", "Please enter a valid target price");
      return;
    }

    try {
      setLoading(true);
      await createAlert({
        symbol:      stock.symbol,
        targetPrice: parseFloat(targetPrice),
        condition,
      });
      toast.success(
        "Alert created!",
        `${symbol} · ₹${targetPrice} · ${condition === "above" ? "Price goes above" : "Price drops below"}`
      );
      setTargetPrice("");
      setCondition("above");
      onClose();
    } catch (error) {
      console.log(error);
      toast.error("Failed to create alert", "Please try again");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ToastContainer toasts={toast.toasts} onRemove={toast.remove} />

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{    opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm
                       flex items-center justify-center z-[100] px-4"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 16 }}
              animate={{ scale: 1,    opacity: 1, y: 0  }}
              exit={{    scale: 0.92, opacity: 0, y: 16 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-sm bg-[#0f1923] border border-white/[0.08]
                         rounded-3xl shadow-2xl shadow-black/50 overflow-hidden"
            >
              {/* Top accent bar */}
              <div className="h-[2px] bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600" />

              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-yellow-500/10 border border-yellow-500/20
                                    flex items-center justify-center">
                      <Bell size={18} className="text-yellow-400" />
                    </div>
                    <div>
                      <h2 className="text-[15px] font-bold text-white leading-none mb-1">
                        Create Alert
                      </h2>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10
                                         border border-emerald-500/20 px-2 py-0.5 rounded-md">
                          {symbol}
                        </span>
                        <span className="text-[11px] text-gray-600">NSE</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center
                               text-gray-500 hover:text-white hover:bg-white/10 transition-all"
                  >
                    <X size={14} />
                  </button>
                </div>

                {/* Current price if available */}
                {stock?.price && (
                  <div className="flex items-center justify-between px-3 py-2.5
                                  bg-white/[0.03] border border-white/[0.06] rounded-xl mb-5">
                    <span className="text-[11px] text-gray-500">Current Price</span>
                    <span className="text-[13px] font-bold text-white">{stock.price}</span>
                  </div>
                )}

                {/* Condition selector */}
                <div className="mb-4">
                  <p className="text-[11px] text-gray-500 font-medium uppercase
                                tracking-wider mb-2">Alert Condition</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: "above", label: "Price goes above", icon: TrendingUp,  color: "emerald" },
                      { value: "below", label: "Price drops below", icon: TrendingDown, color: "red"    },
                    ].map(({ value, label, icon: Icon, color }) => (
                      <button
                        key={value}
                        onClick={() => setCondition(value)}
                        className={`flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl
                                    border transition-all text-center
                                    ${condition === value
                                      ? color === "emerald"
                                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                                        : "bg-red-500/10 border-red-500/30 text-red-400"
                                      : "bg-white/[0.02] border-white/[0.07] text-gray-500 hover:border-white/20 hover:text-gray-300"
                                    }`}
                      >
                        <Icon size={16} />
                        <span className="text-[11px] font-medium leading-snug">{label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Target price input */}
                <div className="mb-5">
                  <p className="text-[11px] text-gray-500 font-medium uppercase
                                tracking-wider mb-2">Target Price</p>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2
                                     text-gray-500 text-[13px] font-medium">₹</span>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={targetPrice}
                      onChange={(e) => setTargetPrice(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                      className="w-full h-12 rounded-xl bg-white/[0.04] border border-white/[0.08]
                                 pl-8 pr-4 outline-none text-white text-[14px] font-semibold
                                 focus:border-emerald-500/40 focus:bg-white/[0.06] transition-all
                                 placeholder:text-gray-700"
                    />
                  </div>
                </div>

                {/* Preview */}
                {targetPrice && (
                  <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl
                                  bg-white/[0.03] border border-white/[0.06] mb-5">
                    <Target size={13} className="text-gray-500 shrink-0" />
                    <p className="text-[11px] text-gray-400">
                      Alert when <span className="text-white font-semibold">{symbol}</span>
                      {" "}{condition === "above" ? "rises above" : "drops below"}{" "}
                      <span className="text-emerald-400 font-semibold">₹{targetPrice}</span>
                    </p>
                  </div>
                )}

                {/* Submit */}
                <button
                  onClick={handleCreate}
                  disabled={loading}
                  className="w-full h-11 rounded-xl bg-emerald-500 hover:bg-emerald-400
                             text-black text-[13px] font-bold transition-all
                             disabled:opacity-50 disabled:cursor-not-allowed
                             shadow-lg shadow-emerald-500/20"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"
                                strokeOpacity="0.2"/>
                        <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3"
                              strokeLinecap="round"/>
                      </svg>
                      Creating...
                    </span>
                  ) : (
                    "Set Alert"
                  )}
                </button>

              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default CreateAlertModal;