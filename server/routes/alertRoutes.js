// server/routes/alertRoutes.js
const express = require("express");
const {
  createAlert,
  getAlerts,
  deleteAlert,
  toggleAlert,
  sendTestAlert,
} = require("../controllers/alertController");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

router.post("/", createAlert);
router.get("/", getAlerts);
router.delete("/:id", deleteAlert);
router.patch("/:id/toggle", toggleAlert);
router.post("/test", sendTestAlert);

module.exports = router;
