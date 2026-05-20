import { useEffect, useState } from "react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip,
} from "recharts";
import { motion }             from "framer-motion";
import { getHistoricalData }  from "../../services/stockService";

const RANGES = [
  { label: "1D",  value: "1d"  },
  { label: "1W",  value: "1wk" },
  { label: "1M",  value: "1mo" },
];

// Custom tooltip
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#111827] border border-white/10 rounded-xl px-3 py-2.5 shadow-xl">
      <p className="text-[11px] text-gray-500 mb-0.5">{label}</p>
      <p className="text-[14px] font-bold text-white">
        ₹{Number(payload[0].value).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
      </p>
    </div>
  );
}

// Skeleton loader
function ChartSkeleton() {
  return (
    <div className="h-72 flex flex-col justify-end gap-1 px-2 animate-pulse">
      {[40, 55, 35, 65, 50, 70, 45, 60, 75, 55, 80, 65].map((h, i) => (
        <div
          key={i}
          style={{ height: `${h}%` }}
          className="bg-white/5 rounded-sm w-full"
        />
      ))}
    </div>
  );
}

function StockDetailsChart({ symbol = "RELIANCE.NS" }) {
  const [data,    setData]    = useState([]);
  const [range,   setRange]   = useState("1mo");
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(false);

  // FIX — refetch whenever symbol OR range changes
  useEffect(() => {
    fetchChartData();
  }, [range, symbol]);

  const fetchChartData = async () => {
    setLoading(true);
    setError(false);
    try {
      // FIX — pass the actual symbol received as prop
      const chartData = await getHistoricalData(symbol, range);
      setData(Array.isArray(chartData) ? chartData : []);
    } catch (err) {
      console.log("Chart fetch error:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const latestPrice = data[data.length - 1]?.price || 0;
  const firstPrice  = data[0]?.price || 0;
  const gain        = latestPrice - firstPrice;
  const gainPct     = firstPrice > 0 ? ((gain / firstPrice) * 100).toFixed(2) : "0.00";
  const positive    = gain >= 0;
  const lineColor   = positive ? "#22c55e" : "#ef4444";

  // Y-axis domain with padding
  const prices    = data.map((d) => d.price).filter(Boolean);
  const minPrice  = prices.length ? Math.min(...prices) : 0;
  const maxPrice  = prices.length ? Math.max(...prices) : 100;
  const padding   = (maxPrice - minPrice) * 0.05 || 1;
  const yDomain   = [minPrice - padding, maxPrice + padding];

  return (
    <div className="space-y-4">

      {/* Header row */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          {loading ? (
            <div className="animate-pulse">
              <div className="h-8 w-32 bg-white/10 rounded-lg mb-2" />
              <div className="h-4 w-20 bg-white/5 rounded-lg" />
            </div>
          ) : (
            <>
              <h2 className="text-[26px] font-bold text-white leading-none">
                ₹{latestPrice.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
              </h2>
              <p className={`text-sm mt-1.5 font-semibold
                ${positive ? "text-green-400" : "text-red-400"}`}>
                {positive ? "+" : ""}
                {gain.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                {" "}({positive ? "+" : ""}{gainPct}%)
              </p>
            </>
          )}
        </div>

        {/* Timeframe buttons */}
        <div className="flex items-center gap-1.5 bg-white/[0.04] border border-white/[0.07]
                        rounded-xl p-1">
          {RANGES.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => setRange(value)}
              className={`h-7 px-4 rounded-lg text-[11px] font-semibold transition-all
                ${range === value
                  ? "bg-green-500 text-black shadow-md"
                  : "text-gray-400 hover:text-white"}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart area */}
      {loading ? (
        <ChartSkeleton />
      ) : error || data.length === 0 ? (
        <div className="h-72 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-500 text-sm">Could not load chart data</p>
            <button
              onClick={fetchChartData}
              className="mt-2 text-xs text-green-400 hover:text-green-300"
            >
              Try again
            </button>
          </div>
        </div>
      ) : (
        <motion.div
          key={`${symbol}-${range}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="h-72"
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor={lineColor} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={lineColor} stopOpacity={0}    />
                </linearGradient>
              </defs>

              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#6b7280", fontSize: 11 }}
                interval="preserveStartEnd"
                tickCount={5}
              />

              <YAxis
                domain={yDomain}
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#6b7280", fontSize: 11 }}
                tickFormatter={(v) =>
                  `₹${Number(v).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`
                }
                width={70}
              />

              <Tooltip content={<CustomTooltip />} />

              <Area
                type="monotone"
                dataKey="price"
                stroke={lineColor}
                strokeWidth={2}
                fill="url(#colorPrice)"
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