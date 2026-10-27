// client/src/components/layout/TopNavbar.jsx
import {
  Bell,
  LogOut,
  User,
  ChevronRight,
  Clock,
  Menu,
  X,
  Check,
  CheckCheck,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import StockSearch from "../search/StockSearch";
import { getMarketIndices } from "../../services/marketService";
import { getNotifications, markAllRead } from "../../services/notificationService";
import useAlertStore from "../../store/alertStore";
import useAuthStore from "../../store/authStore";
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

function TopNavbar({ onOpenMobileMenu }) {
  const [marketData, setMarketData] = useState([]);
  const [marketOpen, setMarketOpen] = useState(true);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  const { alerts } = useAlertStore();
  const { user } = useAuthStore();
  const { notifications, setNotifications } = useNotificationStore();
  const navigate = useNavigate();

  const profileRef = useRef(null);
  const notifRef = useRef(null);

  // Live clock
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
      // IST hours (market open: Mon-Fri 9:15 to 15:30)
      const istHours = (now.getUTCHours() + 5 + Math.floor((now.getUTCMinutes() + 30) / 60)) % 24;
      const istMinutes = (now.getUTCMinutes() + 30) % 60;
      const istDay = now.getUTCDay(); // 0 is Sunday, 6 is Saturday
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

  return (
    <header className="sticky top-0 z-40 h-16 border-b border-white/[0.07] bg-[#0b1120]/95 backdrop-blur-xl shrink-0 px-4 lg:px-6">
      <div className="h-full flex items-center justify-between gap-4">
        {/* Left Side: Mobile Menu Button & Search */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Mobile hamburger button */}
          <button
            onClick={onOpenMobileMenu}
            className="lg:hidden w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-300 hover:text-white shrink-0"
            title="Open navigation menu"
          >
            <Menu size={18} />
          </button>

          {/* Search Box */}
          <div className="w-full max-w-xs md:max-w-sm">
            <StockSearch />
          </div>

          {/* Live Market Indices Ticker (Desktop) */}
          <div className="hidden xl:flex items-center gap-4 pl-3 border-l border-white/[0.08] min-w-0">
            {marketData.map((market) => (
              <div key={market.symbol} className="flex items-center gap-2">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                  {market.name || (market.symbol === "^NSEI" ? "NIFTY 50" : "SENSEX")}
                </span>
                <span className="text-[13px] font-extrabold text-white">
                  {market.price ? market.price.toLocaleString("en-IN") : "—"}
                </span>
                <span
                  className={`text-[11px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 ${
                    market.positive
                      ? "text-emerald-400 bg-emerald-500/10"
                      : "text-rose-400 bg-rose-500/10"
                  }`}
                >
                  {market.positive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                  {market.change >= 0 ? "+" : ""}
                  {market.change ? market.change.toFixed(2) : "0.00"}%
                </span>
              </div>
            ))}

            {/* Market Open Status Pill */}
            <div className="flex items-center gap-1.5 pl-2 border-l border-white/[0.08]">
              <span
                className={`w-2 h-2 rounded-full ${
                  marketOpen ? "bg-emerald-400 animate-pulse" : "bg-rose-400"
                }`}
              />
              <span
                className={`text-[11px] font-bold ${
                  marketOpen ? "text-emerald-400" : "text-gray-400"
                }`}
              >
                {marketOpen ? "NSE Live" : "NSE Closed"}
              </span>
            </div>

            {/* Live Clock IST */}
            <div className="flex items-center gap-1 text-[11px] text-gray-400 font-mono pl-2">
              <Clock size={12} className="text-gray-500" />
              <span>{formattedTime} IST</span>
            </div>
          </div>
        </div>

        {/* Right Side: Alerts/Notification Bell & Profile */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Notifications Dropdown */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowProfileMenu(false);
              }}
              className="relative w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-300 hover:text-white hover:bg-white/10 transition-all"
              title="Notifications"
            >
              <Bell size={16} />
              {unreadNotesCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-emerald-500 text-black text-[10px] font-extrabold flex items-center justify-center border border-[#0b1120]">
                  {unreadNotesCount > 9 ? "9+" : unreadNotesCount}
                </span>
              )}
            </button>

            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-12 w-80 sm:w-96 bg-[#0e1626] border border-white/10 rounded-2xl shadow-2xl shadow-black/80 z-50 overflow-hidden"
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
                        No notifications yet. Alerts will appear here when triggered.
                      </div>
                    ) : (
                      notifications.slice(0, 10).map((note) => (
                        <div
                          key={note._id}
                          className={`p-3.5 transition-colors ${
                            note.read ? "bg-transparent opacity-75" : "bg-emerald-500/[0.05]"
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

                  <div className="p-2 border-t border-white/[0.08] text-center bg-[#070d18]">
                    <Link
                      to="/alerts"
                      onClick={() => setShowNotifications(false)}
                      className="text-[12px] font-bold text-emerald-400 hover:text-emerald-300 transition-colors block py-1"
                    >
                      Manage All Alerts →
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* User Profile Dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => {
                setShowProfileMenu(!showProfileMenu);
                setShowNotifications(false);
              }}
              className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-black font-extrabold text-[12px] shadow-lg shadow-emerald-500/20 hover:scale-105 transition-all"
            >
              {initials}
            </button>

            <AnimatePresence>
              {showProfileMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-12 w-64 bg-[#0e1626] border border-white/10 rounded-2xl shadow-2xl shadow-black/80 z-50 overflow-hidden"
                >
                  {/* User Profile Header */}
                  <div className="p-4 border-b border-white/[0.08]">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-black font-extrabold text-sm shrink-0">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[14px] font-bold text-white truncate leading-tight">
                          {displayName}
                        </p>
                        <p className="text-[11px] text-gray-400 truncate mt-0.5">
                          {user?.email}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Menu Links */}
                  <div className="p-2 space-y-1">
                    <button
                      onClick={() => {
                        navigate("/alerts");
                        setShowProfileMenu(false);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-[13px] text-gray-300 hover:text-white hover:bg-white/5 transition-all"
                    >
                      <div className="flex items-center gap-2.5">
                        <Bell size={15} className="text-amber-400" />
                        <span>Price Alerts</span>
                      </div>
                      <span className="text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                        {alerts?.length || 0}
                      </span>
                    </button>

                    <button
                      onClick={() => {
                        navigate("/watchlist");
                        setShowProfileMenu(false);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-[13px] text-gray-300 hover:text-white hover:bg-white/5 transition-all"
                    >
                      <div className="flex items-center gap-2.5">
                        <TrendingUp size={15} className="text-emerald-400" />
                        <span>My Watchlist</span>
                      </div>
                      <ChevronRight size={14} className="text-gray-500" />
                    </button>
                  </div>

                  {/* Logout Action */}
                  <div className="p-2 border-t border-white/[0.08]">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium text-rose-400 hover:bg-rose-500/10 transition-all"
                    >
                      <LogOut size={15} />
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

export default TopNavbar;
