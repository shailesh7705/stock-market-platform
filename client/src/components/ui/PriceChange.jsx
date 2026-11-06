// client/src/components/ui/PriceChange.jsx
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { formatPercent, formatInr } from "../../utils/format";

export default function PriceChange({
  change = 0,
  changePercent = 0,
  showAmount = false,
  showIcon = true,
  currency = "₹",
  className = "",
}) {
  const numChange = Number(change);
  const numPercent = Number(changePercent);

  const isPositive = numPercent > 0 || numChange > 0;
  const isNegative = numPercent < 0 || numChange < 0;

  const colorClass = isPositive
    ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
    : isNegative
    ? "text-rose-400 bg-rose-500/10 border-rose-500/20"
    : "text-gray-400 bg-white/5 border-white/10";

  return (
    <span
      className={`inline-flex items-center gap-1 font-mono font-bold text-xs px-2 py-0.5 rounded-lg border ${colorClass} ${className}`}
    >
      {showIcon && (
        <>
          {isPositive && <TrendingUp size={12} className="shrink-0" />}
          {isNegative && <TrendingDown size={12} className="shrink-0" />}
          {!isPositive && !isNegative && <Minus size={12} className="shrink-0" />}
        </>
      )}
      {showAmount && (
        <span>
          {isPositive ? "+" : ""}
          {currency}
          {formatInr(Math.abs(numChange))}
        </span>
      )}
      <span>{formatPercent(numPercent)}</span>
    </span>
  );
}
