const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { subscribeUser, subscribeIndices } = require("../utils/alertBus");
const { snapshotIndices } = require("../utils/liveHub");

const router = express.Router();

router.get("/alerts", async (req, res) => {
  const header = req.headers.authorization || "";
  const token = (header.startsWith("Bearer ") ? header.slice(7) : null) || req.query.token;

  if (!token || !process.env.JWT_SECRET) {
    return res.status(401).json({ message: "Please sign in to access this feature." });
  }

  let user;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.purpose === "password-reset") {
      return res.status(401).json({ message: "Not Authorized. Please sign in." });
    }
    user = await User.findById(decoded.id).select("_id");
  } catch {
    return res.status(401).json({ message: "Your session has expired. Please sign in again." });
  }

  if (!user) {
    return res.status(401).json({ message: "User account no longer exists. Please sign in again." });
  }

  res.status(200);
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  if (typeof res.flushHeaders === "function") res.flushHeaders();

  const send = (event, data) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  send("ready", { ok: true });

  const unsubscribe = subscribeUser(String(user._id), (payload) => send("alert", payload));
  const unsubscribeIndices = subscribeIndices((payload) => send("indices", payload));
  const heartbeat = setInterval(() => {
    res.write(`event: ping\ndata: ${Date.now()}\n\n`);
  }, 25000);

  snapshotIndices().catch(() => {});

  req.on("close", () => {
    clearInterval(heartbeat);
    unsubscribe();
    unsubscribeIndices();
  });
});

module.exports = router;
