const express = require("express");

const {

  getMarketNews

} = require(

  "../controllers/newsController"

);

const router = express.Router();

router.get(

  "/market",

  getMarketNews

);

module.exports = router;