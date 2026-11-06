const express = require("express");
const protect = require("../middleware/authMiddleware");
const {
  getPortfolio,
  addHolding,
  bulkAddHoldings,
  updateHolding,
  deleteHolding,
} = require("../controllers/portfolioController");
const validate = require("../middleware/validate");
const { portfolio } = require("../validation/schemas");

const router = express.Router();

router.get("/", protect, getPortfolio);
router.post("/bulk", protect, express.json({ limit: "1mb" }), validate(portfolio.bulk), bulkAddHoldings);
router.post("/", protect, validate(portfolio.add), addHolding);
router.put("/:id", protect, validate(portfolio.update), updateHolding);
router.delete("/:id", protect, validate(portfolio.byId), deleteHolding);

module.exports = router;
