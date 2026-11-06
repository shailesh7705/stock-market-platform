const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const mongoose = require("mongoose");
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
      allowedHeaders: ["Content-Type", "Authorization"],
      exposedHeaders: ["X-Next-Cursor"],
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
  app.use((req, res, next) => {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
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

  app.get(["/", "/api/health"], (req, res) => {
    res.json({
      status: "ok",
      service: "StockPulse API",
      dbState: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
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
    console.error("[Error]", err.stack || err.message);
    if (isProduction) {
      return res.status(500).json({ message: "An unexpected error occurred. Please try again later." });
    }
    res.status(500).json({ message: err.message || "Internal server error" });
  });

  return app;
}

module.exports = { createApp };
