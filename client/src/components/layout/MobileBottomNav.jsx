// client/src/components/layout/MobileBottomNav.jsx
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Compass,
  Bookmark,
  Activity,
  Bell,
} from "lucide-react";
import useWatchlistStore from "../../store/watchlistStore";
import useAlertStore from "../../store/alertStore";
import useNotificationStore from "../../store/notificationStore";

export default function MobileBottomNav() {
  const location = useLocation();
  const { watchlist } = useWatchlistStore();
  const { alerts } = useAlertStore();
  const { notifications } = useNotificationStore();

  const watchlistCount = watchlist?.length || 0;
  const activeAlertsCount = alerts?.filter((a) => !a.triggered).length || 0;
  const unreadCount = notifications?.filter((n) => !n.read).length || 0;

  const tabs = [
    {
      to: "/dashboard",
      label: "Home",
      icon: LayoutDashboard,
      badge: null,
    },
    {
      to: "/markets",
      label: "Markets",
      icon: Compass,
      badge: null,
    },
    {
      to: "/watchlist",
      label: "Watchlist",
      icon: Bookmark,
      badge: watchlistCount > 0 ? watchlistCount : null,
    },
    {
      to: "/portfolio",
      label: "Portfolio",
      icon: Activity,
      badge: null,
    },
    {
      to: "/alerts",
      label: "Alerts",
      icon: Bell,
      badge: unreadCount > 0 ? unreadCount : activeAlertsCount > 0 ? activeAlertsCount : null,
    },
  ];

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#080b11]/95 backdrop-blur-xl border-t border-white/[0.08] px-2 pt-1 pb-[calc(env(safe-area-inset-bottom)+0.25rem)]"
      aria-label="Mobile Bottom Navigation"
    >
      <div className="flex items-center justify-around h-14">
        {tabs.map(({ to, label, icon: Icon, badge }) => {
          const isActive = location.pathname === to;
          return (
            <NavLink
              key={to}
              to={to}
              className={`flex flex-col items-center justify-center flex-1 h-full py-1 relative select-none transition-colors ${
                isActive ? "text-amber-400" : "text-gray-400 hover:text-gray-200"
              }`}
            >
              <div className="relative">
                <Icon
                  size={20}
                  className={`transition-transform ${isActive ? "scale-110" : ""}`}
                />
                {badge && (
                  <span className="absolute -top-1 -right-2.5 min-w-[15px] h-[15px] px-1 rounded-full bg-amber-500 text-black text-[9px] font-black flex items-center justify-center font-mono">
                    {badge > 99 ? "99+" : badge}
                  </span>
                )}
              </div>
              <span
                className={`text-[10px] mt-1 font-semibold tracking-tight transition-all ${
                  isActive ? "font-bold text-white" : ""
                }`}
              >
                {label}
              </span>
              {isActive && (
                <div className="absolute top-0 w-8 h-0.5 rounded-full bg-amber-400 shadow-sm shadow-amber-400/50" />
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
