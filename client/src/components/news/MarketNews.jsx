// client/src/components/news/MarketNews.jsx
import { useEffect, useState } from "react";
import { Newspaper, ExternalLink, Clock } from "lucide-react";
import { motion } from "framer-motion";
import Card from "../ui/Card";
import { getMarketNews } from "../../services/newsService";

function formatNewsTime(publishedAt) {
  if (!publishedAt) return "";
  const diff = Math.floor((Date.now() - new Date(publishedAt)) / 60000);
  if (diff < 60) return `${diff}m ago`;
  const h = Math.floor(diff / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function MarketNews() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    try {
      const data = await getMarketNews();
      if (Array.isArray(data)) setNews(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card id="news" className="lg:col-span-12">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
          <Newspaper size={18} />
        </div>
        <div>
          <h2 className="text-base font-bold text-white">Market Intelligence & News</h2>
          <p className="text-[11px] text-gray-500 mt-0.5">Live curated Indian business updates</p>
        </div>
      </div>

      {/* News Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          [0, 1, 2].map((i) => (
            <div key={i} className="h-32 rounded-2xl bg-white/5 animate-pulse" />
          ))
        ) : (
          news.slice(0, 6).map((article, idx) => (
            <motion.a
              key={idx}
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ y: -3 }}
              className="flex flex-col justify-between p-4 rounded-2xl bg-[#080d1a]/50 hover:bg-[#080d1a] border border-white/[0.04] hover:border-white/15 transition-all group"
            >
              <div>
                <div className="flex items-center justify-between text-[11px] text-emerald-400 font-bold mb-2">
                  <span>{article.source}</span>
                  <div className="flex items-center gap-1 text-gray-500 font-normal">
                    <Clock size={11} />
                    <span>{formatNewsTime(article.publishedAt)}</span>
                  </div>
                </div>

                <h3 className="text-[13px] font-bold text-white group-hover:text-emerald-400 transition-colors line-clamp-2 leading-snug">
                  {article.title}
                </h3>

                <p className="text-[11px] text-gray-400 line-clamp-2 mt-1.5 leading-relaxed">
                  {article.description}
                </p>
              </div>

              <div className="pt-3 mt-3 border-t border-white/[0.04] flex items-center justify-between text-[11px] text-gray-500 group-hover:text-gray-300">
                <span>Read Full Coverage</span>
                <ExternalLink size={12} className="text-emerald-400" />
              </div>
            </motion.a>
          ))
        )}
      </div>
    </Card>
  );
}

export default MarketNews;
