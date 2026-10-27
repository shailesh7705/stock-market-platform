// client/src/components/charts/StockDetailsChart.jsx
import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { motion } from "framer-motion";
import { getHistoricalData } from "../../services/stockService";

const RANGES = [
  { label: "1D", value: "1d" },
  { label: "1W", value: "1wk" },
  { label: "1M", value: "1mo" },
  { label: "3M", value: "3mo" },
  { label: "1Y", value: "1y" },
];

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0b1120] border border-white/15 rounded-xl px-3 py-2 shadow-2xl backdrop-blur-md">
      <p className="text-[11px] text-gray-400 mb-0.5">{label}</p>
      <p className="text-[14px] font-extrabold text-white">
        ₹{Number(payload[0].value).toLocaleString("en-IN", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
      </p>
    </div>
  );
}

function StockDetailsChart({ symbol = "RELIANCE.NS" }) {
  const [data, setData] = useState([]);
  const [range, setRange] = useState("1mo");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchChartData();
  }, [range, symbol]);

  const fetchChartData = async () => {
    setLoading(true);
    setError(false);
    try {
      const chartData = await getHistoricalData(symbol, range);
      setData(Array.isArray(chartData) ? chartData : []);
    } catch (err) {
      console.error("Chart fetch error:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const latestPrice = data[data.length - 1]?.price || 0;
  const firstPrice = data[0]?.price || 0;
  const gain = latestPrice - firstPrice;
  const gainPct = firstPrice > 0 ? ((gain / firstPrice) * 100).toFixed(2) : "0.00";
  const positive = gain >= 0;
  const lineColor = positive ? "#10b981" : "#f43f5e";

  const prices = data.map((d) => d.price).filter(Boolean);
  const minPrice = prices.length ? Math.min(...prices) : 0;
  const maxPrice = prices.length ? Math.max(...prices) : 100;
  const padding = (maxPrice - minPrice) * 0.05 || 1;
  const yDomain = [Math.floor(minPrice - padding), Math.ceil(maxPrice + padding)];

  return (
    <div className="space-y-4">
      {/* Header row with timeframe & performance */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-white/[0.06]">
        <div>
          {loading ? (
            <div className="animate-pulse space-y-1">
              <div className="h-6 w-28 bg-white/10 rounded" />
              <div className="h-4 w-20 bg-white/5 rounded" />
            </div>
          ) : (
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-extrabold text-white">
                ₹{latestPrice.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
              <span
                className={`text-xs font-bold ${
                  positive ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {positive ? "+" : ""}
                {gain.toLocaleString("en-IN", { minimumFractionDigits: 2 })} ({positive ? "+" : ""}
                {gainPct}%)
              </span>
              <span className="text-[10px] text-gray-500 font-semibold uppercase">
                · {range.toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* Timeframe Buttons */}
        <div className="flex items-center gap-1 bg-[#080d1a] border border-white/[0.08] rounded-xl p-1 shrink-0">
          {RANGES.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => setRange(value)}
              className={`h-7 px-3 rounded-lg text-xs font-bold transition-all ${
                range === value
                  ? "bg-emerald-500 text-black shadow-sm"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Canvas */}
      {loading ? (
        <div className="h-72 flex items-center justify-center">
          <div className="flex items-center gap-2 text-xs text-gray-400 animate-pulse">
            <svg className="animate-spin w-4 h-4 text-emerald-400" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.2" />
              <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </svg>
            Loading NSE interactive chart...
          </div>
        </div>
      ) : error || data.length === 0 ? (
        <div className="h-72 flex flex-col items-center justify-center text-center">
          <p className="text-gray-400 text-xs mb-2">Historical chart data temporarily unavailable</p>
          <button
            onClick={fetchChartData}
            className="text-xs text-emerald-400 hover:underline"
          >
            Retry
          </button>
        </div>
      ) : (
        <motion.div
          key={`${symbol}-${range}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="h-72 w-full"
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 6, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorPriceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={lineColor} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={lineColor} stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#64748b", fontSize: 11 }}
                interval="preserveStartEnd"
                tickCount={6}
              />

              <YAxis
                domain={yDomain}
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#64748b", fontSize: 11 }}
                tickFormatter={(v) =>
                  `₹${Number(v).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`
                }
                width={65}
              />

              <Tooltip content={<CustomTooltip />} />

              <Area
                type="monotone"
                dataKey="price"
                stroke={lineColor}
                strokeWidth={2.2}
                fill="url(#colorPriceGradient)"
                dot={false}
                activeDot={{ r: 4, fill: lineColor, strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      )}
    </div>
  );
}

export default StockDetailsChart;
