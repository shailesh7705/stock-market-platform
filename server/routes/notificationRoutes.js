// server/routes/notificationRoutes.js
const express = require("express");
const {
  getNotifications,
  markAllRead,
  deleteNotification,
  clearAllNotifications,
} = require("../controllers/notificationController");
const protect = require("../middleware/authMiddleware");
const validate = require("../middleware/validate");
const { notifications } = require("../validation/schemas");

const router = express.Router();

router.use(protect);

router.get("/", getNotifications);
router.put("/read-all", markAllRead);
router.delete("/clear-all", clearAllNotifications);
router.delete("/:id", validate(notifications.byId), deleteNotification);

module.exports = router;
