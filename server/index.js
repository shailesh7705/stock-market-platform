const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const connectDB = require("./config/db");
const startAlertEngine = require("./utils/alertEngine");
const { startLiveHub } = require("./utils/liveHub");
const startKeepAlive = require("./utils/keepAlive");
const { createApp } = require("./app");

const missingEnv = ["MONGO_URI", "JWT_SECRET"].filter((key) => !process.env[key]);
if (missingEnv.length) {
  console.error(`[Server] Missing required environment variables: ${missingEnv.join(", ")}`);
  process.exit(1);
}
if (process.env.JWT_SECRET.length < 32) {
  console.warn("[Server] JWT_SECRET is shorter than 32 characters; use a long random value.");
}

startAlertEngine();
connectDB();
startLiveHub();
startKeepAlive();

const app = createApp();
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`[Server] StockPulse running on port ${PORT}`);
});
