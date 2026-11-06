// client/src/components/layout/Footer.jsx
import { Link } from "react-router-dom";
import { Activity, ShieldCheck } from "lucide-react";

export default function Footer() {
  return (
    <footer className="w-full border-t border-white/[0.08] bg-[#060910] text-gray-400 mt-12 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Top Row: Brand & Quick Links */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-400 to-amber-600 p-0.5 flex items-center justify-center shadow-md shadow-amber-500/20">
              <div className="w-full h-full bg-[#080b11] rounded-[9px] flex items-center justify-center text-amber-400">
                <Activity size={16} />
              </div>
            </div>
            <div>
              <span className="text-base font-black text-white tracking-tight">StockPulse</span>
              <span className="text-[10px] font-bold text-amber-400 ml-1.5 uppercase font-mono px-1.5 py-0.2 rounded bg-amber-500/10 border border-amber-500/20">
                PRO
              </span>
            </div>
          </div>

          {/* Links */}
          <nav aria-label="Footer Navigation" className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-semibold">
            <Link to="/markets" className="hover:text-white transition-colors">
              NSE Markets
            </Link>
            <Link to="/watchlist" className="hover:text-white transition-colors">
              Watchlist
            </Link>
            <Link to="/portfolio" className="hover:text-white transition-colors">
              Portfolio
            </Link>
            <Link to="/alerts" className="hover:text-white transition-colors">
              Alerts
            </Link>
            <Link to="/settings" className="hover:text-white transition-colors">
              Settings
            </Link>
            <Link to="/disclaimer" className="text-amber-400 hover:text-amber-300 transition-colors">
              SEBI Disclaimer
            </Link>
            <Link to="/terms" className="hover:text-white transition-colors">
              Terms
            </Link>
            <Link to="/privacy" className="hover:text-white transition-colors">
              Privacy (DPDP)
            </Link>
          </nav>
        </div>

        {/* Regulatory Disclosure Notice */}
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] text-[11px] text-gray-500 leading-relaxed space-y-1.5">
          <div className="flex items-center gap-1.5 text-gray-400 font-bold">
            <ShieldCheck size={13} className="text-amber-400" />
            <span>SEBI Regulatory & Data Disclaimer</span>
          </div>
          <p>
            StockPulse is an educational & analytical research platform and is <strong>NOT a SEBI-registered Research Analyst or Investment Adviser</strong>. All algorithmic heuristics, PulseScores, forecasts, and screens are mathematical models generated for informational purposes only and do not constitute financial advice or investment recommendations.
          </p>
          <p>
            Equities and derivatives trading involve substantial risk of loss. Past performance is no guarantee of future returns. Market prices are delayed by ~15 minutes (Source: Yahoo Finance / Exchange Feeds).
          </p>
        </div>

        {/* Bottom Copyright & Timestamp */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
          <p>© {new Date().getFullYear()} StockPulse. Built for disciplined Indian retail investors.</p>
          <p className="font-mono text-[11px]">NSE Session: 09:15 – 15:30 IST</p>
        </div>
      </div>
    </footer>
  );
}
