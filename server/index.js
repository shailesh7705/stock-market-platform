require("dotenv").config();

const express = require("express");

const cors = require("cors");

const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");

const stockRoutes = require("./routes/stockRoutes");

const watchlistRoutes = require("./routes/watchlistRoutes");

const alertRoutes = require("./routes/alertRoutes");

const notificationRoutes =
  require("./routes/notificationRoutes");

const newsRoutes =
  require("./routes/newsRoutes");

const startAlertEngine =
  require("./utils/alertEngine");

const app = express();

app.use(express.json());

app.use(cors({

  origin:
    "https://stockpulse-mu-three.vercel.app",

  credentials: true

}));

connectDB();

startAlertEngine();

const PORT =
  process.env.PORT || 5000;

app.use("/api/auth", authRoutes);

app.use("/api/stocks", stockRoutes);

app.use("/api/watchlist", watchlistRoutes);

app.use("/api/alerts", alertRoutes);

app.use(
  "/api/notifications",
  notificationRoutes
);

app.use("/api/news", newsRoutes);

app.get("/", (req, res) => {

  res.send("Backend Server Running");

});

app.listen(PORT, () => {

  console.log(
    `Server running on port ${PORT}`
  );

});