const express = require("express");
const {
  addToWatchlist,
  getWatchlist,
  removeFromWatchlist,
  getBoards,
  createBoard,
  deleteBoard,
  reorderWatchlist,
  updateWatchlistItem,
  exportWatchlist,
} = require("../controllers/watchlistController");
const protect = require("../middleware/authMiddleware");
const validate = require("../middleware/validate");
const { watchlist } = require("../validation/schemas");

const router = express.Router();

router.use(protect);

router.get("/boards", getBoards);
router.post("/boards", validate(watchlist.createBoard), createBoard);
router.delete("/boards/:name", validate(watchlist.boardParam), deleteBoard);
router.patch("/reorder", validate(watchlist.reorder), reorderWatchlist);
router.get("/export", validate(watchlist.list), exportWatchlist);
router.get("/", validate(watchlist.list), getWatchlist);
router.post("/", validate(watchlist.add), addToWatchlist);
router.patch("/:id", validate(watchlist.update), updateWatchlistItem);
router.delete("/:id", validate(watchlist.byId), removeFromWatchlist);

module.exports = router;
