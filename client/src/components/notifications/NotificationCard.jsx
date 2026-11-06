import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, BookmarkPlus, LineChart, RotateCcw, TrendingUp } from "lucide-react";
import toast from "react-hot-toast";
import { getHistoricalData } from "../../services/stockService";
import { toggleAlert, updateAlert } from "../../services/alertService";
import { addToWatchlist } from "../../services/watchlistService";

function cleanSymbol(symbol = "") {
  return symbol.replace(".NS", "").replace(".BO", "").toUpperCase();
}

function noteSymbol(note) {
  if (note.symbol) return note.symbol;
  const match = String(note.message || "").match(/^([A-Za-z0-9.&_-]+)/);
  return match ? match[1] : "";
}

function MiniCandles({ bars, target }) {
  if (!bars.length) {
    return <p className="text-[10px] text-gray-500 py-4 text-center">Chart is still loading</p>;
  }

  const width = 280;
  const height = 76;
  const prices = bars.flatMap((bar) => [bar.high, bar.low]);
  if (target) prices.push(target);
  const max = Math.max(...prices);
  const min = Math.min(...prices);
  const span = max - min || 1;
  const y = (value) => height - ((value - min) / span) * (height - 10) - 4;
  const slot = width / bars.length;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-16">
      {target ? (
        <line
          x1="0"
          x2={width}
          y1={y(target)}
          y2={y(target)}
          stroke="#fbbf24"
          strokeDasharray="3 3"
          strokeWidth="1"
        />
      ) : null}
      {bars.map((bar, index) => {
        const up = bar.close >= bar.open;
        const color = up ? "#34d399" : "#fb7185";
        const x = index * slot + slot / 2;
        const bodyTop = y(Math.max(bar.open, bar.close));
        const bodyHeight = Math.max(1.5, Math.abs(y(bar.open) - y(bar.close)));
        return (
          <g key={bar.time || index}>
            <line x1={x} x2={x} y1={y(bar.high)} y2={y(bar.low)} stroke={color} strokeWidth="1" />
            <rect
              x={x - Math.max(1.5, slot * 0.26)}
              y={bodyTop}
              width={Math.max(3, slot * 0.52)}
              height={bodyHeight}
              fill={color}
            />
          </g>
        );
      })}
    </svg>
  );
}

export default function NotificationCard({ note, expanded, onToggle, onClose }) {
  const navigate = useNavigate();
  const [bars, setBars] = useState([]);
  const [busy, setBusy] = useState("");
  const symbol = noteSymbol(note);
  const display = cleanSymbol(symbol);
  const target = note.targetPrice;

  useEffect(() => {
    if (!expanded || !symbol) return;
    let cancelled = false;
    getHistoricalData(symbol, "5d")
      .then((data) => {
        if (!cancelled && Array.isArray(data)) setBars(data.slice(-28));
      })
      .catch(() => {
        if (!cancelled) setBars([]);
      });
    return () => {
      cancelled = true;
    };
  }, [expanded, symbol]);

  const run = async (key, action, success) => {
    try {
      setBusy(key);
      await action();
      toast.success(success);
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not update that alert");
    } finally {
      setBusy("");
    }
  };

  return (
    <div className={`p-3.5 ${note.read ? "opacity-75" : "bg-emerald-500/[0.06]"}`}>
      <button type="button" onClick={onToggle} className="w-full text-left">
        <div className="flex items-start gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
            <Bell size={13} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-semibold text-white leading-snug">{note.message}</p>
            <p className="text-[10px] text-gray-500 mt-1">
              {new Date(note.createdAt).toLocaleString("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
                day: "numeric",
                month: "short",
              })}
              {display ? ` · ${expanded ? "Hide trigger" : "Open trigger"}` : ""}
            </p>
          </div>
        </div>
      </button>

      {expanded && (
        <div className="mt-3 rounded-xl border border-white/10 bg-[#080d1a] p-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] uppercase tracking-wider font-bold text-amber-300">Trigger detail</p>
            {target ? (
              <p className="text-[10px] font-mono text-gray-400">Target ₹{Number(target).toFixed(2)}</p>
            ) : null}
          </div>
          <MiniCandles bars={bars} target={target} />
          <div className="grid grid-cols-2 gap-1.5 mt-3">
            <button
              type="button"
              disabled={!note.alert || busy === "rearm"}
              onClick={() =>
                run("rearm", () => toggleAlert(note.alert), `${display || "Alert"} re-armed`)
              }
              className="h-9 rounded-lg bg-white/5 text-[11px] font-bold text-white flex items-center justify-center gap-1 disabled:opacity-40"
            >
              <RotateCcw size={12} /> Re-arm
            </button>
            <button
              type="button"
              disabled={!note.alert || !target || busy === "raise"}
              onClick={() =>
                run(
                  "raise",
                  () =>
                    updateAlert(note.alert, {
                      targetPrice: Number((target * 1.05).toFixed(2)),
                      rearm: true,
                    }),
                  `Target raised to ₹${(target * 1.05).toFixed(2)}`
                )
              }
              className="h-9 rounded-lg bg-white/5 text-[11px] font-bold text-white flex items-center justify-center gap-1 disabled:opacity-40"
            >
              <TrendingUp size={12} /> +5%
            </button>
            <button
              type="button"
              disabled={!symbol || busy === "watch"}
              onClick={() =>
                run(
                  "watch",
                  () => addToWatchlist({ symbol, name: display }),
                  `${display} added to watchlist`
                )
              }
              className="h-9 rounded-lg bg-cyan-500/10 text-[11px] font-bold text-cyan-300 flex items-center justify-center gap-1 disabled:opacity-40"
            >
              <BookmarkPlus size={12} /> Watch
            </button>
            <button
              type="button"
              disabled={!display}
              onClick={() => {
                onClose();
                navigate(`/stock/${display}`);
              }}
              className="h-9 rounded-lg bg-emerald-500/15 text-[11px] font-bold text-emerald-300 flex items-center justify-center gap-1 disabled:opacity-40"
            >
              <LineChart size={12} /> Chart
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
