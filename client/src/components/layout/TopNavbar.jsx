// client/src/components/layout/TopNavbar.jsx
import {
  Bell,
  LogOut,
  User,
  Clock,
  Menu,
  X,
  CheckCheck,
  TrendingUp,
  TrendingDown,
  LayoutDashboard,
  Bookmark,
  Activity,
  Layers,
  Search,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import StockSearch from "../search/StockSearch";
import { getMarketIndices } from "../../services/marketService";
import { getNotifications, markAllRead } from "../../services/notificationService";
import useAlertStore from "../../store/alertStore";
import useAuthStore from "../../store/authStore";
import useWatchlistStore from "../../store/watchlistStore";
import useNotificationStore from "../../store/notificationStore";

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

export default function TopNavbar({ onOpenMobileMenu }) {
  const [marketData, setMarketData] = useState([]);
  const [marketOpen, setMarketOpen] = useState(true);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  const location = useLocation();
  const navigate = useNavigate();

  const { alerts } = useAlertStore();
  const { watchlist } = useWatchlistStore();
  const { user } = useAuthStore();
  const { notifications, setNotifications } = useNotificationStore();

  const profileRef = useRef(null);
  const notifRef = useRef(null);

  // Live IST Clock
  useEffect(() => {
    const tick = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(tick);
  }, []);

  // Close menus on outside click
  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Fetch market indices
  useEffect(() => {
    fetchMarketData();
    const interval = setInterval(fetchMarketData, 20000);
    return () => clearInterval(interval);
  }, []);

  // Fetch notifications
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    fetchNotes();
    const interval = setInterval(fetchNotes, 15000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotes = async () => {
    try {
      const data = await getNotifications();
      if (Array.isArray(data)) setNotifications(data);
    } catch {
      // Ignore background error
    }
  };

  const fetchMarketData = async () => {
    try {
      const data = await getMarketIndices();
      if (Array.isArray(data) && data.length > 0) {
        setMarketData(data);
      }
      const now = new Date();
      // IST calculation (Mon-Fri 9:15 to 15:30 IST)
      const istHours = (now.getUTCHours() + 5 + Math.floor((now.getUTCMinutes() + 30) / 60)) % 24;
      const istMinutes = (now.getUTCMinutes() + 30) % 60;
      const istDay = now.getUTCDay();
      const totalMin = istHours * 60 + istMinutes;
      const isWeekday = istDay >= 1 && istDay <= 5;
      const isOpen = isWeekday && totalMin >= 9 * 60 + 15 && totalMin <= 15 * 60 + 30;
      setMarketOpen(isOpen);
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllRead();
      const updated = (notifications || []).map((n) => ({ ...n, read: true }));
      setNotifications(updated);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  const formattedTime = currentTime.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  });

  const displayName = cleanName(user?.name || "Investor");
  const initials = getInitials(user?.name || "") || "IP";
  const unreadNotesCount = notifications?.filter((n) => !n.read).length || 0;
  const activeAlertsCount = alerts?.filter((a) => !a.triggered).length || 0;
  const watchlistCount = watchlist?.length || 0;

  // Primary navigation items
  const navLinks = [
    {
      label: "Dashboard",
      path: "/dashboard",
      icon: LayoutDashboard,
      isActive: location.pathname === "/dashboard",
    },
    {
      label: "Watchlist",
      path: "/watchlist",
      icon: Bookmark,
      count: watchlistCount,
      isActive: location.pathname === "/watchlist",
    },
    {
      label: "Alerts",
      path: "/alerts",
      icon: Bell,
      count: activeAlertsCount,
      isActive: location.pathname === "/alerts",
    },
    {
      label: "Movers",
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
      isActive: false,
    },
  ];

  return (
    <header className="sticky top-0 z-50 h-16 w-full border-b border-white/[0.08] bg-[#080b11]/95 backdrop-blur-xl shrink-0 px-3 sm:px-6">
      <div className="h-full max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* ── Zone 1: Logo & Nav Links ── */}
        <div className="flex items-center gap-4 lg:gap-6 min-w-0">
          {/* Mobile hamburger button */}
          <button
            onClick={onOpenMobileMenu}
            className="lg:hidden w-9 h-9 rounded-xl bg-[#0f1422] border border-white/10 flex items-center justify-center text-gray-300 hover:text-white shrink-0 transition-colors"
            title="Open menu"
          >
            <Menu size={18} />
          </button>

          {/* Brand Logo */}
          <Link
            to="/dashboard"
            className="flex items-center gap-2.5 group shrink-0 select-none"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-400 via-teal-500 to-cyan-400 p-0.5 flex items-center justify-center shadow-lg shadow-emerald-500/25 group-hover:shadow-emerald-500/40 transition-all">
              <div className="w-full h-full bg-[#080b11] rounded-[10px] flex items-center justify-center">
                <Activity size={18} className="text-emerald-400 group-hover:scale-110 transition-transform" />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-black text-white tracking-tight group-hover:text-emerald-400 transition-colors">
                StockPulse
              </span>
              <span className="hidden sm:inline-block text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                PRO
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 pl-3 border-l border-white/[0.08]">
            {navLinks.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  onClick={() => (item.action ? item.action() : navigate(item.path))}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all select-none ${
                    item.isActive
                      ? "bg-white/10 text-white shadow-xs border border-white/10"
                      : "text-gray-400 hover:text-white hover:bg-white/[0.04]"
                  }`}
                >
                  <Icon size={14} className={item.isActive ? "text-emerald-400" : "text-gray-400"} />
                  <span>{item.label}</span>
                  {item.count > 0 && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                        item.isActive
                          ? "bg-emerald-500 text-black"
                          : "bg-white/10 text-gray-300"
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* ── Zone 2: Unbreakable Command Palette Search Trigger ── */}
        <div className="flex-1 max-w-[200px] sm:max-w-xs md:max-w-sm lg:max-w-md mx-1 sm:mx-3">
          <StockSearch />
        </div>

        {/* ── Zone 3: Market Status & User Controls ── */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Live Market Indices Ticker (Desktop / Wide screens) */}
          <div className="hidden xl:flex items-center gap-2.5 pr-2 border-r border-white/[0.08]">
            {marketData.slice(0, 2).map((market) => (
              <div
                key={market.symbol}
                className="flex items-center gap-1.5 bg-[#0e1422] border border-white/5 px-2.5 py-1 rounded-xl font-mono text-xs"
              >
                <span className="text-[10px] text-gray-400 font-sans font-bold">
                  {market.name === "NIFTY 50" ? "NIFTY" : "SENSEX"}
                </span>
                <span className="text-white font-bold">
                  {market.price ? Number(market.price).toLocaleString("en-IN") : "—"}
                </span>
                <span
                  className={`text-[10px] font-bold flex items-center gap-0.5 ${
                    market.positive ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  {market.positive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                  {market.change >= 0 ? "+" : ""}
                  {market.change ? market.change.toFixed(2) : "0.00"}%
                </span>
              </div>
            ))}

            {/* Market Live Status Pill */}
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-xl bg-white/[0.03] border border-white/5 text-[11px] font-bold">
              <span
                className={`w-2 h-2 rounded-full ${
                  marketOpen ? "bg-emerald-400 animate-pulse" : "bg-rose-400"
                }`}
              />
              <span className={marketOpen ? "text-emerald-400" : "text-gray-400"}>
                {marketOpen ? "NSE Live" : "Closed"}
              </span>
            </div>

            {/* Live IST Clock */}
            <div className="flex items-center gap-1 text-[11px] text-gray-400 font-mono">
              <Clock size={11} className="text-gray-500" />
              <span>{formattedTime}</span>
            </div>
          </div>

          {/* Quick Watchlist Shortcut Pill */}
          <Link
            to="/watchlist"
            className="hidden sm:flex items-center gap-1.5 h-9 px-3 rounded-xl bg-[#0e1422] hover:bg-white/10 border border-white/10 text-xs font-bold text-gray-300 hover:text-white transition-all select-none"
            title="My Watchlist"
          >
            <Bookmark size={14} className="text-cyan-400" />
            <span className="hidden md:inline">Watchlist</span>
            {watchlistCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300 font-mono">
                {watchlistCount}
              </span>
            )}
          </Link>

          {/* Notifications Dropdown */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowProfileMenu(false);
              }}
              className="relative w-9 h-9 rounded-xl bg-[#0e1422] border border-white/10 flex items-center justify-center text-gray-300 hover:text-white hover:bg-white/10 transition-all"
              title="Notifications"
            >
              <Bell size={15} />
              {unreadNotesCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-emerald-500 text-black text-[10px] font-black flex items-center justify-center border-2 border-[#080b11]">
                  {unreadNotesCount > 9 ? "9+" : unreadNotesCount}
                </span>
              )}
            </button>

            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-12 w-80 sm:w-96 bg-[#0e1422] border border-white/10 rounded-2xl shadow-2xl shadow-black/90 z-50 overflow-hidden backdrop-blur-xl"
                >
                  <div className="px-4 py-3 border-b border-white/[0.08] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="text-[13px] font-bold text-white">Notifications</h3>
                      {unreadNotesCount > 0 && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 bg-emerald-500/15 text-emerald-400 rounded-full">
                          {unreadNotesCount} new
                        </span>
                      )}
                    </div>
                    {unreadNotesCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
                      >
                        <CheckCheck size={13} /> Mark all read
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-white/[0.04]">
                    {!notifications || notifications.length === 0 ? (
                      <div className="p-6 text-center text-xs text-gray-500">
                        No notifications yet. Price alerts will trigger here automatically.
                      </div>
                    ) : (
                      notifications.slice(0, 10).map((note) => (
                        <div
                          key={note._id}
                          className={`p-3.5 transition-colors ${
                            note.read ? "bg-transparent opacity-75" : "bg-emerald-500/[0.06]"
                          }`}
                        >
                          <div className="flex items-start gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                              <Bell size={13} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[12px] font-semibold text-white leading-snug">
                                {note.message}
                              </p>
                              <p className="text-[10px] text-gray-500 mt-1">
                                {new Date(note.createdAt).toLocaleTimeString("en-IN", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  day: "numeric",
                                  month: "short",
                                })}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="p-2.5 border-t border-white/[0.08] text-center bg-[#0a0e17]">
                    <Link
                      to="/alerts"
                      onClick={() => setShowNotifications(false)}
                      className="text-[12px] font-bold text-emerald-400 hover:text-emerald-300 transition-colors block py-0.5"
                    >
                      Manage Price Alerts →
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* User Profile Avatar & Menu */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => {
                setShowProfileMenu(!showProfileMenu);
                setShowNotifications(false);
              }}
              className="flex items-center gap-2 p-1 pr-2 rounded-xl bg-[#0e1422] hover:bg-white/10 border border-white/10 transition-all select-none"
            >
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-emerald-400 via-teal-500 to-cyan-400 flex items-center justify-center text-black font-black text-xs shadow-md shadow-emerald-500/20">
                {initials}
              </div>
              <ChevronDown size={13} className="text-gray-400 hidden sm:block" />
            </button>

            <AnimatePresence>
              {showProfileMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-12 w-64 bg-[#0e1422] border border-white/10 rounded-2xl shadow-2xl shadow-black/90 z-50 overflow-hidden backdrop-blur-xl"
                >
                  <div className="p-4 border-b border-white/[0.08]">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-400 via-teal-500 to-cyan-400 flex items-center justify-center text-black font-black text-sm shrink-0">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[13px] font-bold text-white truncate leading-tight">
                          {displayName}
                        </p>
                        <p className="text-[11px] text-gray-400 truncate mt-0.5">
                          {user?.email}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-1 p-2 bg-[#0a0e17] border-b border-white/[0.06] text-center">
                    <div className="p-1.5 rounded-lg bg-white/[0.02]">
                      <p className="text-[10px] text-gray-500 uppercase font-bold">Watchlist</p>
                      <p className="text-xs font-mono font-bold text-cyan-400 mt-0.5">{watchlistCount} stocks</p>
                    </div>
                    <div className="p-1.5 rounded-lg bg-white/[0.02]">
                      <p className="text-[10px] text-gray-500 uppercase font-bold">Active Alerts</p>
                      <p className="text-xs font-mono font-bold text-amber-400 mt-0.5">{activeAlertsCount} active</p>
                    </div>
                  </div>

                  <div className="p-2 space-y-1">
                    <button
                      onClick={() => {
                        navigate("/dashboard");
                        setShowProfileMenu(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-gray-300 hover:text-white hover:bg-white/5 transition-all"
                    >
                      <LayoutDashboard size={14} className="text-emerald-400" />
                      <span>Trading Dashboard</span>
                    </button>

                    <button
                      onClick={() => {
                        navigate("/watchlist");
                        setShowProfileMenu(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-gray-300 hover:text-white hover:bg-white/5 transition-all"
                    >
                      <Bookmark size={14} className="text-cyan-400" />
                      <span>My Watchlist</span>
                    </button>

                    <button
                      onClick={() => {
                        navigate("/alerts");
                        setShowProfileMenu(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-gray-300 hover:text-white hover:bg-white/5 transition-all"
                    >
                      <Bell size={14} className="text-amber-400" />
                      <span>Price Alerts</span>
                    </button>
                  </div>

                  <div className="p-2 border-t border-white/[0.08]">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-rose-400 hover:bg-rose-500/10 transition-all"
                    >
                      <LogOut size={14} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
}
