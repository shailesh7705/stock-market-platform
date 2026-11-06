// server/utils/keepAlive.js
// Pings the server every 14 minutes to prevent Render free tier sleeping
// Render sleeps after 15 minutes of inactivity — this keeps it awake

const RENDER_URL = process.env.RENDER_EXTERNAL_URL || process.env.BACKEND_URL;

const INTERVAL = 14 * 60 * 1000;
const TIMEOUT = 10 * 1000;

const ping = async () => {
  try {
    const healthUrl = new URL("/api/health", RENDER_URL);
    const res = await fetch(healthUrl, { signal: AbortSignal.timeout(TIMEOUT) });
    console.log(`[KeepAlive] ✓ Pinged at ${new Date().toLocaleTimeString()} — ${res.status}`);
  } catch (err) {
    console.log("[KeepAlive] ✗ Ping failed:", err.message);
  }
};

const startKeepAlive = () => {
  if (!RENDER_URL) {
    console.log("[KeepAlive] No URL set — skipping (local dev)");
    return;
  }

  ping();
  setInterval(ping, INTERVAL);
  console.log("[KeepAlive] Started — pinging every 14 minutes");
};

module.exports = startKeepAlive;