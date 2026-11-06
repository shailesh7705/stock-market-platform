// server/index.js
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const mongoose = require("mongoose");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const stockRoutes = require("./routes/stockRoutes");
const watchlistRoutes = require("./routes/watchlistRoutes");
const alertRoutes = require("./routes/alertRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const newsRoutes = require("./routes/newsRoutes");
const portfolioRoutes = require("./routes/portfolioRoutes");
const streamRoutes = require("./routes/streamRoutes");
const marketRoutes = require("./routes/marketRoutes");
const { apiLimiter } = require("./middleware/rateLimiters");
const startAlertEngine = require("./utils/alertEngine");
const { startLiveHub } = require("./utils/liveHub");
const startKeepAlive = require("./utils/keepAlive");

const missingEnv = ["MONGO_URI", "JWT_SECRET"].filter((key) => !process.env[key]);
if (missingEnv.length) {
  console.error(`[Server] Missing required environment variables: ${missingEnv.join(", ")}`);
  process.exit(1);
}
if (process.env.JWT_SECRET.length < 32) {
  console.warn("[Server] JWT_SECRET is shorter than 32 characters; use a long random value.");
}

const app = express();

app.set("trust proxy", 1);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    frameguard: { action: "deny" },
    noSniff: true,
    xssFilter: true,
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  })
);

// ─── CORS Configuration ───────────────────────────────────────────────────────
const isProduction = process.env.NODE_ENV === "production";
const trimOrigin = (value) => value.trim().replace(/\/+$/, "");

const allowedOrigins = new Set(
  [
    "https://stockpulse-mu-three.vercel.app",
    process.env.FRONTEND_URL,
    ...(process.env.ALLOWED_ORIGINS || "").split(","),
  ]
    .filter(Boolean)
    .map(trimOrigin)
);

const VERCEL_PREVIEW_ORIGIN = /^https:\/\/stockpulse(-[a-z0-9-]+)?\.vercel\.app$/;
const LOCALHOST_ORIGIN = /^http:\/\/(localhost|127\.0\.0\.1):\d+$/;

const isAllowedOrigin = (origin) =>
  allowedOrigins.has(origin) ||
  VERCEL_PREVIEW_ORIGIN.test(origin) ||
  (!isProduction && LOCALHOST_ORIGIN.test(origin));

app.use(
  cors({
    origin: (origin, callback) => {
      // Requests without an Origin header (curl, server-to-server, same-origin) are not subject to CORS.
      if (!origin || isAllowedOrigin(origin)) return callback(null, true);

      console.warn(`[CORS] Blocked origin: ${origin}`);
      return callback(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["X-Next-Cursor"],
  })
);

// Broker CSV imports post up to 100 rows and parse their own larger body in portfolioRoutes.
const jsonBody = express.json({ limit: "100kb" });
app.use((req, res, next) => (req.path === "/api/portfolio/bulk" ? next() : jsonBody(req, res, next)));

// Express 5 exposes req.query as a getter. Shadow it so mongo-sanitize can
// strip $ and . operators from body, query, and params.
app.use((req, _res, next) => {
  Object.defineProperty(req, "query", {
    value: { ...req.query },
    writable: true,
    configurable: true,
    enumerable: true,
  });
  next();
});
app.use(mongoSanitize());

app.use("/api/stream", streamRoutes);
app.use("/api", apiLimiter);

// Disable caching on all API responses
app.use((req, res, next) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  next();
});

// ─── DB + Services ────────────────────────────────────────────────────────────
startAlertEngine();
connectDB();
startLiveHub();
startKeepAlive();

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/stocks", stockRoutes);
app.use("/api/watchlist", watchlistRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/news", newsRoutes);
app.use("/api/portfolio", portfolioRoutes);
app.use("/api/market", marketRoutes);

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
const CLIENT_ERRORS = {
  "entity.too.large": [413, "Request body is too large."],
  "entity.parse.failed": [400, "Request body is not valid JSON."],
};

app.use((err, req, res, next) => {
  const clientError = CLIENT_ERRORS[err.type];
  if (clientError) {
    return res.status(clientError[0]).json({ message: clientError[1] });
  }

  console.error("[Error]", err.stack || err.message);
  if (isProduction) {
    return res.status(500).json({
      message: "An unexpected error occurred. Please try again later.",
    });
  }
  res.status(500).json({ message: err.message || "Internal server error" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`[Server] StockPulse running on port ${PORT}`);
});
