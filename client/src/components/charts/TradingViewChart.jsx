// client/src/components/charts/TradingViewChart.jsx
import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import {
  createChart,
  CandlestickSeries,
  AreaSeries,
  BarSeries,
  LineSeries,
  HistogramSeries,
  CrosshairMode,
  ColorType,
  LineStyle,
} from "lightweight-charts";
import { getHistoricalData } from "../../services/stockService";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Layers,
  BarChart2,
  RefreshCw,
  AlertCircle,
  Maximize2,
  Sliders,
  Check,
} from "lucide-react";

const TIMEFRAMES = [
  { label: "1D", value: "1d" },
  { label: "5D", value: "5d" },
  { label: "1M", value: "1mo" },
  { label: "3M", value: "3mo" },
  { label: "6M", value: "6mo" },
  { label: "1Y", value: "1y" },
  { label: "5Y", value: "5y" },
];

const CHART_TYPES = [
  { id: "candlestick", label: "Candles" },
  { id: "area", label: "Area" },
  { id: "bars", label: "Bars" },
];

// ─── Mathematical Indicator Calculations ──────────────────────────────────────
function calculateSMA(data, period = 20) {
  const result = [];
  if (!data || data.length < period) return result;
  for (let i = period - 1; i < data.length; i++) {
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += data[i - j].close;
    }
    result.push({
      time: data[i].time,
      value: parseFloat((sum / period).toFixed(2)),
    });
  }
  return result;
}

function calculateEMA(data, period = 20) {
  const result = [];
  if (!data || data.length === 0) return result;
  const k = 2 / (period + 1);
  let prevEma = data[0].close;

  for (let i = 0; i < data.length; i++) {
    const close = data[i].close;
    if (i === 0) {
      prevEma = close;
    } else {
      prevEma = close * k + prevEma * (1 - k);
    }
    if (i >= period - 1) {
      result.push({
        time: data[i].time,
        value: parseFloat(prevEma.toFixed(2)),
      });
    }
  }
  return result;
}

function calculateRSI(data, period = 14) {
  const result = [];
  if (!data || data.length <= period) return result;

  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const diff = data[i].close - data[i - 1].close;
    if (diff >= 0) gains += diff;
    else losses += Math.abs(diff);
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  let rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  let rsi = 100 - 100 / (1 + rs);

  result.push({
    time: data[period].time,
    value: parseFloat(rsi.toFixed(2)),
  });

  for (let i = period + 1; i < data.length; i++) {
    const diff = data[i].close - data[i - 1].close;
    const currentGain = diff > 0 ? diff : 0;
    const currentLoss = diff < 0 ? Math.abs(diff) : 0;

    avgGain = (avgGain * (period - 1) + currentGain) / period;
    avgLoss = (avgLoss * (period - 1) + currentLoss) / period;

    rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    rsi = 100 - 100 / (1 + rs);

    result.push({
      time: data[i].time,
      value: parseFloat(rsi.toFixed(2)),
    });
  }

  return result;
}

function calculateMACD(data, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
  if (!data || data.length <= slowPeriod) return { macd: [], signal: [], hist: [] };

  const fastK = 2 / (fastPeriod + 1);
  const slowK = 2 / (slowPeriod + 1);
  const signalK = 2 / (signalPeriod + 1);

  let fastEMA = data[0].close;
  let slowEMA = data[0].close;

  const macdValues = [];
  for (let i = 0; i < data.length; i++) {
    const close = data[i].close;
    if (i > 0) {
      fastEMA = close * fastK + fastEMA * (1 - fastK);
      slowEMA = close * slowK + slowEMA * (1 - slowK);
    }
    if (i >= slowPeriod - 1) {
      macdValues.push({
        time: data[i].time,
        macd: fastEMA - slowEMA,
      });
    }
  }

  const macd = [];
  const signal = [];
  const hist = [];

  if (macdValues.length === 0) return { macd, signal, hist };
  let signalEMA = macdValues[0].macd;

  for (let i = 0; i < macdValues.length; i++) {
    const m = macdValues[i].macd;
    if (i === 0) {
      signalEMA = m;
    } else {
      signalEMA = m * signalK + signalEMA * (1 - signalK);
    }

    if (i >= signalPeriod - 1) {
      const h = m - signalEMA;
      macd.push({ time: macdValues[i].time, value: parseFloat(m.toFixed(2)) });
      signal.push({ time: macdValues[i].time, value: parseFloat(signalEMA.toFixed(2)) });
      hist.push({
        time: macdValues[i].time,
        value: parseFloat(h.toFixed(2)),
        color: h >= 0 ? "rgba(16, 185, 129, 0.7)" : "rgba(239, 68, 68, 0.7)",
      });
    }
  }

  return { macd, signal, hist };
}

function formatINR(val) {
  if (val === undefined || val === null || isNaN(val)) return "—";
  return Number(val).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatVolume(val) {
  if (!val || isNaN(val)) return "—";
  if (val >= 10000000) return `${(val / 10000000).toFixed(2)} Cr`;
  if (val >= 100000) return `${(val / 100000).toFixed(2)} L`;
  if (val >= 1000) return `${(val / 1000).toFixed(1)}k`;
  return val.toLocaleString("en-IN");
}

export default function TradingViewChart({
  symbol = "RELIANCE.NS",
  stockName = "",
  currentPrice,
  priceChange,
  changeAmount,
}) {
  const containerRef = useRef(null);
  const rsiContainerRef = useRef(null);
  const macdContainerRef = useRef(null);

  const chartRef = useRef(null);
  const rsiChartRef = useRef(null);
  const macdChartRef = useRef(null);

  // Timeframe and type state
  const [timeframe, setTimeframe] = useState("1mo");
  const [chartType, setChartType] = useState("candlestick"); // "candlestick" | "area" | "bars"

  // Indicator toggles
  const [showSMA, setShowSMA] = useState(false);
  const [showEMA, setShowEMA] = useState(true);
  const [showVolume, setShowVolume] = useState(true);
  const [showRSI, setShowRSI] = useState(false);
  const [showMACD, setShowMACD] = useState(false);

  // Data & State
  const [rawData, setRawData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hoverData, setHoverData] = useState(null);

  const cleanSymbol = useMemo(
    () => (symbol || "").replace(".NS", "").replace(".BO", "").toUpperCase(),
    [symbol]
  );

  // Fetch real OHLC data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getHistoricalData(symbol, timeframe);
      if (!Array.isArray(data) || data.length === 0) {
        setError("No historical market data available for this timeframe.");
        setRawData([]);
        return;
      }

      // Sort and deduplicate timestamps for Lightweight Charts requirement
      const seen = new Set();
      const cleanList = [];
      for (const item of data) {
        if (!item || item.time === undefined || seen.has(item.time)) continue;
        seen.add(item.time);
        cleanList.push(item);
      }
      cleanList.sort((a, b) => a.time - b.time);

      setRawData(cleanList);
    } catch (err) {
      console.error("[TradingViewChart] Fetch error:", err);
      setError("Failed to load market chart. Please retry.");
    } finally {
      setLoading(false);
    }
  }, [symbol, timeframe]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Active prices display (hover or latest)
  const latestCandle = useMemo(() => {
    if (rawData.length === 0) return null;
    return rawData[rawData.length - 1];
  }, [rawData]);

  const activeDisplay = hoverData || latestCandle;
  const isCandlePositive = activeDisplay
    ? (activeDisplay.close ?? activeDisplay.price) >= (activeDisplay.open ?? activeDisplay.price)
    : true;

  // Build and sync TradingView Lightweight Charts
  useEffect(() => {
    if (!containerRef.current || rawData.length === 0) return;

    // Destroy existing instances if any
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }
    if (rsiChartRef.current) {
      rsiChartRef.current.remove();
      rsiChartRef.current = null;
    }
    if (macdChartRef.current) {
      macdChartRef.current.remove();
      macdChartRef.current = null;
    }

    const width = containerRef.current.clientWidth || 800;
    const height = 420;

    // ─── 1. Main Chart Setup ──────────────────────────────────────────────────
    const chart = createChart(containerRef.current, {
      width,
      height,
      layout: {
        background: { type: ColorType.Solid, color: "#080d1a" },
        textColor: "#94a3b8",
        fontSize: 11,
        fontFamily: "Inter, system-ui, -apple-system, sans-serif",
      },
      grid: {
        vertLines: { color: "rgba(255, 255, 255, 0.04)" },
        horzLines: { color: "rgba(255, 255, 255, 0.04)" },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: "rgba(255, 255, 255, 0.25)",
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: "#1e293b",
        },
        horzLine: {
          color: "rgba(255, 255, 255, 0.25)",
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: "#1e293b",
        },
      },
      timeScale: {
        borderColor: "rgba(255, 255, 255, 0.08)",
        timeVisible: timeframe === "1d" || timeframe === "5d",
        secondsVisible: false,
      },
      rightPriceScale: {
        borderColor: "rgba(255, 255, 255, 0.08)",
        scaleMargins: {
          top: 0.08,
          bottom: showVolume ? 0.22 : 0.08,
        },
      },
    });
    chartRef.current = chart;

    // ─── 2. Add Main Price Series (Candles / Area / Bars) ─────────────────────
    let mainSeries;
    if (chartType === "candlestick") {
      mainSeries = chart.addSeries(CandlestickSeries, {
        upColor: "#10b981",
        downColor: "#ef4444",
        borderVisible: false,
        wickUpColor: "#10b981",
        wickDownColor: "#ef4444",
      });
      mainSeries.setData(
        rawData.map((d) => ({
          time: d.time,
          open: d.open ?? d.close,
          high: d.high ?? d.close,
          low: d.low ?? d.close,
          close: d.close,
        }))
      );
    } else if (chartType === "area") {
      mainSeries = chart.addSeries(AreaSeries, {
        topColor: "rgba(16, 185, 129, 0.35)",
        bottomColor: "rgba(16, 185, 129, 0.0)",
        lineColor: "#10b981",
        lineWidth: 2,
      });
      mainSeries.setData(
        rawData.map((d) => ({
          time: d.time,
          value: d.close,
        }))
      );
    } else if (chartType === "bars") {
      mainSeries = chart.addSeries(BarSeries, {
        upColor: "#10b981",
        downColor: "#ef4444",
      });
      mainSeries.setData(
        rawData.map((d) => ({
          time: d.time,
          open: d.open ?? d.close,
          high: d.high ?? d.close,
          low: d.low ?? d.close,
          close: d.close,
        }))
      );
    }

    // ─── 3. Volume Histogram ─────────────────────────────────────────────────
    let volumeSeries = null;
    if (showVolume) {
      volumeSeries = chart.addSeries(HistogramSeries, {
        priceFormat: { type: "volume" },
        priceScaleId: "volume_pane",
      });
      chart.priceScale("volume_pane").applyOptions({
        scaleMargins: {
          top: 0.78,
          bottom: 0,
        },
      });
      volumeSeries.setData(
        rawData.map((d) => {
          const isUp = (d.close ?? 0) >= (d.open ?? d.close);
          return {
            time: d.time,
            value: d.volume || 0,
            color: isUp ? "rgba(16, 185, 129, 0.35)" : "rgba(239, 68, 68, 0.35)",
          };
        })
      );
    }

    // ─── 4. Technical Overlays (SMA & EMA) ───────────────────────────────────
    if (showSMA) {
      const smaData = calculateSMA(rawData, 20);
      if (smaData.length > 0) {
        const smaSeries = chart.addSeries(LineSeries, {
          color: "#38bdf8",
          lineWidth: 2,
          title: "SMA 20",
        });
        smaSeries.setData(smaData);
      }
    }

    if (showEMA) {
      const emaData = calculateEMA(rawData, 20);
      if (emaData.length > 0) {
        const emaSeries = chart.addSeries(LineSeries, {
          color: "#f59e0b",
          lineWidth: 2,
          title: "EMA 20",
        });
        emaSeries.setData(emaData);
      }
    }

    // Crosshair Tooltip Hover
    chart.subscribeCrosshairMove((param) => {
      if (!param.time || !param.point || param.point.x < 0 || param.point.y < 0) {
        setHoverData(null);
        return;
      }
      const p = param.seriesData.get(mainSeries);
      const v = volumeSeries ? param.seriesData.get(volumeSeries) : null;
      if (p) {
        setHoverData({
          time: param.time,
          open: p.open ?? p.value,
          high: p.high ?? p.value,
          low: p.low ?? p.value,
          close: p.close ?? p.value,
          price: p.close ?? p.value,
          volume: v?.value ?? null,
        });
      }
    });

    chart.timeScale().fitContent();

    // ─── 5. RSI Indicator Sub-Chart ──────────────────────────────────────────
    if (showRSI && rsiContainerRef.current) {
      const rsiChart = createChart(rsiContainerRef.current, {
        width,
        height: 120,
        layout: {
          background: { type: ColorType.Solid, color: "#080d1a" },
          textColor: "#94a3b8",
          fontSize: 10,
        },
        grid: {
          vertLines: { color: "rgba(255, 255, 255, 0.03)" },
          horzLines: { color: "rgba(255, 255, 255, 0.03)" },
        },
        timeScale: {
          visible: !showMACD, // show time axis on bottom-most chart
          borderColor: "rgba(255, 255, 255, 0.08)",
        },
        rightPriceScale: {
          borderColor: "rgba(255, 255, 255, 0.08)",
          scaleMargins: { top: 0.1, bottom: 0.1 },
        },
      });
      rsiChartRef.current = rsiChart;

      const rsiSeries = rsiChart.addSeries(LineSeries, {
        color: "#a855f7",
        lineWidth: 2,
        title: "RSI 14",
      });
      const rsiData = calculateRSI(rawData, 14);
      rsiSeries.setData(rsiData);

      // Overbought (70) and Oversold (30) levels
      if (rsiData.length > 0) {
        const obSeries = rsiChart.addSeries(LineSeries, {
          color: "rgba(239, 68, 68, 0.5)",
          lineStyle: LineStyle.Dashed,
          lineWidth: 1,
        });
        const osSeries = rsiChart.addSeries(LineSeries, {
          color: "rgba(16, 185, 129, 0.5)",
          lineStyle: LineStyle.Dashed,
          lineWidth: 1,
        });
        obSeries.setData(rsiData.map((d) => ({ time: d.time, value: 70 })));
        osSeries.setData(rsiData.map((d) => ({ time: d.time, value: 30 })));
      }

      // Sync Time Scales
      chart.timeScale().subscribeVisibleLogicalRangeChange((range) => {
        if (range && rsiChartRef.current) {
          rsiChartRef.current.timeScale().setVisibleLogicalRange(range);
        }
      });
      rsiChart.timeScale().subscribeVisibleLogicalRangeChange((range) => {
        if (range && chartRef.current) {
          chartRef.current.timeScale().setVisibleLogicalRange(range);
        }
      });
      rsiChart.timeScale().fitContent();
    }

    // ─── 6. MACD Indicator Sub-Chart ─────────────────────────────────────────
    if (showMACD && macdContainerRef.current) {
      const macdChart = createChart(macdContainerRef.current, {
        width,
        height: 120,
        layout: {
          background: { type: ColorType.Solid, color: "#080d1a" },
          textColor: "#94a3b8",
          fontSize: 10,
        },
        grid: {
          vertLines: { color: "rgba(255, 255, 255, 0.03)" },
          horzLines: { color: "rgba(255, 255, 255, 0.03)" },
        },
        timeScale: {
          visible: true,
          borderColor: "rgba(255, 255, 255, 0.08)",
        },
        rightPriceScale: {
          borderColor: "rgba(255, 255, 255, 0.08)",
        },
      });
      macdChartRef.current = macdChart;

      const { macd, signal, hist } = calculateMACD(rawData);

      const histSeries = macdChart.addSeries(HistogramSeries, {
        priceFormat: { type: "price" },
      });
      histSeries.setData(hist);

      const macdLineSeries = macdChart.addSeries(LineSeries, {
        color: "#3b82f6",
        lineWidth: 1.5,
        title: "MACD",
      });
      macdLineSeries.setData(macd);

      const signalLineSeries = macdChart.addSeries(LineSeries, {
        color: "#f97316",
        lineWidth: 1.5,
        title: "Signal",
      });
      signalLineSeries.setData(signal);

      // Sync Time Scales
      chart.timeScale().subscribeVisibleLogicalRangeChange((range) => {
        if (range && macdChartRef.current) {
          macdChartRef.current.timeScale().setVisibleLogicalRange(range);
        }
      });
      macdChart.timeScale().subscribeVisibleLogicalRangeChange((range) => {
        if (range && chartRef.current) {
          chartRef.current.timeScale().setVisibleLogicalRange(range);
        }
      });
      macdChart.timeScale().fitContent();
    }

    // ─── 7. Responsive Resizing with ResizeObserver ───────────────────────────
    const handleResize = () => {
      if (!containerRef.current) return;
      const newWidth = containerRef.current.clientWidth;
      if (chartRef.current) chartRef.current.applyOptions({ width: newWidth });
      if (rsiChartRef.current) rsiChartRef.current.applyOptions({ width: newWidth });
      if (macdChartRef.current) macdChartRef.current.applyOptions({ width: newWidth });
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      if (chartRef.current) chartRef.current.remove();
      if (rsiChartRef.current) rsiChartRef.current.remove();
      if (macdChartRef.current) macdChartRef.current.remove();
      chartRef.current = null;
      rsiChartRef.current = null;
      macdChartRef.current = null;
    };
  }, [
    rawData,
    chartType,
    timeframe,
    showSMA,
    showEMA,
    showVolume,
    showRSI,
    showMACD,
  ]);

  return (
    <div className="flex flex-col w-full bg-[#080d1a] border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
      {/* ── Top Header Banner: Symbol, Name, Price, % Change & Tooltip ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 bg-[#0e1626]/80 border-b border-white/[0.06]">
        {/* Left: Stock Identification & Live Price */}
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl font-black text-white tracking-tight">
              {cleanSymbol}
            </span>
            <span className="text-[10px] font-bold text-gray-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded-md">
              NSE Live
            </span>
            <span className="text-xs text-gray-400 font-medium truncate max-w-xs">
              {stockName}
            </span>
          </div>

          <div className="flex items-baseline gap-3 mt-1">
            <span className="text-2xl font-black text-white font-mono tracking-tight">
              ₹{formatINR(activeDisplay?.close ?? currentPrice)}
            </span>
            {priceChange !== undefined && (
              <span
                className={`text-xs font-bold flex items-center gap-1 px-2 py-0.5 rounded-full ${
                  (priceChange ?? 0) >= 0
                    ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20"
                    : "text-rose-400 bg-rose-500/10 border border-rose-500/20"
                }`}
              >
                {(priceChange ?? 0) >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {changeAmount !== undefined && (
                  <span>
                    {(changeAmount ?? 0) >= 0 ? "+" : ""}
                    ₹{formatINR(changeAmount)} (
                  </span>
                )}
                {(priceChange ?? 0) >= 0 ? "+" : ""}
                {Number(priceChange).toFixed(2)}%
                {changeAmount !== undefined && ")"}
              </span>
            )}
          </div>
        </div>

        {/* Right: Live OHLCV Crosshair Display Bar */}
        {activeDisplay && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 bg-[#080d1a]/80 border border-white/5 rounded-2xl px-3.5 py-2 text-xs font-mono">
            <div className="text-gray-400">
              O:{" "}
              <span className="text-white font-bold">
                ₹{formatINR(activeDisplay.open)}
              </span>
            </div>
            <div className="text-gray-400">
              H:{" "}
              <span className="text-emerald-400 font-bold">
                ₹{formatINR(activeDisplay.high)}
              </span>
            </div>
            <div className="text-gray-400">
              L:{" "}
              <span className="text-rose-400 font-bold">
                ₹{formatINR(activeDisplay.low)}
              </span>
            </div>
            <div className="text-gray-400">
              C:{" "}
              <span
                className={`font-bold ${
                  isCandlePositive ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                ₹{formatINR(activeDisplay.close)}
              </span>
            </div>
            {activeDisplay.volume > 0 && (
              <div className="text-gray-400 border-l border-white/10 pl-3">
                Vol:{" "}
                <span className="text-sky-300 font-semibold">
                  {formatVolume(activeDisplay.volume)}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Toolbar: Chart Types, Timeframe Pills & Indicators ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 bg-[#0a101f] border-b border-white/[0.06]">
        {/* Timeframe Selectors */}
        <div className="flex items-center gap-1 bg-[#0e1626] border border-white/10 p-1 rounded-xl">
          {TIMEFRAMES.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => setTimeframe(value)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                timeframe === value
                  ? "bg-emerald-500 text-black shadow-md shadow-emerald-500/20"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Chart Type Selector */}
        <div className="flex items-center gap-1 bg-[#0e1626] border border-white/10 p-1 rounded-xl">
          {CHART_TYPES.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setChartType(id)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                chartType === id
                  ? "bg-white/15 text-white shadow-sm"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Indicator Toggles */}
        <div className="flex flex-wrap items-center gap-1.5">
          {/* EMA (20) */}
          <button
            onClick={() => setShowEMA((p) => !p)}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition-all ${
              showEMA
                ? "bg-amber-500/15 border-amber-500/30 text-amber-300"
                : "bg-white/5 border-white/10 text-gray-400 hover:text-white"
            }`}
            title="Toggle 20-period Exponential Moving Average"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            EMA 20
          </button>

          {/* SMA (20) */}
          <button
            onClick={() => setShowSMA((p) => !p)}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition-all ${
              showSMA
                ? "bg-sky-500/15 border-sky-500/30 text-sky-300"
                : "bg-white/5 border-white/10 text-gray-400 hover:text-white"
            }`}
            title="Toggle 20-period Simple Moving Average"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
            SMA 20
          </button>

          {/* Volume */}
          <button
            onClick={() => setShowVolume((p) => !p)}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition-all ${
              showVolume
                ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
                : "bg-white/5 border-white/10 text-gray-400 hover:text-white"
            }`}
            title="Toggle Volume Bars"
          >
            <BarChart2 size={12} />
            Volume
          </button>

          {/* RSI (14) */}
          <button
            onClick={() => setShowRSI((p) => !p)}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition-all ${
              showRSI
                ? "bg-purple-500/20 border-purple-500/30 text-purple-300"
                : "bg-white/5 border-white/10 text-gray-400 hover:text-white"
            }`}
            title="Toggle 14-period Relative Strength Index"
          >
            <Activity size={12} />
            RSI 14
          </button>

          {/* MACD */}
          <button
            onClick={() => setShowMACD((p) => !p)}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition-all ${
              showMACD
                ? "bg-blue-500/20 border-blue-500/30 text-blue-300"
                : "bg-white/5 border-white/10 text-gray-400 hover:text-white"
            }`}
            title="Toggle MACD (12, 26, 9)"
          >
            <Layers size={12} />
            MACD
          </button>
        </div>
      </div>

      {/* ── Main Chart Body & Loading / Error States ── */}
      <div className="relative w-full min-h-[420px] bg-[#080d1a]">
        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 bg-[#080d1a]/80 backdrop-blur-xs flex flex-col items-center justify-center gap-3 z-30">
            <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
            <p className="text-xs text-gray-400 font-medium">
              Streaming real OHLC market data...
            </p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center z-30">
            <AlertCircle className="w-10 h-10 text-rose-400" />
            <p className="text-sm font-bold text-white">{error}</p>
            <button
              onClick={fetchData}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold inline-flex items-center gap-2 transition-all"
            >
              <RefreshCw size={13} /> Retry Data Fetch
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && rawData.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center z-30">
            <p className="text-sm text-gray-400">No chart data available</p>
          </div>
        )}

        {/* TradingView Lightweight Charts Viewport */}
        <div ref={containerRef} className="w-full h-[420px]" />

        {/* RSI Sub-Chart Pane */}
        {showRSI && (
          <div className="w-full border-t border-white/[0.06] bg-[#080d1a] relative">
            <div className="absolute left-3 top-2 text-[10px] font-bold text-purple-400 z-10 select-none">
              RSI (14) — 70 Overbought / 30 Oversold
            </div>
            <div ref={rsiContainerRef} className="w-full h-[120px]" />
          </div>
        )}

        {/* MACD Sub-Chart Pane */}
        {showMACD && (
          <div className="w-full border-t border-white/[0.06] bg-[#080d1a] relative">
            <div className="absolute left-3 top-2 text-[10px] font-bold text-blue-400 z-10 select-none">
              MACD (12, 26, 9)
            </div>
            <div ref={macdContainerRef} className="w-full h-[120px]" />
          </div>
        )}
      </div>

      {/* ── Footer Status & TradingView Attribution ── */}
      <div className="flex items-center justify-between px-5 py-2.5 bg-[#0a101f] border-t border-white/[0.06] text-[11px] text-gray-500">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Real-time OHLC candles powered by TradingView Engine</span>
        </div>
        <div className="font-mono">
          Exchange: <span className="text-gray-300">NSE India</span> | Currency:{" "}
          <span className="text-gray-300">INR (₹)</span>
        </div>
      </div>
    </div>
  );
}
