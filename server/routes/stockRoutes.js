const express = require("express");

const router = express.Router();

const {

  getLiveStocks

} = require(

  "../controllers/stockController"

);

router.get(

  "/live",

  getLiveStocks

);

module.exports = router;