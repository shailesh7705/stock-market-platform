// client/src/components/stocks/StockInsights.jsx
import Card from "../ui/Card";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  BarChart3,
  Scale,
  DollarSign,
  PieChart,
  ShieldAlert,
  Sparkles,
} from "lucide-react";

function formatIndianNumber(val) {
  if (!val || isNaN(val)) return "—";
  if (val >= 10000000) {
    const cr = val / 10000000;
    if (cr >= 100000) {
      return `₹${(cr / 100000).toFixed(2)} Lakh Cr`;
    }
    return `₹${cr.toFixed(2)} Cr`;
  }
  if (val >= 100000) {
    return `₹${(val / 100000).toFixed(2)} L`;
  }
  return `₹${val.toLocaleString("en-IN")}`;
}

function StockInsights({ stock }) {
  const price = stock?.price || 0;
  const dayLow = stock?.low || price * 0.98;
  const dayHigh = stock?.high || price * 1.02;
  const low52 = stock?.fiftyTwoWeekLow || price * 0.75;
  const high52 = stock?.fiftyTwoWeekHigh || price * 1.25;

  // Day Range percentage
  const dayRangeSpan = dayHigh - dayLow || 1;
  const dayPct = Math.min(100, Math.max(0, ((price - dayLow) / dayRangeSpan) * 100));

  // 52W Range percentage
  const span52 = high52 - low52 || 1;
  const pct52 = Math.min(100, Math.max(0, ((price - low52) / span52) * 100));

  const isPositive = stock?.positive;
  const pe = stock?.trailingPE ? stock.trailingPE.toFixed(1) : "—";
  const divYield = stock?.dividendYield ? `${stock.dividendYield.toFixed(2)}%` : "—";

  return (
    <div className="space-y-4">
      {/* ── 52-Week & Day Range Gauges (Tickertape Signature) ── */}
      <Card className="space-y-5">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
            <BarChart3 size={16} className="text-emerald-400" />
            Price Range Analysis
          </h3>

          {/* Today's Range */}
          <div className="space-y-1.5 mb-5">
            <div className="flex items-center justify-between text-[11px] text-gray-400">
              <span>Day Low: ₹{dayLow.toLocaleString("en-IN", { maximumFractionDigits: 1 })}</span>
              <span className="font-bold text-white">Today's Range</span>
              <span>Day High: ₹{dayHigh.toLocaleString("en-IN", { maximumFractionDigits: 1 })}</span>
            </div>
            <div className="relative w-full h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="absolute top-0 bottom-0 bg-gradient-to-r from-blue-500 to-emerald-400 rounded-full"
                style={{ width: `${dayPct}%` }}
              />
            </div>
            <div className="flex justify-end text-[10px] text-emerald-400 font-semibold">
              Current: ₹{price.toLocaleString("en-IN")}
            </div>
          </div>

          {/* 52-Week Range */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-gray-400">
              <span>52W L: ₹{low52.toLocaleString("en-IN", { maximumFractionDigits: 1 })}</span>
              <span className="font-bold text-white">52-Week Range</span>
              <span>52W H: ₹{high52.toLocaleString("en-IN", { maximumFractionDigits: 1 })}</span>
            </div>
            <div className="relative w-full h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="absolute top-0 bottom-0 bg-gradient-to-r from-amber-500 to-emerald-400 rounded-full"
                style={{ width: `${pct52}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-gray-400">
              <span>{pct52.toFixed(0)}% of 52W range</span>
              <span className="text-emerald-400 font-semibold">
                {price >= high52 * 0.95 ? "Near 52W High 🚀" : "Trading in Range"}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* ── Key Fundamentals Grid ── */}
      <Card>
        <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
          <Scale size={16} className="text-blue-400" />
          Key Fundamentals
        </h3>

        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-[#080d1a] border border-white/[0.05] rounded-xl">
            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">
              Market Capitalization
            </p>
            <p className="text-[14px] font-extrabold text-white mt-1">
              {formatIndianNumber(stock?.marketCap)}
            </p>
          </div>

          <div className="p-3 bg-[#080d1a] border border-white/[0.05] rounded-xl">
            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">
              P/E Ratio (TTM)
            </p>
            <p className="text-[14px] font-extrabold text-white mt-1">
              {pe}
            </p>
          </div>

          <div className="p-3 bg-[#080d1a] border border-white/[0.05] rounded-xl">
            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">
              Volume (Today)
            </p>
            <p className="text-[14px] font-extrabold text-white mt-1">
              {stock?.volume ? stock.volume.toLocaleString("en-IN") : "—"}
            </p>
          </div>

          <div className="p-3 bg-[#080d1a] border border-white/[0.05] rounded-xl">
            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">
              Dividend Yield
            </p>
            <p className="text-[14px] font-extrabold text-white mt-1">
              {divYield}
            </p>
          </div>

          <div className="p-3 bg-[#080d1a] border border-white/[0.05] rounded-xl">
            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">
              Previous Close
            </p>
            <p className="text-[14px] font-extrabold text-white mt-1">
              ₹{stock?.prevClose ? stock.prevClose.toLocaleString("en-IN") : "—"}
            </p>
          </div>

          <div className="p-3 bg-[#080d1a] border border-white/[0.05] rounded-xl">
            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">
              Open Price
            </p>
            <p className="text-[14px] font-extrabold text-white mt-1">
              ₹{stock?.open ? stock.open.toLocaleString("en-IN") : "—"}
            </p>
          </div>
        </div>
      </Card>

      {/* ── Technical Sentiment Meter ── */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Activity size={16} className="text-purple-400" />
            Market Sentiment & Signals
          </h3>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
              isPositive
                ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/25"
                : "bg-rose-500/15 text-rose-400 border-rose-500/25"
            }`}
          >
            {isPositive ? "Bullish Momentum" : "Selling Pressure"}
          </span>
        </div>

        <p className="text-xs text-gray-400 leading-relaxed">
          {isPositive
            ? `${stock?.shortName || stock?.symbol} is displaying strong positive momentum today with high buying volume. Setting a profit target alert will help capture target exits automatically.`
            : `${stock?.shortName || stock?.symbol} is undergoing short-term consolidation. A downward price alert can signal favorable accumulation dip zones.`}
        </p>
      </Card>
    </div>
  );
}

export default StockInsights;
