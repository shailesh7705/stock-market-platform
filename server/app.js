const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const mongoose = require("mongoose");
const compression = require("compression");
const crypto = require("crypto");
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
const { isMarketOpen } = require("./utils/marketHours");
const { getAlertEngineHealth } = require("./utils/alertEngine");
const { getSnapshotJobStatus } = require("./jobs/snapshotJob");

function createApp() {
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

  const app = express();
  app.set("trust proxy", 1);
  app.set("etag", "strong");

  // HTTP response compression
  app.use(
    compression({
      threshold: 1024,
      filter: (req, res) => {
        if (req.headers["x-no-compression"]) return false;
        return compression.filter(req, res);
      },
    })
  );

  // Request correlation ID
  app.use((req, res, next) => {
    req.id = req.headers["x-request-id"] || crypto.randomUUID();
    res.setHeader("X-Request-ID", req.id);
    next();
  });

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
      frameguard: { action: "deny" },
      noSniff: true,
      xssFilter: true,
      hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
    })
  );

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || isAllowedOrigin(origin)) return callback(null, true);
        console.warn(`[CORS] Blocked origin: ${origin}`);
        return callback(null, false);
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "X-Request-ID"],
      exposedHeaders: ["X-Next-Cursor", "X-Request-ID"],
    })
  );

  const jsonBody = express.json({ limit: "100kb" });
  app.use((req, res, next) => (req.path === "/api/portfolio/bulk" ? next() : jsonBody(req, res, next)));
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

  // Per-Route Cache-Control Policy Helper
  app.use((req, res, next) => {
    const isPublicMarketGet =
      req.method === "GET" &&
      (req.path.startsWith("/api/stocks") ||
        req.path.startsWith("/api/market") ||
        req.path.startsWith("/api/news"));

    if (isPublicMarketGet) {
      if (isMarketOpen()) {
        res.setHeader("Cache-Control", "public, max-age=15, s-maxage=15, stale-while-revalidate=60");
      } else {
        res.setHeader("Cache-Control", "public, max-age=300, s-maxage=300, stale-while-revalidate=600");
      }
    } else {
      res.setHeader("Cache-Control", "private, no-cache, no-store, must-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
    }
    next();
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/stocks", stockRoutes);
  app.use("/api/watchlist", watchlistRoutes);
  app.use("/api/alerts", alertRoutes);
  app.use("/api/notifications", notificationRoutes);
  app.use("/api/news", newsRoutes);
  app.use("/api/portfolio", portfolioRoutes);
  app.use("/api/market", marketRoutes);

  // Enhanced Health & Observability Endpoint
  app.get(["/", "/api/health"], (req, res) => {
    const dbConnected = mongoose.connection.readyState === 1;
    const alertHealth = getAlertEngineHealth();
    const snapshotHealth = getSnapshotJobStatus();
    const marketOpen = isMarketOpen();

    let isDegraded = !dbConnected;
    if (marketOpen && alertHealth.lastRunAt) {
      const minutesSinceAlertCheck = (Date.now() - new Date(alertHealth.lastRunAt).getTime()) / 60000;
      if (minutesSinceAlertCheck > 5) {
        isDegraded = true;
      }
    }

    const memory = process.memoryUsage();
    res.json({
      status: isDegraded ? "degraded" : "ok",
      service: "StockPulse API",
      dbState: dbConnected ? "connected" : "disconnected",
      marketSession: {
        isOpen: marketOpen,
      },
      alertEngine: alertHealth,
      snapshotJob: snapshotHealth,
      system: {
        uptime: Math.floor(process.uptime()),
        memory: {
          heapUsedMB: Math.round(memory.heapUsed / 1024 / 1024),
          rssMB: Math.round(memory.rss / 1024 / 1024),
        },
      },
      timestamp: new Date().toISOString(),
    });
  });

  app.use((req, res) => {
    res.status(404).json({ message: `Route not found: ${req.method} ${req.url}` });
  });

  const CLIENT_ERRORS = {
    "entity.too.large": [413, "Request body is too large."],
    "entity.parse.failed": [400, "Request body is not valid JSON."],
  };

  app.use((err, req, res, next) => {
    const clientError = CLIENT_ERRORS[err.type];
    if (clientError) {
      return res.status(clientError[0]).json({ message: clientError[1] });
    }
    console.error(`[Error] [Req: ${req.id || "N/A"}]`, err.stack || err.message);
    if (isProduction) {
      return res.status(500).json({ message: "An unexpected error occurred. Please try again later." });
    }
    res.status(500).json({ message: err.message || "Internal server error" });
  });

  return app;
}

module.exports = { createApp };
