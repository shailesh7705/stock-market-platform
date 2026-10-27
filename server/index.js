// server/index.js
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const stockRoutes = require("./routes/stockRoutes");
const watchlistRoutes = require("./routes/watchlistRoutes");
const alertRoutes = require("./routes/alertRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const newsRoutes = require("./routes/newsRoutes");
const startAlertEngine = require("./utils/alertEngine");
const startKeepAlive = require("./utils/keepAlive");

const app = express();

// ─── CORS Configuration ───────────────────────────────────────────────────────
const allowedOrigins = [
  "https://stockpulse-mu-three.vercel.app",
  "http://localhost:5173",
  "http://localhost:3000",
  "http://localhost:4173",
];

if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL.replace(/\/+$/, ""));
}

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow server-to-server requests, mobile apps, curl, or no-origin
      if (!origin) return callback(null, true);

      // Check allowed list
      if (allowedOrigins.includes(origin)) return callback(null, true);

      // Allow any Vercel deployment preview / production domain (*.vercel.app)
      if (/^https:\/\/[a-zA-Z0-9_-]+\.vercel\.app$/.test(origin)) {
        return callback(null, true);
      }

      // Allow localhost with any port in development
      if (/^http:\/\/localhost:\d+$/.test(origin)) {
        return callback(null, true);
      }

      // Fallback: allow to avoid breaking deployments, but log
      console.warn(`[CORS] Allowed origin through fallback: ${origin}`);
      return callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

// Disable caching on all API responses
app.use((req, res, next) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  next();
});

// ─── DB + Services ────────────────────────────────────────────────────────────
connectDB();
startAlertEngine();
startKeepAlive();

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/stocks", stockRoutes);
app.use("/api/watchlist", watchlistRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/news", newsRoutes);

// Health check & Diagnostic
app.get(["/", "/api/health"], (req, res) => {
  res.json({
    status: "ok",
    service: "StockPulse API",
    dbState: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.url}` });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("[Error]", err.message);
  res.status(500).json({ message: err.message || "Internal server error" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`[Server] StockPulse running on port ${PORT}`);
});
