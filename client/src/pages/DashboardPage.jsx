import { useState, useEffect } from "react";
import { ArrowUp } from "lucide-react";
import AppLayout from "../components/layout/AppLayout";
import DashboardGrid from "../components/dashboard/DashboardGrid";
import PortfolioOverview from "../components/dashboard/PortfolioOverview";
import WatchlistWidget from "../components/watchlist/WatchlistWidget";
import AnalyticsChart from "../components/charts/AnalyticsChart";
import MarketMovers from "../components/dashboard/MarketMovers";
import AlertsPanel from "../components/alerts/AlertsPanel";
import MarketNews from "../components/news/MarketNews";
import useAuthStore from "../store/authStore";

// FIX #1 — strip trailing ".X" initial suffix
function cleanName(name = "") {
  return name.replace(/\.\s*[A-Z]$/, "").trim();
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
}

// FIX #3 — formatted date string
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

  // FIX #8 — scroll to top button visibility
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const container = document.getElementById("dashboard-container");
    if (!container) return;
    const handleScroll = () => setShowScrollTop(container.scrollTop > 400);
    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    document.getElementById("dashboard-container")?.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <AppLayout>

      {/* FIX #1 — tighter greeting, FIX #3 — date below name */}
      <div id="top" className="mb-6 mt-1">
        <h1 className="text-[20px] font-bold tracking-tight leading-snug">
          {getGreeting()},{" "}
          <span className="text-white">{displayName}</span>
          {" "}👋
        </h1>
        {/* FIX #3 — date + market context subtext */}
        <p className="text-[12px] text-gray-500 mt-1">
          {getDateString()} &nbsp;·&nbsp; Here's what's happening in the market today.
        </p>
      </div>

      <DashboardGrid>
        <div id="portfolio" className="contents">
          <PortfolioOverview />
        </div>
        <div id="analytics" className="contents">
          <AnalyticsChart />
        </div>
        <div id="market-movers" className="contents">
          <MarketMovers />
        </div>
        <div id="watchlist" className="contents">
          <WatchlistWidget />
        </div>
        <div id="alerts" className="contents">
          <AlertsPanel />
        </div>
        <div id="news" className="contents">
          <MarketNews />
        </div>
      </DashboardGrid>

      {/* FIX #8 — scroll to top button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-50
                     w-10 h-10 rounded-full
                     bg-green-500 hover:bg-green-400
                     text-white shadow-lg shadow-green-500/30
                     flex items-center justify-center
                     transition-all hover:scale-110"
          title="Back to top"
        >
          <ArrowUp size={18} />
        </button>
      )}

    </AppLayout>
  );
}

export default DashboardPage;