// server/utils/keepAlive.js
// Pings the server every 14 minutes to prevent Render free tier sleeping
// Render sleeps after 15 minutes of inactivity — this keeps it awake

const https = require("https");
const http  = require("http");

const RENDER_URL = process.env.RENDER_EXTERNAL_URL || process.env.BACKEND_URL;

const startKeepAlive = () => {
  if (!RENDER_URL) {
    console.log("[KeepAlive] No URL set — skipping (local dev)");
    return;
  }

  // Ping every 14 minutes (Render sleeps at 15)
  const INTERVAL = 14 * 60 * 1000;

  const ping = () => {
    try {
      const url      = new URL(RENDER_URL);
      const protocol = url.protocol === "https:" ? https : http;

      const req = protocol.get(`${RENDER_URL}`, (res) => {
        console.log(`[KeepAlive] ✓ Pinged at ${new Date().toLocaleTimeString()} — ${res.statusCode}`);
      });

      req.on("error", (err) => {
        console.log("[KeepAlive] ✗ Ping failed:", err.message);
      });

      req.end();
    } catch (err) {
      console.log("[KeepAlive] ✗ Error:", err.message);
    }
  };

  // First ping after 14 minutes
  setInterval(ping, INTERVAL);
  console.log("[KeepAlive] Started — pinging every 14 minutes");
};

module.exports = startKeepAlive;