// client/src/components/stocks/NewsTab.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import Skeleton from "../ui/Skeleton";
import EmptyState from "../ui/EmptyState";
import {
  Newspaper,
  ExternalLink,
  TrendingUp,
  TrendingDown,
  Clock,
  Sparkles,
} from "lucide-react";

export default function NewsTab({ symbol }) {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    setLoading(true);

    const fetchNews = async () => {
      try {
        const clean = symbol.replace(".NS", "").replace(".BO", "");
        const res = await axios.get(`/api/news/${clean}`);
        if (active) {
          setNews(res.data?.news || []);
        }
      } catch (err) {
        if (active) {
          console.error("Failed to load stock news:", err);
          setError("Could not load news coverage for this stock.");
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchNews();
    return () => {
      active = false;
    };
  }, [symbol]);

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-20 bg-white/5 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (error || news.length === 0) {
    return (
      <EmptyState
        title="No Recent News Coverage"
        description="No current news articles or exchange filings were discovered for this symbol."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
        <div className="flex items-center gap-2">
          <Newspaper size={16} className="text-amber-400" />
          <h3 className="text-sm font-bold text-white">Company News & Exchange Filings</h3>
        </div>
        <span className="text-xs text-gray-500 font-mono">{news.length} stories</span>
      </div>

      <div className="divide-y divide-white/5">
        {news.map((item, idx) => {
          const pubDate = item.publishedAt ? new Date(item.publishedAt) : null;
          const timeAgo = pubDate
            ? pubDate.toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })
            : "Recent";

          return (
            <a
              key={item.id || idx}
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="py-4 flex items-start justify-between gap-4 group hover:bg-white/[0.02] px-3 -mx-3 rounded-2xl transition-all block"
            >
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                    {item.publisher || "Financial News"}
                  </span>
                  <span className="text-gray-600 text-xs">·</span>
                  <div className="flex items-center gap-1 text-[11px] text-gray-500">
                    <Clock size={11} />
                    <span>{timeAgo}</span>
                  </div>

                  {item.sentiment && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                        item.sentiment === "positive"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : item.sentiment === "negative"
                          ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                          : "bg-white/5 text-gray-400 border border-white/10"
                      }`}
                    >
                      {item.sentiment}
                    </span>
                  )}
                </div>

                <h4 className="text-sm font-semibold text-gray-200 group-hover:text-amber-400 transition-colors leading-snug line-clamp-2">
                  {item.title}
                </h4>
              </div>

              <div className="text-gray-500 group-hover:text-amber-400 transition-colors shrink-0 mt-2">
                <ExternalLink size={16} />
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}
