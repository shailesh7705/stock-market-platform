// server/controllers/notificationController.js
const Notification = require("../models/Notification");

const getNotifications = async (req, res) => {
  try {
    const { limit, before } = req.query;
    const filter = { user: req.user._id };
    if (before) filter.createdAt = { $lt: before };

    const notifications = await Notification.find(filter).sort({ createdAt: -1 }).limit(limit);
    if (notifications.length === limit) {
      res.setHeader("X-Next-Cursor", notifications[notifications.length - 1].createdAt.toISOString());
    }
    res.status(200).json(notifications);
  } catch (error) {
    console.error("[Notification] Get error:", error.message);
    res.status(500).json({ message: "Server Error" });
  }
};

const markAllRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user._id, read: false },
      { $set: { read: true } }
    );
    res.status(200).json({ message: "All marked as read" });
  } catch (error) {
    console.error("[Notification] Read error:", error.message);
    res.status(500).json({ message: "Server Error" });
  }
};

const deleteNotification = async (req, res) => {
  try {
    const note = await Notification.findOne({
      _id: req.params.id,
      user: req.user._id,
    });
    if (!note) return res.status(404).json({ message: "Notification not found" });

    await note.deleteOne();
    res.status(200).json({ message: "Deleted" });
  } catch (error) {
    console.error("[Notification] Delete error:", error.message);
    res.status(500).json({ message: "Server Error" });
  }
};

const clearAllNotifications = async (req, res) => {
  try {
    await Notification.deleteMany({ user: req.user._id });
    res.status(200).json({ message: "Cleared all" });
  } catch (error) {
    console.error("[Notification] Clear error:", error.message);
    res.status(500).json({ message: "Server Error" });
  }
};

module.exports = {
  getNotifications,
  markAllRead,
  deleteNotification,
  clearAllNotifications,
};
