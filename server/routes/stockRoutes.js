// server/routes/stockRoutes.js
const express = require("express");
const router  = express.Router();

const {
  getLiveStocks,
  getHistoricalData,
  searchStocks,
  getMarketIndices,
  getMarketMovers,
  getStockDetails,
  getBatchStockDetails,
} = require("../controllers/stockController");

router.get("/live",           getLiveStocks);
router.get("/history/:symbol",getHistoricalData);
router.get("/search",         searchStocks);
router.get("/indices",        getMarketIndices);
router.get("/movers",         getMarketMovers);
router.get("/details/batch",  getBatchStockDetails);
router.get("/details/:symbol",getStockDetails);

module.exports = router;
