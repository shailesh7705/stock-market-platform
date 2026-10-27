// client/src/components/charts/StockDetailsChart.jsx
import { useEffect, useState, useMemo } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { motion } from "framer-motion";
import { getHistoricalData } from "../../services/stockService";
import {
  LineChart as LineIcon,
  BarChart2,
  TrendingUp,
  Activity,
  Layers,
  Eye,
  Sliders,
} from "lucide-react";

const RANGES = [
  { label: "1D", value: "1d" },
  { label: "1W", value: "1wk" },
  { label: "1M", value: "1mo" },
  { label: "3M", value: "3mo" },
  { label: "1Y", value: "1y" },
];

// Helper to compute Exponential Moving Average (EMA)
function calculateEMA(data, period = 20) {
  if (!data || data.length === 0) return [];
  const k = 2 / (period + 1);
  let ema = data[0].close || data[0].price;
  return data.map((d, i) => {
    const val = d.close || d.price;
    if (i === 0) {
      return { ...d, ema: parseFloat(val.toFixed(2)) };
    }
    ema = val * k + ema * (1 - k);
    return { ...d, ema: parseFloat(ema.toFixed(2)) };
  });
}

// Custom Candle Shape for Candlestick rendering
function CandlestickBar(props) {
  const { x, y, width, height, payload, yAxis } = props;
  if (!payload || !yAxis) return null;

  const { open, close, high, low } = payload;
  if (open === undefined || close === undefined || high === undefined || low === undefined) {
    return null;
  }

  const isUp = close >= open;
  const color = isUp ? "#10b981" : "#f43f5e";

  // Scale prices to pixel Y coordinates
  const scale = yAxis.scale;
  const yOpen = scale(open);
  const yClose = scale(close);
  const yHigh = scale(high);
  const yLow = scale(low);

  const candleTop = Math.min(yOpen, yClose);
  const candleHeight = Math.max(2, Math.abs(yOpen - yClose));
  const candleWidth = Math.max(3, Math.min(width * 0.7, 14));
  const candleX = x + (width - candleWidth) / 2;
  const wickX = x + width / 2;

  return (
    <g>
      {/* High-Low Wick */}
      <line
        x1={wickX}
        y1={yHigh}
        x2={wickX}
        y2={yLow}
        stroke={color}
        strokeWidth={1.5}
        strokeOpacity={0.8}
      />
      {/* Open-Close Candle Body */}
      <rect
        x={candleX}
        y={candleTop}
        width={candleWidth}
        height={candleHeight}
        fill={color}
        rx={1.5}
      />
    </g>
  );
}

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const data = payload[0]?.payload;
  if (!data) return null;

  const isUp = (data.close || data.price) >= (data.open || data.price);
  return (
    <div className="bg-[#0b1120]/95 border border-white/15 rounded-2xl p-3 shadow-2xl backdrop-blur-xl text-xs space-y-1 z-50">
      <p className="text-gray-400 font-semibold mb-1 pb-1 border-b border-white/[0.08]">
        {data.date}
      </p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        <div>
          <span className="text-gray-500">Open: </span>
          <span className="font-bold text-white">
            ₹{data.open ? data.open.toLocaleString("en-IN") : "—"}
          </span>
        </div>
        <div>
          <span className="text-gray-500">High: </span>
          <span className="font-bold text-emerald-400">
            ₹{data.high ? data.high.toLocaleString("en-IN") : "—"}
          </span>
        </div>
        <div>
          <span className="text-gray-500">Low: </span>
          <span className="font-bold text-rose-400">
            ₹{data.low ? data.low.toLocaleString("en-IN") : "—"}
          </span>
        </div>
        <div>
          <span className="text-gray-500">Close: </span>
          <span className={`font-bold ${isUp ? "text-emerald-400" : "text-rose-400"}`}>
            ₹{(data.close || data.price).toLocaleString("en-IN")}
          </span>
        </div>
      </div>
      {data.volume > 0 && (
        <div className="pt-1 border-t border-white/[0.08] text-[11px] text-gray-400">
          Volume: <span className="font-bold text-white">{data.volume.toLocaleString("en-IN")}</span>
        </div>
      )}
      {data.ema && (
        <div className="text-[11px] text-amber-400">
          20 EMA: ₹{data.ema.toLocaleString("en-IN")}
        </div>
      )}
    </div>
  );
}

function StockDetailsChart({ symbol = "RELIANCE.NS" }) {
  const [rawData, setRawData] = useState([]);
  const [range, setRange] = useState("1mo");
  const [chartType, setChartType] = useState("area"); // "area" | "candle"
  const [showEMA, setShowEMA] = useState(true);
  const [showVolume, setShowVolume] = useState(true);
  const [loading, setLoading] = useState(true);
  const [hoveredPoint, setHoveredPoint] = useState(null);

  useEffect(() => {
    fetchChartData();
  }, [range, symbol]);

  const fetchChartData = async () => {
    setLoading(true);
    try {
      const data = await getHistoricalData(symbol, range);
      setRawData(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Add 20 EMA calculation
  const enrichedData = useMemo(() => {
    return calculateEMA(rawData, 20);
  }, [rawData]);

  const activePoint = hoveredPoint || enrichedData[enrichedData.length - 1];
  const firstPoint = enrichedData[0];
  const latestPrice = activePoint?.close || activePoint?.price || 0;
  const firstPrice = firstPoint?.close || firstPoint?.price || latestPrice;
  const gain = latestPrice - firstPrice;
  const gainPct = firstPrice > 0 ? ((gain / firstPrice) * 100).toFixed(2) : "0.00";
  const positive = gain >= 0;
  const lineColor = positive ? "#10b981" : "#f43f5e";

  // Dynamic Y-axis domains
  const prices = enrichedData.map((d) => d.high || d.price).filter(Boolean);
  const lows = enrichedData.map((d) => d.low || d.price).filter(Boolean);
  const minPrice = lows.length ? Math.min(...lows) : 0;
  const maxPrice = prices.length ? Math.max(...prices) : 100;
  const padding = (maxPrice - minPrice) * 0.08 || 1;
  const yDomain = [Math.floor(minPrice - padding), Math.ceil(maxPrice + padding)];

  // Max volume for volume bar scaling
  const maxVolume = Math.max(...enrichedData.map((d) => d.volume || 0), 1000);

  return (
    <div className="space-y-4">
      {/* ── Top Bar: OHLC Header, Timeframe & Chart Controls ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-white/[0.08]">
        {/* Left: Price and Live OHLC ticker banner */}
        <div>
          <div className="flex items-baseline gap-2.5">
            <span className="text-2xl font-extrabold text-white tracking-tight">
              ₹{latestPrice.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </span>
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                positive
                  ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                  : "bg-rose-500/15 text-rose-400 border border-rose-500/20"
              }`}
            >
              {positive ? "+" : ""}
              {gain.toLocaleString("en-IN", { minimumFractionDigits: 2 })} ({positive ? "+" : ""}
              {gainPct}%)
            </span>
          </div>

          {/* Interactive OHLC Banner (TradingView style) */}
          {activePoint && (
            <div className="flex items-center gap-3 text-[11px] text-gray-400 font-medium mt-1.5 flex-wrap">
              <span>
                O: <strong className="text-white">₹{activePoint.open || activePoint.price}</strong>
              </span>
              <span>
                H: <strong className="text-emerald-400">₹{activePoint.high || activePoint.price}</strong>
              </span>
              <span>
                L: <strong className="text-rose-400">₹{activePoint.low || activePoint.price}</strong>
              </span>
              <span>
                C: <strong className="text-white">₹{activePoint.close || activePoint.price}</strong>
              </span>
              {activePoint.volume > 0 && (
                <span>
                  Vol: <strong className="text-gray-300">{(activePoint.volume / 100000).toFixed(1)}L</strong>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Right: Timeframe, Chart Type & Indicators */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Chart Type Toggle: Area vs Candlestick */}
          <div className="flex items-center gap-1 bg-[#080d1a] border border-white/[0.08] p-1 rounded-xl">
            <button
              onClick={() => setChartType("area")}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                chartType === "area"
                  ? "bg-emerald-500 text-black shadow-sm"
                  : "text-gray-400 hover:text-white"
              }`}
              title="Line / Area Chart"
            >
              <LineIcon size={14} />
              <span className="text-[11px]">Line</span>
            </button>

            <button
              onClick={() => setChartType("candle")}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                chartType === "candle"
                  ? "bg-emerald-500 text-black shadow-sm"
                  : "text-gray-400 hover:text-white"
              }`}
              title="Candlestick Chart"
            >
              <BarChart2 size={14} />
              <span className="text-[11px]">Candles</span>
            </button>
          </div>

          {/* Indicator Toggles */}
          <div className="flex items-center gap-1 bg-[#080d1a] border border-white/[0.08] p-1 rounded-xl">
            <button
              onClick={() => setShowEMA(!showEMA)}
              className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all ${
                showEMA
                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                  : "text-gray-500 hover:text-gray-300"
              }`}
              title="Toggle 20 Exponential Moving Average"
            >
              20 EMA
            </button>

            <button
              onClick={() => setShowVolume(!showVolume)}
              className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all ${
                showVolume
                  ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                  : "text-gray-500 hover:text-gray-300"
              }`}
              title="Toggle Volume Bars"
            >
              Volume
            </button>
          </div>

          {/* Timeframe Selector */}
          <div className="flex items-center gap-1 bg-[#080d1a] border border-white/[0.08] p-1 rounded-xl">
            {RANGES.map(({ label, value }) => (
              <button
                key={value}
                onClick={() => setRange(value)}
                className={`h-7 px-2.5 rounded-lg text-xs font-bold transition-all ${
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
      </div>

      {/* ── Main Chart Canvas ── */}
      {loading ? (
        <div className="h-80 flex items-center justify-center">
          <div className="flex items-center gap-2 text-xs text-gray-400 animate-pulse">
            <svg className="animate-spin w-4 h-4 text-emerald-400" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.2" />
              <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </svg>
            Loading NSE data...
          </div>
        </div>
      ) : (
        <div className="h-80 w-full relative">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={enrichedData}
              onMouseMove={(e) => {
                if (e?.activePayload?.[0]?.payload) {
                  setHoveredPoint(e.activePayload[0].payload);
                }
              }}
              onMouseLeave={() => setHoveredPoint(null)}
              margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
            >
              <defs>
                <linearGradient id="areaColor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={lineColor} stopOpacity={0.3} />
                  <stop offset="90%" stopColor={lineColor} stopOpacity={0.0} />
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
                yAxisId="price"
                domain={yDomain}
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#64748b", fontSize: 11 }}
                tickFormatter={(v) => `₹${v.toLocaleString("en-IN")}`}
                width={70}
                orientation="right"
              />

              {/* Volume Y-Axis (Hidden, scales volume bars to bottom 20% of chart) */}
              <YAxis
                yAxisId="volume"
                domain={[0, maxVolume * 4.5]}
                hide={true}
                orientation="left"
              />

              <Tooltip content={<CustomTooltip />} />

              {/* Volume Bars at bottom */}
              {showVolume && (
                <Bar
                  yAxisId="volume"
                  dataKey="volume"
                  fill="#334155"
                  opacity={0.35}
                  barSize={range === "1d" ? 4 : 8}
                  isAnimationActive={false}
                />
              )}

              {/* Area Line Chart */}
              {chartType === "area" && (
                <Area
                  yAxisId="price"
                  type="monotone"
                  dataKey="price"
                  stroke={lineColor}
                  strokeWidth={2.2}
                  fill="url(#areaColor)"
                  dot={false}
                  activeDot={{ r: 5, fill: lineColor, strokeWidth: 0 }}
                />
              )}

              {/* Candlestick Chart */}
              {chartType === "candle" && (
                <Bar
                  yAxisId="price"
                  dataKey="close"
                  shape={<CandlestickBar />}
                  isAnimationActive={false}
                />
              )}

              {/* 20 EMA Overlay */}
              {showEMA && (
                <Line
                  yAxisId="price"
                  type="monotone"
                  dataKey="ema"
                  stroke="#f59e0b"
                  strokeWidth={1.8}
                  dot={false}
                  name="20 EMA"
                  strokeDasharray="3 3"
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

export default StockDetailsChart;
