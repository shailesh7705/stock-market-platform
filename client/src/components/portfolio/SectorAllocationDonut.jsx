import { useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { AlertTriangle } from "lucide-react";

const COLORS = ["#f59e0b", "#34d399", "#38bdf8", "#a78bfa", "#fb7185", "#fbbf24", "#2dd4bf", "#94a3b8"];

function formatINR(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

export default function SectorAllocationDonut({ sectors = [], alerts = [] }) {
  const [mode, setMode] = useState("current");
  const data = sectors
    .map((sector) => ({
      name: sector.sector,
      value: mode === "invested" ? sector.invested : sector.current,
    }))
    .filter((sector) => sector.value > 0);

  const stockAlerts = alerts.filter((alert) => alert.type === "stock");
  const sectorAlerts = alerts.filter((alert) => alert.type === "sector");

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
        <div className="h-52 mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" innerRadius={52} outerRadius={78} paddingAngle={2}>
                {data.map((entry, index) => (
                  <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value, name) => [formatINR(value), name]} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="space-y-1.5 mt-2">
        {data.map((sector, index) => (
          <div key={sector.name} className="flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-2 text-gray-300">
              <span className="w-2 h-2 rounded-full" style={{ background: COLORS[index % COLORS.length] }} />
              {sector.name}
            </span>
            <span className="font-mono text-white">{formatINR(sector.value)}</span>
          </div>
        ))}
      </div>

      {(stockAlerts.length > 0 || sectorAlerts.length > 0) && (
        <div className="mt-4 space-y-2">
          {stockAlerts.map((alert) => (
            <div key={alert.symbol} className="flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-[11px] text-rose-200">
              <AlertTriangle size={14} className="mt-0.5 shrink-0" />
              <span>{alert.symbol?.replace(".NS", "")} is {alert.weight}% of the book. Single-stock limit is {alert.threshold}%.</span>
            </div>
          ))}
          {sectorAlerts.map((alert) => (
            <div key={alert.sector} className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-100">
              <AlertTriangle size={14} className="mt-0.5 shrink-0" />
              <span>{alert.sector} is {alert.weight}% of the book. Sector limit is {alert.threshold}%.</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
