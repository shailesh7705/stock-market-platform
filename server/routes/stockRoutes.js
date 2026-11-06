// server/routes/stockRoutes.js
const express = require("express");
const { cacheGet } = require("../middleware/cacheMiddleware");
const router = express.Router();

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
const { getFinancials } = require("../controllers/financialsController");
const { getShareholdingPattern } = require("../controllers/shareholdingController");
const { getStockEvents } = require("../controllers/eventsController");
const { compareStocks } = require("../controllers/compareController");

const validate = require("../middleware/validate");
const { stocks } = require("../validation/schemas");

router.get("/live", validate(stocks.live), cacheGet(50), getLiveStocks);
router.get("/history/:symbol", validate(stocks.history), cacheGet(30 * 60), getHistoricalData);
router.get("/search", validate(stocks.search), searchStocks);
router.get("/indices", getMarketIndices);
router.get("/movers", getMarketMovers);
router.get("/screeners", getCuratedScreeners);
router.get("/compare", compareStocks);
router.get("/peers/:symbol", validate(stocks.symbol), getPeerComparison);
router.get("/details/batch", validate(stocks.batch), cacheGet(12 * 60), getBatchStockDetails);
router.get("/details/:symbol", validate(stocks.symbol), cacheGet(12 * 60), getStockDetails);

// Sprint 15 Research Depth Endpoints (SP-35, SP-36, SP-37)
router.get("/:symbol/financials", getFinancials);
router.get("/:symbol/shareholding", getShareholdingPattern);
router.get("/:symbol/events", getStockEvents);

module.exports = router;
