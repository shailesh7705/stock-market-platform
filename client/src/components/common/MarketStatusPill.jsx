import { useEffect, useState } from "react";
import { applyHolidayCalendar, getMarketStatus } from "../../utils/marketHours";
import { getMarketCalendar } from "../../services/marketService";

const TONE = {
  open: "border-emerald-400/40 bg-emerald-500/10 text-emerald-300 shadow-emerald-500/20",
  pre: "border-amber-300/40 bg-amber-400/10 text-amber-200 shadow-amber-400/20",
  post: "border-amber-200/30 bg-white/5 text-amber-100",
  closed: "border-rose-400/30 bg-rose-500/10 text-rose-200",
};

const DOT = {
  open: "bg-emerald-400",
  pre: "bg-amber-300",
  post: "bg-amber-200",
  closed: "bg-rose-400",
};

export default function MarketStatusPill() {
  const [status, setStatus] = useState(() => getMarketStatus());

  useEffect(() => {
    let active = true;
    getMarketCalendar()
      .then((calendar) => {
        if (!active) return;
        applyHolidayCalendar(calendar?.holidays);
        setStatus(getMarketStatus());
      })
      .catch(() => {});

    const timer = setInterval(() => setStatus(getMarketStatus()), 30000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  return (
    <div
      className={`flex items-center gap-1.5 h-9 px-2 sm:px-2.5 rounded-xl border text-[10px] sm:text-[11px] font-bold shrink-0 shadow-sm ${TONE[status.phase]}`}
      title={`${status.label}. ${status.countdown}`}
    >
      <span className={`w-2 h-2 rounded-full ${DOT[status.phase]} ${status.phase === "open" ? "animate-pulse" : ""}`} />
      <span className="sm:hidden">{status.shortLabel}</span>
      <span className="hidden sm:inline whitespace-nowrap">
        {status.label}
        <span className="mx-1 text-amber-200/80">·</span>
        <span className="text-amber-100">{status.countdown}</span>
      </span>
    </div>
  );
}
