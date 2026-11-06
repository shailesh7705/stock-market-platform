import { useState, useId } from "react";
import { AlertTriangle } from "lucide-react";

const COLORS = ["#f59e0b", "#34d399", "#38bdf8", "#a78bfa", "#fb7185", "#fbbf24", "#2dd4bf", "#94a3b8"];

function formatINR(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

export default function SectorAllocationDonut({ sectors = [], alerts = [] }) {
  const [mode, setMode] = useState("current");
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const chartId = useId();

  const data = sectors
    .map((sector) => ({
      name: sector.sector,
      value: mode === "invested" ? sector.invested : sector.current,
    }))
    .filter((sector) => sector.value > 0);

  const totalValue = data.reduce((sum, item) => sum + item.value, 0);

  const stockAlerts = alerts.filter((alert) => alert.type === "stock");
  const sectorAlerts = alerts.filter((alert) => alert.type === "sector");

  // Polar to Cartesian coordinate helper for SVG donut arcs
  const polarToCartesian = (cx, cy, r, angleInDegrees) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: cx + r * Math.cos(angleInRadians),
      y: cy + r * Math.sin(angleInRadians),
    };
  };

  const describeArc = (cx, cy, rInner, rOuter, startAngle, endAngle) => {
    // If arc is full circle (360 degrees), clamp slightly to avoid SVG path bug
    const clampedEnd = endAngle - startAngle >= 360 ? startAngle + 359.99 : endAngle;
    const startOuter = polarToCartesian(cx, cy, rOuter, clampedEnd);
    const endOuter = polarToCartesian(cx, cy, rOuter, startAngle);
    const startInner = polarToCartesian(cx, cy, rInner, startAngle);
    const endInner = polarToCartesian(cx, cy, rInner, clampedEnd);
    const largeArcFlag = clampedEnd - startAngle <= 180 ? "0" : "1";

    return [
      "M", startOuter.x, startOuter.y,
      "A", rOuter, rOuter, 0, largeArcFlag, 0, endOuter.x, endOuter.y,
      "L", startInner.x, startInner.y,
      "A", rInner, rInner, 0, largeArcFlag, 1, endInner.x, endInner.y,
      "Z",
    ].join(" ");
  };

  // Generate slice angles
  let currentAngle = 0;
  const slices = data.map((item, index) => {
    const percentage = totalValue > 0 ? (item.value / totalValue) * 100 : 0;
    const angleSpan = totalValue > 0 ? (item.value / totalValue) * 360 : 0;
    const start = currentAngle;
    const end = currentAngle + angleSpan;
    currentAngle = end;
    const color = COLORS[index % COLORS.length];
    return {
      ...item,
      percentage,
      start,
      end,
      color,
      index,
    };
  });

  return (
    <div className="rounded-3xl border border-white/10 bg-[#0e1626] p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-extrabold text-white">Sector Allocation</h2>
          <p className="text-[11px] text-gray-400 mt-1">Concentration guardrails: 25% per stock, 45% per sector.</p>
        </div>
        <div className="flex rounded-xl bg-[#080d18] border border-white/10 p-1">
          <button
            type="button"
            onClick={() => setMode("current")}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${mode === "current" ? "bg-emerald-500 text-black" : "text-gray-400"}`}
          >
            Market Value
          </button>
          <button
            type="button"
            onClick={() => setMode("invested")}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${mode === "invested" ? "bg-emerald-500 text-black" : "text-gray-400"}`}
          >
            Invested
          </button>
        </div>
      </div>

      {data.length === 0 ? (
        <p className="text-xs text-gray-500 mt-6">Add holdings to see sector allocation.</p>
      ) : (
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mt-4">
          <div className="relative w-44 h-44 shrink-0 flex items-center justify-center">
            <svg viewBox="0 0 200 200" className="w-full h-full transform -rotate-90">
              {slices.map((slice) => {
                const isHovered = hoveredIndex === slice.index;
                const path = describeArc(100, 100, 56, isHovered ? 84 : 80, slice.start, slice.end);
                return (
                  <path
                    key={slice.name}
                    d={path}
                    fill={slice.color}
                    className="transition-all duration-200 cursor-pointer"
                    onMouseEnter={() => setHoveredIndex(slice.index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  />
                );
              })}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center p-2">
              <span className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold truncate max-w-[90px]">
                {hoveredIndex !== null ? slices[hoveredIndex]?.name : "Total"}
              </span>
              <span className="text-xs font-bold text-white font-mono">
                {hoveredIndex !== null
                  ? `${slices[hoveredIndex]?.percentage.toFixed(1)}%`
                  : formatINR(totalValue)}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-1.5 flex-1 min-w-[140px] max-h-44 overflow-y-auto pr-1">
            {slices.map((slice) => (
              <div
                key={slice.name}
                onMouseEnter={() => setHoveredIndex(slice.index)}
                onMouseLeave={() => setHoveredIndex(null)}
                className={`flex items-center justify-between text-xs p-1.5 rounded-lg cursor-pointer transition ${
                  hoveredIndex === slice.index ? "bg-white/10" : "hover:bg-white/5"
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: slice.color }} />
                  <span className="text-gray-300 truncate text-[11px]">{slice.name}</span>
                </div>
                <span className="font-mono text-gray-400 text-[11px] shrink-0 tabular-nums">
                  {slice.percentage.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {(stockAlerts.length > 0 || sectorAlerts.length > 0) && (
        <div className="mt-4 pt-3 border-t border-white/5 flex flex-col gap-2">
          {stockAlerts.map((a, i) => (
            <div key={`sa-${i}`} className="flex items-center gap-2 text-rose-400 text-xs">
              <AlertTriangle size={14} className="shrink-0" />
              <span>
                <strong>{a.target}</strong> exceeds concentration limit ({a.weight}% &gt; {a.threshold}%)
              </span>
            </div>
          ))}
          {sectorAlerts.map((a, i) => (
            <div key={`sec-${i}`} className="flex items-center gap-2 text-amber-400 text-xs">
              <AlertTriangle size={14} className="shrink-0" />
              <span>
                Sector <strong>{a.target}</strong> exceeds safe limit ({a.weight}% &gt; {a.threshold}%)
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
