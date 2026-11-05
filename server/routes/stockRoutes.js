// server/routes/stockRoutes.js
const express = require("express");
const { cacheGet } = require("../middleware/cacheMiddleware");
const router  = express.Router();

const {
  getLiveStocks,
  getHistoricalData,
  searchStocks,
  getMarketIndices,
  getMarketMovers,
  getStockDetails,
  getBatchStockDetails,
  getPeerComparison,
  getCuratedScreeners,
} = require("../controllers/stockController");

router.get("/live",           cacheGet(50), getLiveStocks);
router.get("/history/:symbol",cacheGet(30 * 60), getHistoricalData);
router.get("/search",         searchStocks);
router.get("/indices",        getMarketIndices);
router.get("/movers",         getMarketMovers);
router.get("/screeners",      getCuratedScreeners);
router.get("/peers/:symbol",  getPeerComparison);
router.get("/details/batch",  cacheGet(12 * 60), getBatchStockDetails);
router.get("/details/:symbol",cacheGet(12 * 60), getStockDetails);

module.exports = router;
