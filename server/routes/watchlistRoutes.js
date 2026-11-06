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

const router = express.Router();

router.use(protect);

router.get("/boards", getBoards);
router.post("/boards", createBoard);
router.delete("/boards/:name", deleteBoard);
router.patch("/reorder", reorderWatchlist);
router.get("/export", exportWatchlist);
router.get("/", getWatchlist);
router.post("/", addToWatchlist);
router.patch("/:id", updateWatchlistItem);
router.delete("/:id", removeFromWatchlist);

module.exports = router;
