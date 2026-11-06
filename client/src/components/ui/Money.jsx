// client/src/components/ui/Money.jsx
import { formatCurrency } from "../../utils/format";

export default function Money({
  value,
  compact = false,
  currency = "₹",
  colorize = false,
  className = "",
}) {
  const formatted = formatCurrency(value, { compact, currency });
  const num = Number(value);

  let colorClass = "";
  if (colorize && !isNaN(num)) {
    if (num > 0) colorClass = "text-emerald-400";
    else if (num < 0) colorClass = "text-rose-400";
    else colorClass = "text-gray-400";
  }

  return (
    <span className={`font-mono tracking-tight ${colorClass} ${className}`}>
      {formatted}
    </span>
  );
}
