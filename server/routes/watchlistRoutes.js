const express = require("express");

const router = express.Router();

const {

  addToWatchlist,
  getWatchlist,
  removeFromWatchlist

} = require("../controllers/watchlistController");

const protect = require("../middleware/authMiddleware");

/* Get User Watchlist */
router.get(
  "/",
  protect,
  getWatchlist
);

/* Add Stock */
router.post(
  "/",
  protect,
  addToWatchlist
);

/* Remove Stock */
router.delete(
  "/:id",
  protect,
  removeFromWatchlist
);

module.exports = router;