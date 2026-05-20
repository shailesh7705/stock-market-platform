const express = require("express");

const router = express.Router();

const {

  getLiveStocks,
  getHistoricalData

} = require(

  "../controllers/stockController"

);

router.get(

  "/live",

  getLiveStocks

);

router.get(

  "/history/:symbol",

  getHistoricalData

);

module.exports = router;