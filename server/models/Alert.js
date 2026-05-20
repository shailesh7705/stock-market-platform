const mongoose = require("mongoose");

const alertSchema = new mongoose.Schema({

  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  symbol: {
    type: String,
    required: true
  },

  targetPrice: {
    type: Number,
    required: true
  },

  triggered: {
    type: Boolean,
    default: false
  }

}, {
  timestamps: true
});

const Alert = mongoose.model(
  "Alert",
  alertSchema
);

module.exports = Alert;