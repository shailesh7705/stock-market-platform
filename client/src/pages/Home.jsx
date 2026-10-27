// client/src/pages/Home.jsx
import { useState } from "react";
import {
  TrendingUp,
  X,
  ArrowRight,
  Zap,
  Bell,
  CheckCircle2,
  ShieldCheck,
  Clock,
  Sparkles,
  BarChart3,
  Mail,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Login from "./Login";
import Signup from "./Signup";

function Home() {
  const [openModal, setOpenModal] = useState(false);
  const [modalType, setModalType] = useState("login");
  const navigate = useNavigate();

  const openLogin = () => {
    setModalType("login");
    setOpenModal(true);
  };
  const openSignup = () => {
    setModalType("signup");
    setOpenModal(true);
  };

  const token = localStorage.getItem("token");

  return (
    <div className="min-h-screen bg-[#080d1a] text-white overflow-hidden flex flex-col justify-between">
      {/* ── Top Navbar ─────────────────────────────────────────────────── */}
      <nav className="w-full h-20 border-b border-white/[0.08] bg-[#0b1120]/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto h-full px-6 lg:px-10 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-black shadow-lg shadow-emerald-500/25 group-hover:scale-105 transition-transform">
              <Zap size={20} className="fill-current" />
            </div>
            <div>
              <span className="text-xl font-extrabold text-white tracking-tight leading-none block">
                StockPulse
              </span>
              <span className="text-[10px] font-semibold text-emerald-400 tracking-wider uppercase block mt-0.5">
                NSE Alert Platform
              </span>
            </div>
          </Link>

          {/* Quick Features Link */}
          <div className="hidden md:flex items-center gap-8 text-xs font-semibold text-gray-400">
            <a href="#features" className="hover:text-emerald-400 transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="hover:text-emerald-400 transition-colors">
              How Alerts Work
            </a>
            <a href="#coverage" className="hover:text-emerald-400 transition-colors">
              NSE Coverage
            </a>
          </div>

          {/* Auth CTA */}
          <div className="flex items-center gap-3">
            {token ? (
              <Link
                to="/dashboard"
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-extrabold transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-1.5"
              >
                Go to Dashboard <ArrowRight size={14} />
              </Link>
            ) : (
              <>
                <button
                  onClick={openLogin}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-300 hover:text-white hover:bg-white/5 transition-all"
                >
                  Sign In
                </button>
                <button
                  onClick={openSignup}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-extrabold transition-all shadow-lg shadow-emerald-500/20"
                >
                  Get Started Free
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── Hero Section ───────────────────────────────────────────────── */}
      <section className="relative px-6 pt-20 pb-16 flex flex-col items-center text-center">
        {/* Background glow orbs */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 left-1/3 w-72 h-72 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />

        {/* Live badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold mb-8">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Real-time NSE Stock Price Alerts & Market Intelligence</span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight max-w-4xl leading-[1.1] mb-6">
          Never Miss a Target.{" "}
          <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-blue-400 bg-clip-text text-transparent">
            Automated Stock Alerts
          </span>{" "}
          Direct to Your Inbox.
        </h1>

        {/* Subhead */}
        <p className="text-base sm:text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed mb-10">
          Set target prices for any of 2,300+ NSE equities. Our engine monitors prices every
          60 seconds and dispatches rich HTML notifications the instant your condition is hit.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-16">
          <button
            onClick={token ? () => navigate("/dashboard") : openSignup}
            className="h-13 px-8 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black text-sm font-extrabold transition-all shadow-xl shadow-emerald-500/25 flex items-center gap-2 group"
          >
            Start Free Tracking
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            onClick={openLogin}
            className="h-13 px-7 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-white text-sm font-bold transition-all flex items-center gap-2"
          >
            <Zap size={16} className="text-amber-400" />
            Live Preview
          </button>
        </div>

        {/* Live Ticker Bar */}
        <div className="w-full max-w-5xl bg-[#0e1626]/80 border border-white/[0.08] rounded-2xl p-4 backdrop-blur-xl">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-left">
            {[
              { sym: "NIFTY 50", price: "₹22,696.80", change: "-0.25%", isPos: false },
              { sym: "SENSEX", price: "₹73,393.20", change: "-0.29%", isPos: false },
              { sym: "RELIANCE", price: "₹1,192.90", change: "+1.40%", isPos: true },
              { sym: "TCS", price: "₹2,496.50", change: "+0.85%", isPos: true },
            ].map((idx) => (
              <div key={idx.sym} className="p-3 bg-[#080d1a] border border-white/[0.05] rounded-xl">
                <span className="text-[10px] text-gray-400 font-bold uppercase">{idx.sym}</span>
                <p className="text-[15px] font-extrabold text-white mt-0.5 font-mono tabular-nums">{idx.price}</p>
                <span
                  className={`text-[11px] font-bold font-mono tabular-nums ${
                    idx.isPos ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  {idx.change}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works Section ────────────────────────────────────────── */}
      <section id="how-it-works" className="px-6 py-20 border-t border-white/[0.08] bg-[#070b16]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              Reliable 3-Step Setup
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-4 tracking-tight">
              How StockPulse Price Alerts Work
            </h2>
            <p className="text-xs sm:text-sm text-gray-400 mt-2 max-w-xl mx-auto">
              Engineered with 60-second background cron cycles and automated email delivery.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-[#0e1626] border border-white/[0.08] rounded-3xl relative">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 font-extrabold text-lg flex items-center justify-center mb-5">
                01
              </div>
              <h3 className="text-base font-bold text-white mb-2">Search & Pick Stock</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Choose from over 2,360+ Indian NSE equities with instant autocomplete search and live quotes.
              </p>
            </div>

            <div className="p-6 bg-[#0e1626] border border-white/[0.08] rounded-3xl relative">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 font-extrabold text-lg flex items-center justify-center mb-5">
                02
              </div>
              <h3 className="text-base font-bold text-white mb-2">Configure Price Target</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Specify your breakout or dip-buy price, or use our 1-click +5% / +10% target selectors.
              </p>
            </div>

            <div className="p-6 bg-[#0e1626] border border-white/[0.08] rounded-3xl relative">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-extrabold text-lg flex items-center justify-center mb-5">
                03
              </div>
              <h3 className="text-base font-bold text-white mb-2">Instant Email Notification</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                As soon as NSE market quotes cross your threshold, an alert email is delivered straight to your inbox.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer className="w-full border-t border-white/[0.08] bg-[#070b16] py-10 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-500 flex items-center justify-center text-black font-extrabold text-xs">
              ⚡
            </div>
            <span className="font-bold text-white">StockPulse</span> · NSE Realtime Price Alerts
          </div>
          <p>© {new Date().getFullYear()} StockPulse. Designed for Indian stock investors.</p>
        </div>
      </footer>

      {/* ── Auth Modal ─────────────────────────────────────────────────── */}
      {openModal && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpenModal(false);
          }}
        >
          <div className="relative w-full max-w-md bg-[#0e1626] border border-white/10 rounded-3xl shadow-2xl shadow-black/80 overflow-hidden p-8 my-auto">
            {/* Close Button */}
            <button
              onClick={() => setOpenModal(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-white w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center transition-colors"
            >
              <X size={16} />
            </button>

            {/* Modal Header */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-black font-extrabold text-sm">
                  <Zap size={16} className="fill-current" />
                </div>
                <span className="text-base font-extrabold text-white">StockPulse</span>
              </div>
              <h2 className="text-xl font-bold text-white">
                {modalType === "login" ? "Sign In to Your Account" : "Create Free Account"}
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                {modalType === "login"
                  ? "Access your dashboard and live price alerts"
                  : "Track NSE stocks with automated email notifications"}
              </p>
            </div>

            {/* Render Login or Signup */}
            {modalType === "login" ? (
              <Login isModal onSwitchToSignup={() => setModalType("signup")} />
            ) : (
              <Signup isModal onSwitchToLogin={() => setModalType("login")} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;
