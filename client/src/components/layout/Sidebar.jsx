import {
  LayoutDashboard, Bell, TrendingUp, Bookmark,
  Newspaper, BriefcaseBusiness, Search,
  LogOut, Zap, Crown, Moon, Sun,
} from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const menuItems = [
  { title: "Dashboard",     id: "top",           icon: <LayoutDashboard size={18} /> },
  { title: "Watchlist",     id: "watchlist",     icon: <Bookmark size={18} /> },
  { title: "Alerts",        id: "alerts",        icon: <Bell size={18} /> },
  { title: "Portfolio",     id: "analytics",     icon: <BriefcaseBusiness size={18} />, soon: true },
  { title: "Search",        id: "top",           icon: <Search size={18} /> },
  { title: "Market Movers", id: "market-movers", icon: <TrendingUp size={18} /> },
  { title: "News",          id: "news",          icon: <Newspaper size={18} />, soon: true },
];

function Sidebar() {
  const [active, setActive] = useState("Dashboard");
  const [isDark, setIsDark] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (isDark) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, [isDark]);

  const scrollToSection = (id) => {
    const container = document.getElementById("dashboard-container");
    const element = document.getElementById(id);
    if (!container || !element) return;
    container.scrollTo({ top: element.offsetTop - 20, behavior: "smooth" });
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/";
    
  };

  return (
    <motion.div
      initial={{ x: -40, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="hidden lg:flex w-64 shrink-0 h-screen sticky top-0
                 bg-[#0d1523] border-r border-white/5 flex-col px-3 py-5 overflow-y-auto"
    >
      {/* Logo */}
      <div className="flex items-center gap-2 mb-8 pl-1">
        <div className="bg-green-500 rounded-lg p-1.5 shrink-0">
          <Zap size={15} className="text-black" />
        </div>
        <h1 className="text-[17px] font-bold tracking-tight text-white whitespace-nowrap">
          StockPulse
        </h1>
      </div>

      {/* Navigation */}
      <div className="flex-1 space-y-0.5">
        {menuItems.map((item) => {
          const isActive = active === item.title;
          return (
            <motion.div
              key={item.title}
              onClick={() => { setActive(item.title); scrollToSection(item.id); }}
              whileHover={{ x: isActive ? 0 : 3 }}
              transition={{ duration: 0.15 }}
              className={`flex items-center gap-3 px-3 py-3 rounded-xl text-[14px]
                          cursor-pointer transition-all relative
                          ${isActive
                            ? "bg-green-500/10 text-green-400 font-medium"
                            : "text-gray-400 hover:bg-white/5 hover:text-gray-200"}`}
            >
              {/* FIX #9 — left border bar as active indicator (more visible than dot) */}
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2
                                w-1 h-6 rounded-r-full bg-green-400" />
              )}

              <span className={`shrink-0 ${isActive ? "text-green-400" : "text-gray-500"}`}>
                {item.icon}
              </span>

              <span className="whitespace-nowrap flex-1">{item.title}</span>

              {/* Soon badge */}
              {item.soon && !isActive && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md
                                 bg-white/5 text-zinc-500 border border-white/[0.07]">
                  SOON
                </span>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* FIX #6 — Green premium banner */}
      <div className="mx-1 mb-4 mt-4 p-4 rounded-2xl
                      bg-linear-to-b from-emerald-900/40 to-emerald-800/20
                      border border-emerald-500/20 text-center">
        <div className="flex justify-center mb-2">
          <Crown size={22} className="text-emerald-400" />
        </div>
        <p className="text-[13px] font-semibold text-white mb-1">Go Premium</p>
        <p className="text-[11px] text-gray-400 mb-3 leading-relaxed">
          Unlock advanced charts and premium insights.
        </p>
        <button className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500
                           text-white text-[12px] font-medium transition-all">
          Upgrade Now
        </button>
      </div>

      {/* FIX #7 — Divider before bottom actions */}
      <div className="border-t border-white/[0.07] pt-3 space-y-1">
        <button
          onClick={() => setIsDark(!isDark)}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-[14px]
                     text-gray-400 hover:bg-white/5 hover:text-white w-full transition-all"
        >
          {isDark ? <Sun size={18} className="shrink-0" /> : <Moon size={18} className="shrink-0" />}
          <span>{isDark ? "Light Mode" : "Dark Mode"}</span>
        </button>

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-[14px]
                     text-red-400 hover:bg-red-500/10 w-full transition-all"
        >
          <LogOut size={18} className="shrink-0" />
          <span>Logout</span>
        </button>
      </div>
    </motion.div>
  );
}

export default Sidebar;