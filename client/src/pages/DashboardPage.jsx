// client/src/pages/DashboardPage.jsx
import { useState, useEffect } from "react";
import { ArrowUp, Bell, Sparkles } from "lucide-react";
import AppLayout from "../components/layout/AppLayout";
import DashboardGrid from "../components/dashboard/DashboardGrid";
import PortfolioOverview from "../components/dashboard/PortfolioOverview";
import WatchlistWidget from "../components/watchlist/WatchlistWidget";
import MarketMovers from "../components/dashboard/MarketMovers";
import AlertsPanel from "../components/alerts/AlertsPanel";
import MarketNews from "../components/news/MarketNews";
import useAuthStore from "../store/authStore";

function cleanName(name = "") {
  return name.replace(/\.\s*[A-Z]$/, "").trim();
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
}

function getDateString() {
  return new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function DashboardPage() {
  const { user } = useAuthStore();
  const displayName = cleanName(user?.name || "Investor");
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const container = document.getElementById("dashboard-container");
    if (!container) return;
    const handleScroll = () => setShowScrollTop(container.scrollTop > 350);
    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    document.getElementById("dashboard-container")?.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-6 pb-12">
        {/* Welcome Header */}
        <div id="top" className="flex flex-col md:flex-row md:items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              {getGreeting()}, <span className="text-emerald-400">{displayName}</span> 👋
            </h1>
            <p className="text-xs text-gray-400 mt-1">
              {getDateString()} &nbsp;·&nbsp; Realtime NSE market intelligence and active price alerts.
            </p>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-gray-400 bg-[#0e1626] border border-white/[0.08] px-3.5 py-1.5 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>NSE Alert Monitoring Online</span>
          </div>
        </div>

        {/* Dashboard Grid */}
        <DashboardGrid>
          {/* 4 Overview Metrics */}
          <PortfolioOverview />

          {/* Market Movers */}
          <MarketMovers />

          {/* Active Alerts Panel */}
          <AlertsPanel />

          {/* Watchlist Widget */}
          <WatchlistWidget />

          {/* Market Intelligence News */}
          <MarketNews />
        </DashboardGrid>

        {/* Scroll to Top Floating Button */}
        {showScrollTop && (
          <button
            onClick={scrollToTop}
            className="fixed bottom-6 right-6 z-50 w-11 h-11 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black shadow-xl shadow-emerald-500/25 flex items-center justify-center transition-all hover:scale-105"
            title="Back to top"
          >
            <ArrowUp size={18} />
          </button>
        )}
      </div>
    </AppLayout>
  );
}

export default DashboardPage;
