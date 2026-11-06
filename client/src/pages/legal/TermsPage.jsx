// client/src/pages/legal/TermsPage.jsx
import Card from "../../components/ui/Card";
import { Link } from "react-router-dom";
import { ArrowLeft, FileText, Shield } from "lucide-react";

export default function TermsPage() {
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
          <FileText size={13} /> Legal Documentation
        </div>
        <h1 className="text-3xl font-black text-white tracking-tight">Terms of Service</h1>
        <p className="text-xs text-gray-400">Last updated: November 2026</p>
      </div>

      <Card className="p-6 sm:p-8 space-y-6 text-sm text-gray-300 leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-white">1. Agreement to Terms</h2>
          <p>
            By accessing or using StockPulse (“we”, “our”, or “the Platform”), you agree to be bound by these Terms of Service. If you do not agree to these terms, you must not access or use our services.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-white">2. Informational & Educational Use Only</h2>
          <p>
            StockPulse provides automated quantitative analysis, historical data visualization, and market metrics for educational and research purposes only. The platform is not an investment advisory service, broker, or depository participant. We do not facilitate trades or transactions.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-white">3. Not a SEBI Registered Entity</h2>
          <p>
            StockPulse is <strong>not registered with the Securities and Exchange Board of India (SEBI)</strong> as a Research Analyst (under SEBI Research Analysts Regulations, 2014) or as an Investment Adviser (under SEBI Investment Advisers Regulations, 2013). No algorithmic score, ranking, or projection constitutes personalized investment advice or an endorsement of any security.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-white">4. User Account & Security</h2>
          <p>
            You are responsible for safeguarding your credentials and for all activities conducted through your account. You agree to notify us immediately of any unauthorized use of your account.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-white">5. Market Data & Limitation of Liability</h2>
          <p>
            Market data, fundamental financial metrics, and company disclosures displayed on StockPulse are sourced from third-party data providers including Yahoo Finance and public exchange filings. Quotes may be delayed by 15 minutes or more. While we endeavor to provide accurate information, we make no representations or warranties regarding data accuracy, completeness, or timeliness.
          </p>
          <p>
            To the maximum extent permitted by applicable law, StockPulse and its developers shall not be liable for any direct, indirect, incidental, or consequential losses resulting from reliance on data presented on the platform.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-white">6. Governing Law & Jurisdiction</h2>
          <p>
            These Terms shall be governed by and construed in accordance with the laws of India. Any disputes arising in connection with these Terms shall be subject to the exclusive jurisdiction of the competent courts in India.
          </p>
        </section>
      </Card>
    </div>
  );
}
