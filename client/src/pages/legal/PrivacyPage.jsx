// client/src/pages/legal/PrivacyPage.jsx
import Card from "../../components/ui/Card";
import { Link } from "react-router-dom";
import { ArrowLeft, Lock, CheckCircle2 } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-white transition-colors"
      >
        <ArrowLeft size={14} /> Back to StockPulse
      </Link>

      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-bold text-emerald-400">
          <Lock size={13} /> DPDP Act 2023 Compliant
        </div>
        <h1 className="text-3xl font-black text-white tracking-tight">Privacy Policy</h1>
        <p className="text-xs text-gray-400">Last updated: November 2026</p>
      </div>

      <Card className="p-6 sm:p-8 space-y-6 text-sm text-gray-300 leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-white">1. Introduction & Overview</h2>
          <p>
            At StockPulse, we respect your privacy and are committed to protecting your personal data in full compliance with the <strong>Digital Personal Data Protection Act, 2023 (DPDP Act)</strong> of India. This Privacy Policy describes how we collect, store, process, and safeguard your information.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-white">2. Data We Collect</h2>
          <ul className="list-disc pl-5 space-y-1 text-gray-400">
            <li><strong>Account Information:</strong> Name, email address, password hash (salted using bcrypt), account creation timestamps.</li>
            <li><strong>User Content:</strong> Watchlists, customized price alert triggers, simulated portfolio holdings, and notification preferences.</li>
            <li><strong>Technical & Session Data:</strong> Masked IP addresses, browser user-agent tokens for active session authentication, and error diagnostics.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-white">3. How We Use Your Data</h2>
          <p>We process your personal data strictly for:</p>
          <ul className="list-disc pl-5 space-y-1 text-gray-400">
            <li>Providing and maintaining your authenticated session and watchlists.</li>
            <li>Dispatching automated email price alert notifications that you have configured.</li>
            <li>Enhancing security, session rotation, and preventing unauthorized account takeover.</li>
          </ul>
          <p className="text-emerald-400 font-semibold pt-1">
            We do NOT sell, rent, monetize, or share your personal data with third-party advertisers or data brokers.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-white">4. Your Rights Under DPDP Act 2023</h2>
          <p>As a Data Principal under Indian law, you have absolute rights to your personal data:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="p-3.5 rounded-xl bg-[#080d1a] border border-white/5 space-y-1">
              <span className="font-bold text-white flex items-center gap-1.5 text-xs">
                <CheckCircle2 size={14} className="text-emerald-400" /> Right to Access & Portability
              </span>
              <p className="text-xs text-gray-400">
                You can download a complete, machine-readable JSON archive of all your data at any time from your Account Settings.
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-[#080d1a] border border-white/5 space-y-1">
              <span className="font-bold text-white flex items-center gap-1.5 text-xs">
                <CheckCircle2 size={14} className="text-rose-400" /> Right to Erasure (Forget Me)
              </span>
              <p className="text-xs text-gray-400">
                You can permanently delete your account and all associated portfolios, alerts, and records in one click via Account Settings.
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-white">5. Cookies & Session Storage</h2>
          <p>
            We use secure, <code>httpOnly</code>, <code>SameSite=Lax</code> cookies exclusively for maintaining your authenticated user session. We do not use third-party tracking cookies or advertising pixels.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-white">6. Grievance Officer & Contact</h2>
          <p>
            If you have questions, feedback, or grievance requests regarding data handling, please contact our designated privacy team at <span className="text-amber-400 font-mono">privacy@stockpulse.in</span>.
          </p>
        </section>
      </Card>
    </div>
  );
}
