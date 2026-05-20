const express = require("express");

const {

  getStockData,
  searchStocks,
  getMultipleStocks,
  getHistoricalStockData

} = require("../controllers/stockController");

const router = express.Router();

/* Search Stocks */
router.get("/search", searchStocks);

router.get("/live", getMultipleStocks);
/* Get Single Stock */
router.get(

  "/history/:symbol",

  getHistoricalStockData

);

router.get("/:symbol", getStockData);

module.exports = router;