// server/routes/alertRoutes.js
const express = require("express");
const {
  createAlert,
  getAlerts,
  deleteAlert,
  updateAlert,
  toggleAlert,
  sendTestAlert,
} = require("../controllers/alertController");
const protect = require("../middleware/authMiddleware");
const { testEmailLimiter } = require("../middleware/rateLimiters");

const router = express.Router();

router.use(protect);

router.post("/", createAlert);
router.get("/", getAlerts);
router.patch("/:id", updateAlert);
router.delete("/:id", deleteAlert);
router.patch("/:id/toggle", toggleAlert);
router.post("/test", testEmailLimiter, sendTestAlert);

module.exports = router;
