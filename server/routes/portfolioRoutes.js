const express = require("express");
const protect = require("../middleware/authMiddleware");
const {
  getPortfolio,
  addHolding,
  bulkAddHoldings,
  updateHolding,
  deleteHolding,
} = require("../controllers/portfolioController");

const router = express.Router();

router.get("/", protect, getPortfolio);
router.post("/bulk", protect, bulkAddHoldings);
router.post("/", protect, addHolding);
router.put("/:id", protect, updateHolding);
router.delete("/:id", protect, deleteHolding);

module.exports = router;
