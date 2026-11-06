// client/src/pages/EventsPage.jsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import AppLayout from "../components/layout/AppLayout";
import CompanyLogo from "../components/ui/CompanyLogo";
import Skeleton from "../components/ui/Skeleton";
import EmptyState from "../components/ui/EmptyState";
import SEO from "../components/common/SEO";
import Disclaimer from "../components/common/Disclaimer";
import useAuthStore from "../store/authStore";
import axios from "axios";
import {
  Calendar,
  DollarSign,
  Split,
  TrendingUp,
  Filter,
  CheckCircle2,
  Clock,
} from "lucide-react";

export default function EventsPage() {
  const { user } = useAuthStore();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState("all"); // "all" | "dividend" | "split" | "earnings"
  const [selectedScope, setSelectedScope] = useState("market"); // "market" | "watchlist" | "portfolio"

  useEffect(() => {
    let active = true;
    setLoading(true);

    const loadEvents = async () => {
      try {
        let url = `/api/events?type=${selectedType}`;
        if (selectedScope !== "market" && user) {
          url += `&scope=${selectedScope}`;
        }
        const res = await axios.get(url);
        if (active) {
          setEvents(res.data?.events || []);
        }
      } catch (err) {
        console.error("Failed to load market events:", err);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadEvents();
    return () => {
      active = false;
    };
  }, [selectedType, selectedScope, user]);

  return (
    <AppLayout>
      <SEO
        title="Corporate Actions & Events Calendar | StockPulse"
        description="Track NSE dividends, ex-dates, stock splits, bonus share issues, and quarterly earnings result dates across Indian equities."
        canonicalUrl="https://stockpulse.in/events"
      />

      <div className="max-w-7xl mx-auto space-y-6 pb-12">
        {/* ── Page Header ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Calendar size={18} />
              </span>
              <p className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                Market Calendar
              </p>
            </div>
            <h1 className="text-3xl font-extrabold text-white mt-1">Corporate Actions & Events</h1>
            <p className="text-xs text-gray-400 mt-1">
              Real-time schedule of ex-dividend dates, stock splits, bonus issuances, and board meetings.
            </p>
          </div>

          {/* Scope Filter (Market vs My Watchlist vs My Portfolio) */}
          {user && (
            <div className="flex items-center gap-1.5 p-1 bg-white/5 border border-white/10 rounded-2xl shrink-0 self-start md:self-auto">
              <button
                onClick={() => setSelectedScope("market")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  selectedScope === "market"
                    ? "bg-amber-500 text-black shadow-md shadow-amber-500/20"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                All NSE Equities
              </button>
              <button
                onClick={() => setSelectedScope("watchlist")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  selectedScope === "watchlist"
                    ? "bg-amber-500 text-black shadow-md shadow-amber-500/20"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                My Watchlist
              </button>
              <button
                onClick={() => setSelectedScope("portfolio")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  selectedScope === "portfolio"
                    ? "bg-amber-500 text-black shadow-md shadow-amber-500/20"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                My Portfolio
              </button>
            </div>
          )}
        </div>

        {/* ── Type Category Filter Pills ── */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setSelectedType("all")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              selectedType === "all"
                ? "bg-white text-black font-extrabold shadow-sm"
                : "bg-white/5 text-gray-400 hover:text-white border border-white/5"
            }`}
          >
            All Corporate Actions
          </button>
          <button
            onClick={() => setSelectedType("dividend")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              selectedType === "dividend"
                ? "bg-emerald-500 text-black font-extrabold shadow-sm"
                : "bg-white/5 text-gray-400 hover:text-white border border-white/5"
            }`}
          >
            <DollarSign size={13} />
            Dividends
          </button>
          <button
            onClick={() => setSelectedType("split")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              selectedType === "split"
                ? "bg-blue-500 text-white font-extrabold shadow-sm"
                : "bg-white/5 text-gray-400 hover:text-white border border-white/5"
            }`}
          >
            <Split size={13} />
            Splits & Bonuses
          </button>
          <button
            onClick={() => setSelectedType("earnings")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              selectedType === "earnings"
                ? "bg-purple-500 text-white font-extrabold shadow-sm"
                : "bg-white/5 text-gray-400 hover:text-white border border-white/5"
            }`}
          >
            <TrendingUp size={13} />
            Earnings & Results
          </button>
        </div>

        {/* ── Events Grid / Table ── */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-20 bg-white/5 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <EmptyState
            title="No Events Found"
            description="There are no scheduled corporate actions or earnings releases matching your active filters."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.map((ev, idx) => (
              <div
                key={idx}
                className="p-5 rounded-3xl bg-[#0e1626] border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between space-y-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <CompanyLogo symbol={ev.symbol} companyName={ev.companyName} size={40} />
                    <div>
                      <Link
                        to={`/stock/${ev.symbol}`}
                        className="text-base font-extrabold text-white hover:text-amber-400 transition-colors"
                      >
                        {ev.symbol}
                      </Link>
                      <p className="text-[11px] text-gray-400 line-clamp-1">{ev.companyName}</p>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                      ev.type === "dividend"
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : ev.type === "split"
                        ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                        : "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                    }`}
                  >
                    {ev.type}
                  </span>
                </div>

                <div>
                  <p className="text-xs font-bold text-gray-200">{ev.headline}</p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-white/5 text-xs text-gray-400">
                  <div className="flex items-center gap-1.5 font-mono">
                    <Clock size={13} className="text-gray-500" />
                    <span>{ev.date || ev.exDate}</span>
                  </div>

                  <span
                    className={`font-semibold text-[11px] ${
                      ev.status === "upcoming" ? "text-amber-400" : "text-gray-400"
                    }`}
                  >
                    {ev.status === "upcoming" ? "Upcoming" : "Completed"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        <Disclaimer variant="full" className="mt-8" />
      </div>
    </AppLayout>
  );
}
