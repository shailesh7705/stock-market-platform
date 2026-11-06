// client/src/components/chat/PulseAIChat.jsx
import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  X,
  Send,
  TrendingUp,
  TrendingDown,
  Bell,
  ExternalLink,
  RotateCcw,
  Bot,
  Minimize2,
  Maximize2,
  Copy,
  Check,
  ShieldCheck,
  Zap,
  Scale,
  Calendar,
  Filter,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { sendChatMessage } from "../../services/chatService";
import useAuthStore from "../../store/authStore";
import toast from "react-hot-toast";

const INITIAL_MESSAGE = {
  id: "init",
  role: "model",
  content: `👋 Namaste! I am **PulseAI**, your real-time Indian stock market copilot.

I can help you with:
* **Proprietary PulseScore™ & 3Y Forecasts** (100-pt Coffee Can compounder rating & multi-year CAGR)
* **Side-by-Side Peer Comparisons** (Compare up to 4 stocks across valuations, margins & returns)
* **Corporate Actions & Dividends** (Upcoming earnings announcements, ex-dates, splits)
* **Shareholding & Promoter Pledge Trends** (FII, DII, and promoter pledge risk)
* **Universal Screeners** (Coffee Can Leaders, High ROE Compounders, Dividend Aristocrats)
* **Automated Price Alerts** (e.g. *"Set alert for Tata Motors below ₹700"*)

How can I help your portfolio today?`,
  stockCards: [],
};

const SUGGESTIONS = [
  "📊 How is Nifty 50 doing today?",
  "⚡ PulseScore and 3Y forecast for Reliance",
  "⚖️ Compare TCS, Infosys and Wipro",
  "📅 Upcoming dividends for ITC and TCS",
  "🔍 Screen Coffee Can Leaders",
  "🛡️ Check my portfolio diversification",
];

export default function PulseAIChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const { user } = useAuthStore();

  // ─── LocalStorage Persistence ───────────────────────────────────────────────
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem("stockpulse_pulseai_history");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn("Could not load chat history:", e);
    }
    return [INITIAL_MESSAGE];
  });

  useEffect(() => {
    try {
      localStorage.setItem("stockpulse_pulseai_history", JSON.stringify(messages));
    } catch (e) {
      // quota or private mode fallback
    }
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages]);

  // ─── Global Event Listener for "Ask PulseAI" anywhere on the site ─────────
  useEffect(() => {
    const handleOpenQuery = (e) => {
      const query = e.detail?.query;
      setIsOpen(true);
      if (query) {
        setTimeout(() => handleSend(query), 120);
      }
    };
    window.addEventListener("pulseai-open-query", handleOpenQuery);
    return () => window.removeEventListener("pulseai-open-query", handleOpenQuery);
  }, [messages]);

  const handleSend = async (textToSend) => {
    const query = (textToSend || input).trim();
    if (!query || loading) return;

    setInput("");
    const userMsg = {
      id: Date.now().toString(),
      role: "user",
      content: query,
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setLoading(true);

    try {
      const payload = newMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await sendChatMessage(payload);

      const botMsg = {
        id: (Date.now() + 1).toString(),
        role: "model",
        content: res.reply || "I have retrieved the latest information for you.",
        stockCards: res.stockCards || [],
        actionTaken: res.actionTaken || null,
      };

      setMessages((prev) => [...prev, botMsg]);

      if (res.actionTaken?.type === "alert_created") {
        toast.success(`Alert activated for ${res.actionTaken.symbol} at ₹${res.actionTaken.targetPrice}!`, {
          icon: "🔔",
        });
      }
      if (res.actionTaken?.type === "watchlist_added") {
        toast.success(`Added ${res.actionTaken.symbol} to your watchlist!`, {
          icon: "⭐",
        });
      }
    } catch (err) {
      console.error("[PulseAI] Error:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "model",
          content: "⚠️ I encountered an error connecting to market intelligence. Please try again in a moment.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleResetChat = () => {
    setMessages([INITIAL_MESSAGE]);
    localStorage.removeItem("stockpulse_pulseai_history");
    toast.success("Chat history cleared");
  };

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Copied to clipboard", { icon: "📋" });
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Format Markdown lines
  const renderFormattedText = (text) => {
    if (!text) return null;
    const lines = text.split("\n");
    return lines.map((line, idx) => {
      // Headers
      if (line.startsWith("### ")) {
        return (
          <h4 key={idx} className="font-bold text-emerald-400 text-xs sm:text-sm mt-2 mb-1">
            {line.replace("### ", "")}
          </h4>
        );
      }
      if (line.startsWith("## ")) {
        return (
          <h3 key={idx} className="font-extrabold text-white text-sm sm:text-base mt-2.5 mb-1">
            {line.replace("## ", "")}
          </h3>
        );
      }
      if (line.startsWith("---")) {
        return <hr key={idx} className="border-slate-800 my-2" />;
      }

      // Markdown Tables
      if (line.includes("|") && line.trim().startsWith("|")) {
        const cells = line
          .split("|")
          .map((c) => c.trim())
          .filter(Boolean);
        const isHeaderSep = cells.every((c) => /^:?-+:?$/.test(c));
        if (isHeaderSep) return null;

        return (
          <div key={idx} className="grid grid-cols-4 gap-1 text-[10px] sm:text-xs py-0.5 border-b border-slate-800/40 text-slate-300 font-mono">
            {cells.map((cell, cIdx) => (
              <span key={cIdx} className={cIdx === 0 ? "font-bold text-white col-span-1" : "text-right"}>
                {cell.replace(/\*\*/g, "")}
              </span>
            ))}
          </div>
        );
      }

      // Bold text formatting
      const parts = line.split(/(\*\*.*?\*\*)/g);
      const formattedParts = parts.map((part, pIdx) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={pIdx} className="text-white font-semibold">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return part;
      });

      // Bullet points
      if (line.trim().startsWith("* ") || line.trim().startsWith("- ")) {
        return (
          <div key={idx} className="flex items-start space-x-2 my-0.5 text-xs text-slate-300">
            <span className="text-emerald-400 leading-none mt-1">•</span>
            <span className="leading-relaxed">{formattedParts.slice(1)}</span>
          </div>
        );
      }

      return (
        <p key={idx} className="text-xs text-slate-300 leading-relaxed my-0.5 min-h-[1.1rem]">
          {formattedParts}
        </p>
      );
    });
  };

  return (
    <>
      {/* ─── Floating Launcher Button (FAB) ─────────────────────────────────── */}
      {/* Positioned at bottom-20 on mobile (to clear MobileBottomNav) and bottom-6 on desktop */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-40 flex items-center space-x-2"
          >
            <button
              onClick={() => setIsOpen(true)}
              className="group relative flex items-center space-x-2 px-3.5 py-2.5 sm:px-4 sm:py-3 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold rounded-full shadow-[0_8px_30px_rgb(16,185,129,0.35)] transition-all duration-200 active:scale-95 cursor-pointer"
            >
              {/* Pulse Indicator */}
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-400 border-2 border-slate-950"></span>
              </span>

              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-slate-950 animate-pulse" />
              <span className="text-xs sm:text-sm font-extrabold tracking-tight">PulseAI</span>
              <span className="text-[9px] uppercase font-black tracking-wider px-1.5 py-0.5 bg-slate-950/20 rounded-md">
                Copilot
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Expandable Chat Modal / Drawer ─────────────────────────────────── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={`fixed z-50 flex flex-col bg-[#070b14]/95 backdrop-blur-xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.9)] rounded-2xl overflow-hidden transition-all duration-300 ${
              isExpanded
                ? "inset-4 md:inset-x-auto md:right-6 md:bottom-6 md:top-12 md:w-[680px]"
                : "bottom-20 right-3 sm:bottom-6 sm:right-6 w-[94vw] sm:w-[440px] h-[580px] max-h-[76vh] sm:max-h-[86vh]"
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-slate-900 via-slate-900 to-[#070b14] border-b border-white/10">
              <div className="flex items-center space-x-3">
                <div className="relative p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                  <Bot className="w-5 h-5" />
                  <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-slate-950" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-bold text-white tracking-wide">PulseAI</span>
                    <span className="text-[10px] font-semibold px-1.5 py-0.2 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded">
                      PulseScore™ + Sprint 15
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 flex items-center space-x-1">
                    <span>NSE Research Intelligence</span>
                    <span>•</span>
                    <span className="text-emerald-400 font-medium">Auto-Grounded</span>
                  </p>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center space-x-1">
                <button
                  onClick={handleResetChat}
                  title="Clear Chat History"
                  className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  title={isExpanded ? "Collapse" : "Expand"}
                  className="hidden sm:block p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition"
                >
                  {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  title="Close"
                  className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Chat Messages Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-800">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col group ${msg.role === "user" ? "items-end" : "items-start"}`}
                >
                  <div
                    className={`max-w-[90%] rounded-2xl px-4 py-3 text-xs leading-relaxed relative ${
                      msg.role === "user"
                        ? "bg-emerald-500 text-slate-950 font-medium rounded-tr-xs shadow-md"
                        : "bg-slate-900/90 text-slate-200 border border-slate-800 rounded-tl-xs shadow-inner"
                    }`}
                  >
                    {msg.role === "user" ? (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    ) : (
                      <>
                        {renderFormattedText(msg.content)}
                        {/* Copy button */}
                        <button
                          onClick={() => handleCopy(msg.id, msg.content)}
                          title="Copy Analysis"
                          className="opacity-0 group-hover:opacity-100 transition absolute top-2 right-2 p-1 text-slate-400 hover:text-white bg-slate-800/80 rounded"
                        >
                          {copiedId === msg.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </>
                    )}
                  </div>

                  {/* Stock Cards (if present) */}
                  {msg.stockCards && msg.stockCards.length > 0 && (
                    <div className="w-full mt-2.5 space-y-2">
                      {msg.stockCards.map((card) => {
                        const isUp = card.change >= 0;
                        const cleanSym = card.symbol.replace(".NS", "");
                        return (
                          <div
                            key={card.symbol}
                            className="p-3 bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-xl transition flex flex-col space-y-2 shadow-sm"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="text-xs font-bold text-white tracking-wide">
                                  {cleanSym}
                                </span>
                                <p className="text-[10px] text-slate-400 line-clamp-1">{card.name}</p>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-bold text-white font-mono">
                                  ₹{card.price ? card.price.toLocaleString("en-IN") : "—"}
                                </div>
                                <div
                                  className={`text-[10px] font-semibold flex items-center justify-end space-x-0.5 ${
                                    isUp ? "text-emerald-400" : "text-rose-400"
                                  }`}
                                >
                                  {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                  <span>
                                    {isUp ? "+" : ""}
                                    {card.change} ({isUp ? "+" : ""}
                                    {card.changePercent}%)
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Mini Metrics */}
                            <div className="grid grid-cols-2 gap-2 text-[10px] pt-1 border-t border-slate-800/60 text-slate-400">
                              <div>
                                <span className="text-slate-500">Day Range:</span>{" "}
                                <span className="text-slate-300 font-mono">
                                  ₹{card.dayLow || "—"} - ₹{card.dayHigh || "—"}
                                </span>
                              </div>
                              <div className="text-right">
                                <span className="text-slate-500">Cap:</span>{" "}
                                <span className="text-slate-300 font-mono">{card.marketCap || "N/A"}</span>
                              </div>
                            </div>

                            {/* Contextual Action Chips (Sprint 15 Links) */}
                            <div className="flex items-center space-x-1.5 pt-1.5 flex-wrap gap-y-1">
                              <button
                                onClick={() => {
                                  navigate(`/stock/${card.symbol}`);
                                  setIsOpen(false);
                                }}
                                className="flex items-center space-x-1 py-1 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-medium rounded-lg transition"
                              >
                                <ExternalLink className="w-3 h-3" />
                                <span>Details</span>
                              </button>
                              <button
                                onClick={() => {
                                  navigate(`/compare?symbols=${cleanSym}`);
                                  setIsOpen(false);
                                }}
                                className="flex items-center space-x-1 py-1 px-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 text-[10px] font-medium rounded-lg transition"
                              >
                                <Scale className="w-3 h-3" />
                                <span>Compare</span>
                              </button>
                              <button
                                onClick={() =>
                                  handleSend(`What are the upcoming dividends and earnings dates for ${card.symbol}?`)
                                }
                                className="flex items-center space-x-1 py-1 px-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20 text-[10px] font-medium rounded-lg transition"
                              >
                                <Calendar className="w-3 h-3" />
                                <span>Events</span>
                              </button>
                              <button
                                onClick={() =>
                                  handleSend(`What is the PulseScore rating and 3-year forecast for ${card.symbol}?`)
                                }
                                className="flex items-center space-x-1 py-1 px-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 text-[10px] font-medium rounded-lg transition"
                              >
                                <Zap className="w-3 h-3" />
                                <span>PulseScore</span>
                              </button>
                              <button
                                onClick={() =>
                                  handleSend(`Set an alert for ${card.symbol} if price drops 5%`)
                                }
                                className="flex items-center space-x-1 py-1 px-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-[10px] font-medium rounded-lg transition"
                              >
                                <Bell className="w-3 h-3" />
                                <span>Alert</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}

              {/* Thinking Indicator */}
              {loading && (
                <div className="flex items-center space-x-2 text-slate-400 text-xs py-1">
                  <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
                  </div>
                  <span className="text-slate-400 text-xs animate-pulse">
                    PulseAI is querying real-time market data & models...
                  </span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Suggestions */}
            {messages.length <= 2 && (
              <div className="px-4 py-2 bg-slate-900/40 border-t border-slate-800/60 overflow-x-auto flex space-x-2 scrollbar-none">
                {SUGGESTIONS.map((sug, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(sug)}
                    className="shrink-0 text-[11px] px-2.5 py-1 rounded-full bg-slate-800/70 hover:bg-slate-800 text-slate-300 hover:text-emerald-400 border border-slate-700/50 transition cursor-pointer"
                  >
                    {sug}
                  </button>
                ))}
              </div>
            )}

            {/* Input Bar */}
            <div className="p-3 bg-slate-900 border-t border-slate-800">
              <div className="flex items-center space-x-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about Reliance, compare peers, dividends, alerts..."
                  disabled={loading}
                  className="flex-1 bg-slate-950 text-slate-100 placeholder-slate-500 text-xs px-3.5 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-emerald-500/60 transition"
                />
                <button
                  onClick={() => handleSend()}
                  disabled={loading || !input.trim()}
                  className="p-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-bold rounded-xl transition cursor-pointer active:scale-95"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>

              {/* Disclaimer */}
              <div className="flex items-center justify-center space-x-1 mt-2 text-[10px] text-slate-500 text-center">
                <ShieldCheck className="w-3 h-3 text-slate-500" />
                <span>AI-grounded real-time data. Not SEBI registered advice.</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
