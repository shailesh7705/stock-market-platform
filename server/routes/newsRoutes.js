// server/routes/newsRoutes.js
const express = require("express");
const { getMarketNews, getStockNews } = require("../controllers/newsController");

const router = express.Router();

router.get("/market", getMarketNews);
router.get("/:symbol", getStockNews);

module.exports = router;
