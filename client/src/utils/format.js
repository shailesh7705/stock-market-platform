// client/src/utils/format.js

export function formatInr(val) {
  if (val === undefined || val === null || Number.isNaN(Number(val))) return "—";
  return Number(val).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatVolume(val) {
  if (val === undefined || val === null || Number.isNaN(Number(val))) return "—";
  const num = Number(val);
  if (num === 0) return "0";
  if (num >= 10000000) return `${(num / 10000000).toFixed(2)} Cr`;
  if (num >= 100000) return `${(num / 100000).toFixed(2)} L`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)} K`;
  return String(num);
}

export function formatCompactINR(val) {
  if (val === undefined || val === null || Number.isNaN(Number(val))) return "—";
  const num = Number(val);
  const sign = num < 0 ? "-" : "";
  const abs = Math.abs(num);

  if (abs >= 10000000) {
    return `${sign}₹${(abs / 10000000).toFixed(2)} Cr`;
  }
  if (abs >= 100000) {
    return `${sign}₹${(abs / 100000).toFixed(2)} L`;
  }
  if (abs >= 1000) {
    return `${sign}₹${(abs / 1000).toFixed(1)} K`;
  }
  return `${sign}₹${abs.toFixed(2)}`;
}

export function formatPercent(val, { decimals = 2, showSign = true } = {}) {
  if (val === undefined || val === null || Number.isNaN(Number(val))) return "—";
  const num = Number(val);
  const sign = showSign && num > 0 ? "+" : "";
  return `${sign}${num.toFixed(decimals)}%`;
}

export function formatCurrency(val, { compact = false, currency = "₹" } = {}) {
  if (val === undefined || val === null || Number.isNaN(Number(val))) return "—";
  if (compact) return formatCompactINR(val);
  const formatted = formatInr(val);
  return formatted === "—" ? "—" : `${currency}${formatted}`;
}
