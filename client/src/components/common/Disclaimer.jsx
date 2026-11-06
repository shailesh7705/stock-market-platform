// client/src/components/common/Disclaimer.jsx
import { Link } from "react-router-dom";
import { ShieldAlert, Info, Clock } from "lucide-react";

export function DataSourceBadge({ asOf = null, className = "" }) {
  const formattedTime = asOf
    ? new Date(asOf).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
        timeZone: "Asia/Kolkata",
      })
    : null;

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.03] border border-white/[0.08] text-[11px] text-gray-400 select-none ${className}`}
      title="Exchange pricing feeds are delayed approximately 15 minutes."
    >
      <Clock size={12} className="text-gray-500 shrink-0" />
      <span>Delayed 15m · Source: Yahoo Finance</span>
      {formattedTime && <span className="text-gray-500 font-mono">({formattedTime} IST)</span>}
    </div>
  );
}

export default function Disclaimer({
  variant = "compact", // "compact" | "full" | "dossier"
  className = "",
}) {
  if (variant === "compact") {
    return (
      <div
        className={`flex items-center justify-between gap-2 p-2.5 rounded-xl bg-amber-500/[0.03] border border-amber-500/15 text-[11px] text-gray-400 ${className}`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <Info size={13} className="text-amber-400/80 shrink-0" />
          <span className="truncate">
            Educational model projection only. Not SEBI-registered investment advice.
          </span>
        </div>
        <Link
          to="/disclaimer"
          className="text-amber-400 hover:text-amber-300 font-bold shrink-0 transition-colors"
        >
          Disclaimer →
        </Link>
      </div>
    );
  }

  return (
    <div
      className={`p-4 sm:p-5 rounded-2xl bg-[#080d1a] border border-white/[0.08] text-xs text-gray-400 space-y-2 ${className}`}
    >
      <div className="flex items-center gap-2 font-bold text-gray-300">
        <ShieldAlert size={15} className="text-amber-400 shrink-0" />
        <span>SEBI Regulatory Disclosure & Educational Notice</span>
      </div>
      <p className="leading-relaxed text-gray-400">
        StockPulse is a financial analysis & technology platform and is <strong>NOT</strong> a SEBI-registered Research Analyst or Investment Adviser. All algorithmic scores (including PulseScore), valuations, financial metrics, and projected targets are generated using automated mathematical formulas for educational and informational research purposes only.
      </p>
      <p className="leading-relaxed text-gray-500 text-[11px]">
        No content on this platform constitutes a recommendation, solicitation, or financial advice to buy, sell, or hold any security. Securities markets are subject to market risks; past performance is no guarantee of future returns. Please consult an independent, qualified financial adviser before making any investment decisions.
      </p>
      <div className="flex items-center gap-4 pt-1 text-[11px]">
        <Link to="/disclaimer" className="text-amber-400 hover:underline font-semibold">
          Read Risk Disclosure
        </Link>
        <Link to="/terms" className="text-gray-400 hover:underline">
          Terms of Use
        </Link>
        <Link to="/privacy" className="text-gray-400 hover:underline">
          Privacy Policy
        </Link>
      </div>
    </div>
  );
}
