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
const validate = require("../middleware/validate");
const { alerts } = require("../validation/schemas");

const router = express.Router();

router.use(protect);

router.post("/", validate(alerts.create), createAlert);
router.get("/", validate(alerts.list), getAlerts);
router.post("/test", testEmailLimiter, validate(alerts.test), sendTestAlert);
router.patch("/:id", validate(alerts.update), updateAlert);
router.delete("/:id", validate(alerts.byId), deleteAlert);
router.patch("/:id/toggle", validate(alerts.byId), toggleAlert);

module.exports = router;
