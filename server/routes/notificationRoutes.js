// server/routes/notificationRoutes.js
const express = require("express");
const {
  getNotifications,
  markAllRead,
  deleteNotification,
  clearAllNotifications,
} = require("../controllers/notificationController");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

router.get("/", getNotifications);
router.put("/read-all", markAllRead);
router.delete("/clear-all", clearAllNotifications);
router.delete("/:id", deleteNotification);

module.exports = router;
