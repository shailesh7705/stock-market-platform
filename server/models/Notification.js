const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({

  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  message: {
    type: String,
    required: true
  },

  read: {
    type: Boolean,
    default: false
  },

  kind: {
    type: String,
    default: "info"
  },

  symbol: {
    type: String,
    default: ""
  },

  alert: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Alert",
    default: null
  },

  targetPrice: {
    type: Number,
    default: null
  },

  triggeredPrice: {
    type: Number,
    default: null
  },

  condition: {
    type: String,
    default: ""
  }

}, {
  timestamps: true
});

const RETENTION_SECONDS = 90 * 24 * 60 * 60;

notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: RETENTION_SECONDS });

const Notification = mongoose.model(
  "Notification",
  notificationSchema
);

module.exports = Notification;