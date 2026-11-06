// server/routes/eventsRoutes.js
const express = require("express");
const { getMarketEvents, getStockEvents } = require("../controllers/eventsController");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

// Public with optional user-context for portfolio/watchlist filtering
router.get("/", (req, res, next) => {
  if (req.headers.authorization || req.cookies?.access_token) {
    return protect(req, res, () => getMarketEvents(req, res));
  }
  return getMarketEvents(req, res);
});

router.get("/:symbol", getStockEvents);

module.exports = router;
