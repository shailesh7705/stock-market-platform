// client/src/components/ui/Toast.jsx
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, AlertCircle, X } from "lucide-react";

const ICONS = {
  success: <CheckCircle2 size={16} className="text-emerald-400" />,
  error: <XCircle size={16} className="text-red-400" />,
  info: <AlertCircle size={16} className="text-blue-400" />,
};

const COLORS = {
  success: "border-emerald-500/20 bg-emerald-500/5",
  error: "border-red-500/20 bg-red-500/5",
  info: "border-blue-500/20 bg-blue-500/5",
};

// ─── Single Toast ─────────────────────────────────────────────────────────────
function Toast({ id, type = "success", title, message, onRemove }) {
  useEffect(() => {
    const t = setTimeout(() => onRemove(id), 4000);
    return () => clearTimeout(t);
  }, [id, onRemove]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={`pointer-events-auto flex items-start gap-3 w-80 px-4 py-3.5 rounded-2xl
                  border backdrop-blur-xl shadow-2xl shadow-black/40
                  bg-[#0f1923]/95 ${COLORS[type]}`}
    >
      <div className="shrink-0 mt-0.5">{ICONS[type]}</div>

      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-white leading-none mb-1">
          {title}
        </p>

        {message && (
          <p className="text-[11px] text-gray-400 leading-snug">
            {message}
          </p>
        )}
      </div>

      <button
        onClick={() => onRemove(id)}
        className="shrink-0 text-gray-600 hover:text-gray-300 transition-colors mt-0.5"
      >
        <X size={13} />
      </button>
    </motion.div>
  );
}

// ─── Toast Container ──────────────────────────────────────────────────────────
export function ToastContainer({ toasts, onRemove }) {
  return (
    <div className="fixed bottom-6 right-6 z-9999 flex flex-col gap-2 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((t) => (
          <Toast key={t.id} {...t} onRemove={onRemove} />
        ))}
      </AnimatePresence>
    </div>
  );
}

// ─── useToast hook ────────────────────────────────────────────────────────────
export function useToast() {
  const [toasts, setToasts] = useState([]);

  const show = (type, title, message = "") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, title, message }]);
  };

  const remove = (id) =>
    setToasts((prev) => prev.filter((t) => t.id !== id));

  return {
    toasts,
    remove,
    success: (title, message) => show("success", title, message),
    error: (title, message) => show("error", title, message),
    info: (title, message) => show("info", title, message),
  };
}