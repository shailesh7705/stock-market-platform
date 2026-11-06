// client/src/components/stocks/EventsTab.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import Card from "../ui/Card";
import Skeleton from "../ui/Skeleton";
import EmptyState from "../ui/EmptyState";
import {
  Calendar,
  DollarSign,
  Split,
  Award,
  Clock,
  CheckCircle,
  AlertCircle,
  ExternalLink,
} from "lucide-react";

export default function EventsTab({ symbol }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeSubTab, setActiveSubTab] = useState("dividends"); // "dividends" | "splits"

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    const fetchEvents = async () => {
      try {
        const clean = symbol.replace(".NS", "").replace(".BO", "");
        const res = await axios.get(`/api/stocks/${clean}/events`);
        if (active) {
          setData(res.data);
        }
      } catch (err) {
        if (active) {
          console.error("Failed to load events:", err);
          setError("Could not load corporate actions.");
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchEvents();
    return () => {
      active = false;
    };
  }, [symbol]);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-20 bg-white/5 rounded-2xl" />
        <div className="h-64 bg-white/5 rounded-3xl" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <EmptyState
        title="Corporate Actions Unavailable"
        description="No historical corporate actions or upcoming events are recorded for this symbol."
      />
    );
  }

  const { dividends = [], splits = [], upcoming = [] } = data;

  return (
    <div className="space-y-6">
      {/* ── Upcoming Events Notification ── */}
      {upcoming.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {upcoming.map((ev, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl bg-gradient-to-r from-blue-950/40 to-[#0c1424] border border-blue-500/20 flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                  <Calendar size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">{ev.title}</h4>
                  <p className="text-[11px] text-gray-400 mt-0.5">{ev.description}</p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="text-xs font-bold text-blue-400 font-mono block">
                  {ev.formattedDate || ev.date}
                </span>
                <span className="text-[10px] text-gray-500 uppercase font-semibold">Scheduled</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Tab Switcher ── */}
      <div className="flex items-center gap-2 border-b border-white/[0.08] pb-3">
        <button
          onClick={() => setActiveSubTab("dividends")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeSubTab === "dividends"
              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
              : "text-gray-400 hover:text-white bg-white/5 border border-transparent"
          }`}
        >
          <DollarSign size={14} />
          Dividend History ({dividends.length})
        </button>

        <button
          onClick={() => setActiveSubTab("splits")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeSubTab === "splits"
              ? "bg-blue-500/15 text-blue-400 border border-blue-500/30"
              : "text-gray-400 hover:text-white bg-white/5 border border-transparent"
          }`}
        >
          <Split size={14} />
          Splits & Bonus Issues ({splits.length})
        </button>
      </div>

      {/* ── Content View ── */}
      {activeSubTab === "dividends" ? (
        dividends.length === 0 ? (
          <EmptyState
            title="No Dividend History"
            description="This company has not issued cash dividends in the recorded period."
          />
        ) : (
          <div className="overflow-x-auto rounded-3xl border border-white/10 bg-[#0e1626] shadow-xl">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/[0.08] bg-white/[0.02] text-[11px] uppercase tracking-wider text-gray-400">
                  <th className="py-3.5 px-4 font-bold">Ex-Date</th>
                  <th className="py-3.5 px-4 font-bold">Dividend Type</th>
                  <th className="py-3.5 px-4 font-bold text-right">Dividend Per Share</th>
                  <th className="py-3.5 px-4 font-bold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono text-gray-300">
                {dividends.map((div, idx) => (
                  <tr key={idx} className="hover:bg-white/[0.02]">
                    <td className="py-3 px-4 font-sans font-bold text-white">
                      {div.formattedDate || div.date}
                    </td>
                    <td className="py-3 px-4 font-sans text-gray-300">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {div.type || "Dividend"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-black text-emerald-400 text-sm">
                      ₹{Number(div.amount).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right font-sans text-gray-400 text-[11px]">
                      Completed
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : splits.length === 0 ? (
        <EmptyState
          title="No Splits or Bonus Issues"
          description="No stock splits, consolidations or bonus share corporate actions recorded."
        />
      ) : (
        <div className="overflow-x-auto rounded-3xl border border-white/10 bg-[#0e1626] shadow-xl">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/[0.08] bg-white/[0.02] text-[11px] uppercase tracking-wider text-gray-400">
                <th className="py-3.5 px-4 font-bold">Ex-Date</th>
                <th className="py-3.5 px-4 font-bold">Corporate Action</th>
                <th className="py-3.5 px-4 font-bold text-right">Ratio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono text-gray-300">
              {splits.map((sp, idx) => (
                <tr key={idx} className="hover:bg-white/[0.02]">
                  <td className="py-3 px-4 font-sans font-bold text-white">
                    {sp.formattedDate || sp.date}
                  </td>
                  <td className="py-3 px-4 font-sans">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      {sp.type}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-amber-300">
                    {sp.ratio}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
