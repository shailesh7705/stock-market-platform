// server/routes/stockRoutes.js
const express = require("express");
const router  = express.Router();

const {
  getLiveStocks,
  getHistoricalData,
  searchStocks,
  getMarketIndices,
  getMarketMovers,
} = require("../controllers/stockController");

router.get("/live",           getLiveStocks);
router.get("/history/:symbol",getHistoricalData);
router.get("/search",         searchStocks);      // FIX — was missing
router.get("/indices",        getMarketIndices);  // FIX — was missing
router.get("/movers",         getMarketMovers);   // FIX — was missing

module.exports = router;