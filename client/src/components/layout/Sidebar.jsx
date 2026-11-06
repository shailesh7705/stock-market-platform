// client/src/components/layout/Sidebar.jsx
import {
  LayoutDashboard,
  Bell,
  TrendingUp,
  Bookmark,
  Newspaper,
  Search,
  LogOut,
  Zap,
  Activity,
  Compass,
  Scale,
  Calendar,
  X,
  ChevronRight,
} from "lucide-react";
import { motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import useAlertStore from "../../store/alertStore";
import useWatchlistStore from "../../store/watchlistStore";
import useAuthStore from "../../store/authStore";

function Sidebar({ onCloseMobile }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { alerts } = useAlertStore();
  const { watchlist } = useWatchlistStore();
  const logout = useAuthStore((state) => state.logout);

  const activeAlertsCount = alerts?.filter((a) => !a.triggered).length || 0;
  const watchlistCount = watchlist?.length || 0;

  const navItems = [
    {
      title: "Dashboard",
      path: "/dashboard",
      icon: LayoutDashboard,
      badge: null,
    },
    {
      title: "Portfolio",
      path: "/portfolio",
      icon: Activity,
      badge: null,
    },
    {
      title: "Screener",
      path: "/markets",
      icon: Compass,
      badge: null,
    },
    {
      title: "Compare",
      path: "/compare",
      icon: Scale,
      badge: null,
    },
    {
      title: "Events",
      path: "/events",
      icon: Calendar,
      badge: null,
    },
    {
      title: "Watchlist",
      path: "/watchlist",
      icon: Bookmark,
      badge: watchlistCount > 0 ? watchlistCount : null,
      badgeColor: "bg-blue-500/15 text-blue-400 border-blue-500/20",
    },
    {
      title: "Price Alerts",
      path: "/alerts",
      icon: Bell,
      badge: activeAlertsCount > 0 ? activeAlertsCount : null,
      badgeColor: "bg-amber-500/15 text-amber-400 border-amber-500/20",
    },
    {
      title: "Market Movers",
      path: "/dashboard#market-movers",
      icon: TrendingUp,
      action: () => {
        if (location.pathname === "/dashboard") {
          document.getElementById("market-movers")?.scrollIntoView({ behavior: "smooth" });
        } else {
          navigate("/dashboard");
          setTimeout(() => {
            document.getElementById("market-movers")?.scrollIntoView({ behavior: "smooth" });
          }, 200);
        }
      },
    },
    {
      title: "Market News",
      path: "/dashboard#news",
      icon: Newspaper,
      action: () => {
        if (location.pathname === "/dashboard") {
          document.getElementById("news")?.scrollIntoView({ behavior: "smooth" });
        } else {
          navigate("/dashboard");
          setTimeout(() => {
            document.getElementById("news")?.scrollIntoView({ behavior: "smooth" });
          }, 200);
        }
      },
    },
  ];

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleItemClick = (item) => {
    if (onCloseMobile) onCloseMobile();
    if (item.action) {
      item.action();
    } else {
      navigate(item.path);
    }
  };

  return (
    <div className="no-print w-72 shrink-0 h-full bg-[#0b1120] border-r border-white/[0.08] flex flex-col justify-between p-5 overflow-y-auto">
      <div>
        {/* Brand Logo & Close Button */}
        <div className="flex items-center justify-between mb-6">
          <div
            onClick={() => {
              navigate("/dashboard");
              if (onCloseMobile) onCloseMobile();
            }}
            className="flex items-center gap-3 cursor-pointer group select-none"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-400 via-yellow-400 to-amber-600 p-0.5 flex items-center justify-center shadow-lg shadow-amber-500/25 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-[#090e17] rounded-[10px] flex items-center justify-center">
                <Activity size={18} className="text-amber-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[17px] font-black text-white tracking-tight leading-none block group-hover:text-amber-400 transition-colors">
                  StockPulse
                </span>
                <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 font-mono tracking-wider">
                  PRO
                </span>
              </div>
              <span className="text-[10px] font-bold text-amber-400 tracking-wider uppercase mt-1 block">
                NSE Intelligent Terminal
              </span>
            </div>
          </div>

          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <div className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isCurrent =
              item.path === location.pathname ||
              (item.path.startsWith("/dashboard#") && location.pathname === "/dashboard");

            return (
              <button
                key={item.title}
                onClick={() => handleItemClick(item)}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-[13px] font-semibold transition-all relative group ${
                  isCurrent
                    ? "bg-emerald-500/10 text-emerald-400 font-bold"
                    : "text-gray-400 hover:text-gray-200 hover:bg-white/[0.04]"
                }`}
              >
                {/* Active bar indicator */}
                {isCurrent && (
                  <motion.div
                    layoutId="activeBar"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-emerald-400"
                  />
                )}

                <div className="flex items-center gap-3">
                  <Icon
                    size={18}
                    className={isCurrent ? "text-emerald-400" : "text-gray-500 group-hover:text-gray-300"}
                  />
                  <span>{item.title}</span>
                </div>

                {item.badge !== null && item.badge !== undefined && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      item.badgeColor || "bg-white/10 text-gray-300 border-white/10"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom User / Info Box */}
      <div className="pt-4 border-t border-white/[0.07] space-y-3">
        {/* Email Alert Status Pill */}
        <div className="p-3 bg-[#070d18] border border-white/[0.06] rounded-2xl">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <p className="text-[11px] font-bold text-white">Email Engine Live</p>
          </div>
          <p className="text-[10px] text-gray-500 leading-relaxed">
            Target hits automatically dispatch HTML alerts to your inbox.
          </p>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-[13px] font-medium text-rose-400 hover:bg-rose-500/10 transition-all group"
        >
          <div className="flex items-center gap-3">
            <LogOut size={16} />
            <span>Sign Out</span>
          </div>
          <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
      </div>
    </div>
  );
}

export default Sidebar;
