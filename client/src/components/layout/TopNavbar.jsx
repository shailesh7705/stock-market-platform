import { Bell, LogOut, User, Settings, ChevronRight, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import StockSearch from "../search/StockSearch";
import { getMarketIndices } from "../../services/marketService";
import useAlertStore from "../../store/alertStore";
import useAuthStore from "../../store/authStore";

function cleanName(name = "") {
  return name.replace(/\.\s*[A-Z]$/, "").trim();
}

function getInitials(name = "") {
  return cleanName(name)
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

// Deterministic avatar gradient from name
const GRADIENTS = [
  ["from-emerald-500", "to-teal-600"],
  ["from-violet-500", "to-purple-600"],
  ["from-blue-500",   "to-cyan-600"],
  ["from-rose-500",   "to-pink-600"],
  ["from-amber-500",  "to-orange-600"],
];
function avatarGradient(name = "") {
  let hash = 0;
  for (let i = 0; i < name.length; i++)
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  const [from, to] = GRADIENTS[Math.abs(hash) % GRADIENTS.length];
  return `bg-gradient-to-br ${from} ${to}`;
}

function TopNavbar() {
  const [marketData, setMarketData] = useState([]);
  const [marketOpen, setMarketOpen] = useState(true);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showAlerts, setShowAlerts] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const { alerts } = useAlertStore();
  const { user } = useAuthStore();
  const profileRef = useRef(null);

  // Live clock
  useEffect(() => {
    const tick = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(tick);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target))
        setShowProfileMenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    fetchMarketData();
    const interval = setInterval(fetchMarketData, 15000);
    return () => clearInterval(interval);
  }, []);

  const fetchMarketData = async () => {
    try {
      const data = await getMarketIndices();
      setMarketData(data);
      const now = new Date();
      const cur = now.getHours() * 60 + now.getMinutes();
      setMarketOpen(cur >= 9 * 60 + 15 && cur <= 15 * 60 + 30);
    } catch (error) {
      console.log(error);
    }
  };

  const formattedTime = currentTime.toLocaleTimeString("en-IN", {
    hour: "2-digit", minute: "2-digit", hour12: true,
  });

  const displayName  = cleanName(user?.name || "");
  const initials     = getInitials(user?.name || "") || "U";
  const gradient     = avatarGradient(user?.name || "");
  const triggeredCnt = alerts?.filter((a) => a.triggered).length || 0;

  return (
    <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="sticky top-0 z-50 h-16 border-b border-white/5
                 bg-[#0d1523]/95 backdrop-blur-xl shrink-0"
    >
      <div className="h-full px-6 flex items-center justify-between gap-4">

        {/* ── LEFT ───────────────────────────────────────────────────── */}
        <div className="flex items-center gap-6 min-w-0 flex-1">
          <div className="w-72 shrink-0">
            <StockSearch />
          </div>

          <div className="hidden xl:flex items-center gap-5 min-w-0">
            {marketData.map((market, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="text-[11px] text-gray-500 uppercase tracking-wide">
                  {market.symbol === "^NSEI" ? "NIFTY 50" : "SENSEX"}
                </span>
                <span className="text-[13px] font-semibold text-white">
                  {market.price?.toLocaleString()}
                </span>
                <span className={`text-[12px] font-medium
                  ${market.positive ? "text-green-400" : "text-red-400"}`}>
                  {market.change?.toFixed(2)}%
                </span>
                {index !== marketData.length - 1 && (
                  <div className="w-px h-4 bg-white/10 ml-2" />
                )}
              </div>
            ))}

            <div className="flex items-center gap-3 ml-1">
              <div className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full animate-pulse
                  ${marketOpen ? "bg-green-400" : "bg-red-400"}`} />
                <span className={`text-[14px] font-medium
                  ${marketOpen ? "text-green-400" : "text-red-400"}`}>
                  {marketOpen ? "Market Open" : "Market Closed"}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[15px] text-gray-500
                              border-l border-white/10 pl-3">
                <Clock size={13} className="shrink-0" />
                <span className="font-mono">{formattedTime}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT ──────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 shrink-0">

          {/* Bell */}
          <div className="relative">
            <button
              onClick={() => { setShowAlerts(!showAlerts); setShowProfileMenu(false); }}
              className="relative w-9 h-9 rounded-xl bg-white/5 border border-white/10
                         flex items-center justify-center text-gray-300
                         hover:text-white hover:bg-white/10 transition-all"
            >
              <Bell size={17} />
              {alerts?.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-4.5 h-4.5 px-1
                                  rounded-full bg-red-500 flex items-center justify-center
                                  text-[9px] font-bold text-white border-2 border-[#0d1523]">
                  {alerts.length > 99 ? "99+" : alerts.length}
                </span>
              )}
            </button>

            {showAlerts && (
              <div className="absolute right-0 top-12 w-80 bg-[#111827]
                              border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-50">
                <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-white">Alerts</h3>
                  <span className="text-xs text-gray-400">{alerts?.length || 0} Active</span>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {alerts?.length === 0 ? (
                    <div className="p-5 text-sm text-gray-400">No active alerts</div>
                  ) : (
                    alerts.map((alert) => (
                      <div key={alert._id}
                        className="px-4 py-3 border-b border-white/5 hover:bg-white/5 transition-all">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-white">{alert.symbol}</p>
                            <p className="text-xs text-gray-400 mt-0.5">Target ₹{alert.targetPrice}</p>
                          </div>
                          <span className={`text-[10px] px-2 py-1 rounded-full
                            ${alert.triggered
                              ? "bg-green-500/10 text-green-400"
                              : "bg-yellow-500/10 text-yellow-400"}`}>
                            {alert.triggered ? "Triggered" : "Active"}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <button
                  onClick={() => {
                    setShowAlerts(false);
                    document.getElementById("alerts")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="w-full py-3 text-sm font-medium text-green-400
                             hover:bg-green-500/10 transition-all"
                >
                  View All Alerts
                </button>
              </div>
            )}
          </div>

          {/* ── Profile ──────────────────────────────────────────────── */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => { setShowProfileMenu(!showProfileMenu); setShowAlerts(false); }}
              className={`w-9 h-9 rounded-full ${gradient} flex items-center justify-center
                         text-[12px] font-bold text-white shadow-lg transition-all
                         hover:scale-105 hover:shadow-emerald-500/30
                         ring-2 ring-transparent hover:ring-white/20
                         ${showProfileMenu ? "ring-white/20 scale-105" : ""}`}
            >
              {initials}
            </button>

            {/* ── Premium Profile Dropdown ─────────────────────────── */}
            <AnimatePresence>
              {showProfileMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-12 w-64
                             bg-[#0f1923] border border-white/10
                             rounded-2xl shadow-2xl shadow-black/40 z-50
                             overflow-hidden"
                >
                  {/* Profile header */}
                  <div className="px-4 pt-4 pb-3 border-b border-white/6">
                    <div className="flex items-center gap-3">
                      {/* Large avatar */}
                      <div className={`w-11 h-11 rounded-xl ${gradient} flex items-center
                                       justify-center text-[15px] font-bold text-white
                                       shadow-lg shrink-0`}>
                        {initials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-semibold text-white truncate leading-none mb-1">
                          {displayName}
                        </p>
                        <p className="text-[11px] text-gray-500 truncate leading-none">
                          {user?.email}
                        </p>
                      </div>
                    </div>

                    {/* Plan badge */}
                    <div className="mt-3 flex items-center justify-between
                                    bg-white/4 rounded-xl px-3 py-2 border border-white/[0.06]">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-500" />
                        <span className="text-[11px] text-gray-400 font-medium">Free Plan</span>
                      </div>
                      <button className="text-[10px] font-bold text-emerald-400
                                         hover:text-emerald-300 transition-colors">
                        Upgrade →
                      </button>
                    </div>
                  </div>

                  {/* Quick stats */}
                  <div className="grid grid-cols-2 gap-px bg-white/[0.04] border-b border-white/[0.06]">
                    <div className="bg-[#0f1923] px-4 py-2.5 text-center">
                      <p className="text-[11px] text-gray-500 mb-0.5">Alerts</p>
                      <p className="text-[14px] font-bold text-white">{alerts?.length || 0}</p>
                    </div>
                    <div className="bg-[#0f1923] px-4 py-2.5 text-center">
                      <p className="text-[11px] text-gray-500 mb-0.5">Triggered</p>
                      <p className={`text-[14px] font-bold
                        ${triggeredCnt > 0 ? "text-green-400" : "text-white"}`}>
                        {triggeredCnt}
                      </p>
                    </div>
                  </div>

                  {/* Menu items */}
                  <div className="p-2">
                    <button
                      onClick={() => setShowProfileMenu(false)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                                 text-[13px] text-gray-400 hover:text-white
                                 hover:bg-white/[0.05] transition-all group"
                    >
                      <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center
                                       justify-center group-hover:bg-white/10 transition-all">
                        <User size={13} />
                      </div>
                      <span className="flex-1 text-left">Profile</span>
                      <ChevronRight size={13} className="text-gray-600" />
                    </button>

                    <button
                      onClick={() => setShowProfileMenu(false)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                                 text-[13px] text-gray-400 hover:text-white
                                 hover:bg-white/[0.05] transition-all group"
                    >
                      <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center
                                       justify-center group-hover:bg-white/10 transition-all">
                        <Settings size={13} />
                      </div>
                      <span className="flex-1 text-left">Settings</span>
                      <ChevronRight size={13} className="text-gray-600" />
                    </button>
                  </div>

                  {/* Logout */}
                  <div className="p-2 pt-0 border-t border-white/[0.06]">
                    <button
                      onClick={() => { localStorage.clear(); window.location.href = "/"; }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                                 text-[13px] text-red-400 hover:text-red-300
                                 hover:bg-red-500/[0.08] transition-all group mt-1"
                    >
                      <div className="w-7 h-7 rounded-lg bg-red-500/10 flex items-center
                                       justify-center group-hover:bg-red-500/20 transition-all">
                        <LogOut size={13} className="text-red-400" />
                      </div>
                      <span>Logout</span>
                    </button>
                  </div>

                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </div>
    </motion.div>
  );
}

export default TopNavbar;