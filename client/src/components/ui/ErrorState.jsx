// client/src/components/ui/ErrorState.jsx
import { AlertCircle, RefreshCw } from "lucide-react";

export default function ErrorState({
  title = "Failed to load data",
  message = "An error occurred while fetching real-time market data. Please try again.",
  onRetry = null,
  retrying = false,
  className = "",
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-8 sm:p-10 rounded-2xl bg-rose-500/[0.03] border border-rose-500/20 space-y-3 ${className}`}
    >
      <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
        <AlertCircle size={22} />
      </div>
      <div className="space-y-1 max-w-sm">
        <h3 className="text-sm font-bold text-white">{title}</h3>
        <p className="text-xs text-rose-300/80 leading-relaxed">{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          disabled={retrying}
          className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition-colors disabled:opacity-50"
        >
          <RefreshCw size={12} className={retrying ? "animate-spin" : ""} />
          <span>{retrying ? "Retrying..." : "Retry"}</span>
        </button>
      )}
    </div>
  );
}
