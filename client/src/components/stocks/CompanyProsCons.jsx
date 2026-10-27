// client/src/components/stocks/CompanyProsCons.jsx
import Card from "../ui/Card";
import {
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  TrendingUp,
  Scale,
  Sparkles,
  PieChart,
} from "lucide-react";

function CompanyProsCons({ stock }) {
  const price = stock?.price || 0;
  const pe = stock?.trailingPE || 0;
  const divYield = stock?.dividendYield || 0;
  const high52 = stock?.fiftyTwoWeekHigh || price * 1.25;
  const low52 = stock?.fiftyTwoWeekLow || price * 0.75;
  const span52 = high52 - low52 || 1;
  const rangePosition = Math.min(100, Math.max(0, ((price - low52) / span52) * 100));
  const isLargeCap = (stock?.marketCap || 0) > 400000000000; // >40k Cr

  // Dynamic Pros
  const pros = [];
  if (pe > 0 && pe < 28) {
    pros.push({
      title: "Attractive P/E Valuation",
      desc: `Trading at a reasonable P/E multiple of ${pe.toFixed(1)}x, well within fair value bands.`,
    });
  } else {
    pros.push({
      title: "Strong Brand Moat & Stature",
      desc: "Commanding dominant market share in its core segment with pricing power over competitors.",
    });
  }

  if (rangePosition >= 60) {
    pros.push({
      title: "Bullish Technical Momentum",
      desc: `Trading in the upper ${rangePosition.toFixed(0)}% of its 52-week range with consistent institutional accumulation.`,
    });
  } else {
    pros.push({
      title: "Favorable Entry Valuation Zone",
      desc: "Trading significantly below 52-week peak levels, presenting attractive accumulation room for swing investors.",
    });
  }

  if (isLargeCap) {
    pros.push({
      title: "Bluechip Balance Sheet Stability",
      desc: "Robust capital structure with strong operating cash flows and minimal solvency risk.",
    });
  } else {
    pros.push({
      title: "High Growth Runway",
      desc: "Significant domestic expansion opportunities across Indian enterprise and retail segments.",
    });
  }

  if (divYield >= 1.0) {
    pros.push({
      title: "Consistent Dividend Yield",
      desc: `Offers an attractive dividend yield of ${divYield.toFixed(2)}%, providing steady passive cash returns.`,
    });
  } else {
    pros.push({
      title: "High Daily Trading Liquidity",
      desc: "High trading turnover on the NSE ensures tight bid-ask spreads and seamless order execution.",
    });
  }

  // Dynamic Cons
  const cons = [];
  if (pe >= 30) {
    cons.push({
      title: "Trading at Premium Multiples",
      desc: `Current P/E of ${pe.toFixed(1)}x prices in optimistic forward growth, leaving limited margin of safety for quarterly earnings misses.`,
    });
  } else {
    cons.push({
      title: "Vulnerable to Macro Headwinds",
      desc: "Susceptible to raw material input inflation, domestic interest rate shifts, and currency swings.",
    });
  }

  if (rangePosition >= 85) {
    cons.push({
      title: "Approaching Overhead Resistance",
      desc: `Currently within ${((high52 - price) / price * 100).toFixed(1)}% of 52-week peak where short-term profit booking may trigger pullbacks.`,
    });
  } else if (rangePosition <= 30) {
    cons.push({
      title: "Short-Term Sector Pressure",
      desc: "Underperforming broader benchmark indices over recent months amid sector rotation.",
    });
  } else {
    cons.push({
      title: "Sector Competition & Disruption",
      desc: "Intensifying domestic and global competition could moderate operating margins over the medium term.",
    });
  }

  if (divYield < 0.8) {
    cons.push({
      title: "Modest Cash Dividend Payout",
      desc: `Offers a modest dividend yield of ${divYield ? divYield.toFixed(2) + "%" : "<1%"}, as earnings are predominantly retained for reinvestment.`,
    });
  } else {
    cons.push({
      title: "Cyclical Sensitivity",
      desc: "Demand cycles can fluctuate in response to broader industrial and consumer spending trends.",
    });
  }

  return (
    <Card className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-white tracking-tight">
              Investment Checklist (Pros & Cons)
            </h3>
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
              Tickertape Analysis
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            Key operational strengths and structural risks for Indian equity investors
          </p>
        </div>

        {/* Scorecard pill */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
            ✓ {pros.length} Strengths (Pros)
          </span>
          <span className="text-xs font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 rounded-lg">
            ⚠ {cons.length} Risks (Cons)
          </span>
        </div>
      </div>

      {/* Grid: Pros on Left, Cons on Right */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Pros Column */}
        <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/20 space-y-3">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
            <CheckCircle2 size={16} />
            <span>Company Strengths & Pros</span>
          </div>

          <div className="space-y-2.5">
            {pros.map((p, idx) => (
              <div key={idx} className="p-2.5 rounded-xl bg-[#080d1a]/80 border border-emerald-500/10">
                <p className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                  {p.title}
                </p>
                <p className="text-[11px] text-gray-400 mt-1 leading-relaxed pl-3">
                  {p.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Cons Column */}
        <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-500/20 space-y-3">
          <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase tracking-wider">
            <AlertTriangle size={16} />
            <span>Risks & Limitations (Cons)</span>
          </div>

          <div className="space-y-2.5">
            {cons.map((c, idx) => (
              <div key={idx} className="p-2.5 rounded-xl bg-[#080d1a]/80 border border-rose-500/10">
                <p className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
                  {c.title}
                </p>
                <p className="text-[11px] text-gray-400 mt-1 leading-relaxed pl-3">
                  {c.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}

export default CompanyProsCons;
