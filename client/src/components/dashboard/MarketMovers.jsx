import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../ui/Card";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown } from "lucide-react";
import { getMarketMovers } from "../../services/marketService";

// FIX #6 — skeleton row component
function SkeletonRow() {
  return (
    <div className="flex items-center justify-between px-2 py-2.5 animate-pulse">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-full bg-white/10 shrink-0" />
        <div>
          <div className="h-3 w-16 bg-white/10 rounded mb-1.5" />
          <div className="h-2 w-8 bg-white/5 rounded" />
        </div>
      </div>
      <div className="text-right">
        <div className="h-3 w-16 bg-white/10 rounded mb-1.5 ml-auto" />
        <div className="h-2 w-12 bg-white/5 rounded ml-auto" />
      </div>
    </div>
  );
}

function MarketMovers() {
  const [active, setActive] = useState("Top Gainers");
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true); // FIX #6
  const navigate = useNavigate();

  useEffect(() => {
    fetchMovers();
    const interval = setInterval(fetchMovers, 15000);
    return () => clearInterval(interval);
  }, []);

  const fetchMovers = async () => {
    try {
      const data = await getMarketMovers();
      setStocks(data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false); // FIX #6
    }
  };

  const getFilteredStocks = () => {
    if (active === "Top Gainers")
      return [...stocks].sort((a, b) => b.change - a.change).slice(0, 5);
    if (active === "Top Losers")
      return [...stocks].sort((a, b) => a.change - b.change).slice(0, 5);
    // Most Active — sort by volume if available, else return as-is
    return [...stocks]
      .sort((a, b) => (b.volume || 0) - (a.volume || 0))
      .slice(0, 5);
  };

  // FIX #4 — only show Most Active tab if data has volume info
  const hasVolumeData = stocks.some((s) => s.volume && s.volume > 0);
  const visibleTabs = hasVolumeData
    ? ["Top Gainers", "Top Losers", "Most Active"]
    : ["Top Gainers", "Top Losers"];

  // Reset to Gainers if active tab gets hidden
  useEffect(() => {
    if (active === "Most Active" && !hasVolumeData) {
      setActive("Top Gainers");
    }
  }, [hasVolumeData]);

  return (
    <Card className="lg:col-span-3">

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-bold">Market Movers</h2>
          <p className="text-[11px] text-gray-500 mt-1">Live market movement</p>
        </div>
        <button
          onClick={() => document.getElementById("market-movers")
            ?.scrollIntoView({ behavior: "smooth" })}
          className="text-green-400 text-xs hover:text-green-300 transition-colors"
        >
          View All
        </button>
      </div>

      {/* FIX #4 — tabs only show what has data */}
      <div className="flex gap-1 mb-4 bg-white/5 rounded-xl p-1">
        {visibleTabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActive(tab)}
            className={`flex-1 text-[11px] py-1.5 rounded-lg font-medium transition-all
              ${active === tab
                ? "bg-green-500 text-black"
                : "text-gray-400 hover:text-white"}`}
          >
            {tab.replace("Top ", "")}
          </button>
        ))}
      </div>

      {/* FIX #6 — skeleton while loading, rows after */}
      <div className="space-y-1">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
        ) : (
          getFilteredStocks().map((stock, index) => (
            <motion.div
              key={index}
              whileHover={{ x: 2 }}
              onClick={() => navigate(`/stock/${stock.symbol}`)}
              className="flex items-center justify-between rounded-xl px-2 py-2.5
                         hover:bg-white/5 transition-all cursor-pointer"
            >
              {/* Left */}
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center
                                justify-center text-[9px] font-bold text-white shrink-0">
                  {stock.symbol?.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="text-[12px] font-semibold text-white">
                    {stock.symbol?.replace(".NS", "")}
                  </p>
                  <p className="text-[10px] text-gray-500">NSE</p>
                </div>
              </div>

              {/* Right */}
              <div className="text-right">
                <p className="text-[12px] font-bold text-white">
                  ₹{stock.price?.toFixed(2)}
                </p>
                <div className={`flex items-center justify-end gap-1 text-[11px] font-medium
                  ${stock.positive ? "text-green-400" : "text-red-400"}`}>
                  {stock.positive
                    ? <TrendingUp size={11} />
                    : <TrendingDown size={11} />}
                  {stock.change?.toFixed(2)}%
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

    </Card>
  );
}

export default MarketMovers;