// client/src/pages/legal/DisclaimerPage.jsx
import Card from "../../components/ui/Card";
import { Link } from "react-router-dom";
import { ArrowLeft, ShieldAlert, AlertTriangle } from "lucide-react";

export default function DisclaimerPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-white transition-colors"
      >
        <ArrowLeft size={14} /> Back to StockPulse
      </Link>

      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs font-bold text-amber-400">
          <ShieldAlert size={13} /> Regulatory Disclosure
        </div>
        <h1 className="text-3xl font-black text-white tracking-tight">
          Disclaimer & Risk Disclosure
        </h1>
        <p className="text-xs text-gray-400">SEBI Regulatory Notice for Indian Financial Markets</p>
      </div>

      <Card className="p-6 sm:p-8 space-y-6 text-sm text-gray-300 leading-relaxed border-amber-500/20">
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-3 text-amber-300 text-xs font-semibold leading-relaxed">
          <AlertTriangle size={18} className="shrink-0 mt-0.5 text-amber-400" />
          <p>
            Investments in securities market are subject to market risks. Read all the related documents carefully before investing. Registration granted by SEBI, membership of BASL (if applicable) and certification from NISM in no way guarantee performance of the intermediary or provide any assurance of returns to investors.
          </p>
        </div>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-white">1. Not SEBI Registered</h2>
          <p>
            StockPulse is an informational technology and data analytics product. We are <strong>not registered with the Securities and Exchange Board of India (SEBI)</strong> as a Research Analyst under SEBI (Research Analysts) Regulations, 2014, nor as an Investment Adviser under SEBI (Investment Advisers) Regulations, 2013.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-white">2. No Financial Advice or Recommendations</h2>
          <p>
            Nothing published on StockPulse constitutes financial, tax, legal, or investment advice. The platform does not offer stock recommendations, “tips”, buy/sell signals, target price promises, or portfolio management services.
          </p>
          <p>
            All scores (including the <strong>PulseScore™</strong> proprietary heuristic), financial ratios, screener filters, sector classifications, and automated 1Y/3Y/5Y projections are <strong>mathematical algorithmic outputs</strong> calculated on historical data for educational evaluation only.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-white">3. Third-Party Market Data Feeds</h2>
          <p>
            Stock quotes, index levels, financial balance sheets, and company filings are obtained via public data sources including Yahoo Finance and public regulatory registries. <strong>Real-time pricing is delayed by approximately 15 minutes</strong> unless explicitly stated otherwise.
          </p>
          <p>
            StockPulse does not guarantee the accuracy, completeness, or timeliness of market data and shall not be responsible for any investment decisions taken on the basis of data displayed on this application.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-white">4. Independent Advice Recommended</h2>
          <p>
            Investors are advised to consult a qualified, SEBI-registered financial planner or investment adviser before taking any investment decisions. StockPulse shall not be liable for any trading losses or financial outcomes.
          </p>
        </section>
      </Card>
    </div>
  );
}
