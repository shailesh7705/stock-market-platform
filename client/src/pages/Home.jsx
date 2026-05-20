import { useState } from "react";
import { TrendingUp, X, ArrowRight, Zap } from "lucide-react";
import Login from "./Login";
import Signup from "./Signup";

function Home() {
  const [openModal, setOpenModal] = useState(false);
  const [modalType, setModalType] = useState("login");

  const openLogin = () => { setModalType("login"); setOpenModal(true); };
  const openSignup = () => { setModalType("signup"); setOpenModal(true); };

  return (
    <div className="min-h-screen bg-[#f5f7fb] overflow-hidden">

      {/* ── Navbar ──────────────────────────────────────────────────────── */}
      <nav className="w-full h-20 bg-black border-b border-white/10 flex items-center">
        <div className="max-w-7xl mx-auto w-full px-6 lg:px-10 flex items-center justify-between">

          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-500 flex items-center justify-center shadow-lg shadow-green-500/30">
              <TrendingUp size={20} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              StockPulse
            </h1>
          </div>

          {/* Nav Links */}
          <div className="hidden lg:flex items-center gap-8 text-white/80 font-medium text-sm">
            {["Markets", "Watchlist", "Alerts", "News", "Analytics"].map(item => (
              <button
                key={item}
                onClick={openLogin}
                className="hover:text-green-400 transition-colors"
              >
                {item}
              </button>
            ))}
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={openLogin}
              className="px-5 py-2.5 rounded-xl border border-white/20 text-white text-sm
                         hover:border-green-500 hover:text-green-400 transition-all font-medium"
            >
              Login
            </button>
            <button
              onClick={openSignup}
              className="px-5 py-2.5 rounded-xl bg-green-500 hover:bg-green-600 text-white
                         text-sm font-semibold transition-all shadow-lg shadow-green-500/25"
            >
              Sign Up
            </button>
          </div>

        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section className="w-full flex flex-col items-center text-center px-6 pt-24 pb-16">

        {/* Live badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full
                        bg-green-100 border border-green-200 mb-8">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-green-700 text-sm font-semibold">
            Live NSE Market Intelligence
          </span>
        </div>

        {/* Main heading — all one color scheme, no split */}
        <h1 className="text-5xl lg:text-7xl font-extrabold leading-tight tracking-tight
                       text-[#111827] max-w-4xl mx-auto">
          
          <span className="text-green-500">Smart Stock Monitoring For{" "} Modern Investors</span>
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-lg lg:text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
          Track NSE stocks, receive realtime alerts, monitor market movers,
          and analyze trends with a premium fintech dashboard.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-wrap justify-center gap-4 mt-10">
          <button
            onClick={openSignup}
            className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-green-500
                       hover:bg-green-600 text-white text-base font-semibold transition-all
                       shadow-xl shadow-green-500/25"
          >
            Open Dashboard
            <ArrowRight size={18} />
          </button>

          <button
            onClick={openLogin}
            className="flex items-center gap-2 px-8 py-4 rounded-2xl
                       border-2 border-gray-300 bg-white hover:border-green-500
                       hover:text-green-600 text-gray-700 text-base font-semibold
                       transition-all shadow-sm"
          >
            <Zap size={16} className="text-green-500" />
            Live Preview
          </button>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap justify-center gap-16 mt-20">
          {[
            { value: "2000+",     label: "NSE Stocks" },
            { value: "Live",     label: "Market Tracking" },
            { value: "Realtime", label: "Alerts" },
          ].map(({ value, label }) => (
            <div key={label} className="flex flex-col items-center gap-1">
              <span className="text-4xl lg:text-5xl font-extrabold text-[#111827]">
                {value}
              </span>
              <span className="text-gray-500 text-sm font-medium mt-1">{label}</span>
            </div>
          ))}
        </div>

        {/* Feature cards row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-16 w-full max-w-3xl mx-auto">
          {[
            { icon: "📈", title: "Live Price Tracking",   desc: "Real-time NSE stock prices with auto-refresh" },
            { icon: "🔔", title: "Smart Alerts",          desc: "Trigger alerts on price targets instantly" },
            { icon: "📊", title: "Market Movers",         desc: "Top gainers & losers updated every 30s" },
          ].map(({ icon, title, desc }) => (
            <div
              key={title}
              className="bg-white rounded-2xl border border-gray-200 p-5 text-left
                         hover:border-green-400 hover:shadow-md transition-all cursor-pointer"
              onClick={openSignup}
            >
              <div className="text-2xl mb-3">{icon}</div>
              <h3 className="text-sm font-bold text-gray-800 mb-1">{title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

      </section>

      {/* ── Auth Modal ──────────────────────────────────────────────────── */}
      {openModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm
                     flex items-center justify-center px-4"
          onClick={(e) => { if (e.target === e.currentTarget) setOpenModal(false); }}
        >
          <div className="relative w-full max-w-md rounded-3xl border border-white/10
                          shadow-2xl overflow-hidden">

            {/* Close button */}
            <button
              onClick={() => setOpenModal(false)}
              className="absolute top-4 right-4 z-50 text-gray-400 hover:text-white
                         w-8 h-8 rounded-full bg-white/5 flex items-center justify-center
                         transition-colors"
            >
              <X size={16} />
            </button>

            <div className="bg-[#0f172a] p-8">

              {/* Modal heading */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded-lg bg-green-500 flex items-center justify-center">
                    <TrendingUp size={12} className="text-white" />
                  </div>
                  <span className="text-white font-bold text-sm">StockPulse</span>
                </div>
                <h2 className="text-white text-xl font-bold mt-3">
                  {modalType === "login" ? "Welcome back" : "Create your account"}
                </h2>
                <p className="text-gray-500 text-sm mt-1">
                  {modalType === "login"
                    ? "Sign in to access your dashboard"
                    : "Start tracking markets for free"}
                </p>
              </div>

              {/* Tabs */}
              <div className="flex gap-2 mb-6 p-1 bg-white/5 rounded-xl">
                <button
                  onClick={() => setModalType("login")}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all
                    ${modalType === "login"
                      ? "bg-green-500 text-white shadow-md"
                      : "text-gray-400 hover:text-white"}`}
                >
                  Login
                </button>
                <button
                  onClick={() => setModalType("signup")}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all
                    ${modalType === "signup"
                      ? "bg-green-500 text-white shadow-md"
                      : "text-gray-400 hover:text-white"}`}
                >
                  Create Account
                </button>
              </div>

              {/* Form */}
              {modalType === "login" ? <Login /> : <Signup />}

            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default Home;