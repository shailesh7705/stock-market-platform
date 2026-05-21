// server/index.js
require("dotenv").config();

const express            = require("express");
const cors               = require("cors");
const connectDB          = require("./config/db");
const authRoutes         = require("./routes/authRoutes");
const stockRoutes        = require("./routes/stockRoutes");
const watchlistRoutes    = require("./routes/watchlistRoutes");
const alertRoutes        = require("./routes/alertRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const newsRoutes         = require("./routes/newsRoutes");
const startAlertEngine   = require("./utils/alertEngine");
const startKeepAlive     = require("./utils/keepAlive");

const app = express();

// ─── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = [
  "https://stockpulse-mu-three.vercel.app",
  "http://localhost:5173",
  "http://localhost:3000",
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked: ${origin}`));
    }
  },
  credentials: true,
}));

app.use(express.json());

// FIX — disable caching on all API responses
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
app.use("/api/auth",          authRoutes);
app.use("/api/stocks",        stockRoutes);
app.use("/api/watchlist",     watchlistRoutes);
app.use("/api/alerts",        alertRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/news",          newsRoutes);

// Health check
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "StockPulse API running" });
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
  console.log(`[Server] Running on port ${PORT}`);
});