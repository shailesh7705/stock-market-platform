// client/src/components/ui/EmptyState.jsx
import { Inbox } from "lucide-react";

export default function EmptyState({
  icon: Icon = Inbox,
  title = "No data found",
  description = "There are no items to display at this moment.",
  actionLabel = null,
  onAction = null,
  className = "",
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-8 sm:p-12 rounded-2xl bg-[#080d1a]/60 border border-white/[0.06] space-y-3 ${className}`}
    >
      <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-gray-400">
        <Icon size={22} />
      </div>
      <div className="space-y-1 max-w-sm">
        <h3 className="text-sm font-bold text-white">{title}</h3>
        <p className="text-xs text-gray-400 leading-relaxed">{description}</p>
      </div>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-2 px-4 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 font-bold text-xs transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
