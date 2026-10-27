const mongoose = require("mongoose");

const alertSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    symbol: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    targetPrice: {
      type: Number,
      required: true,
    },
    condition: {
      type: String,
      enum: ["above", "below"],
      default: "above",
    },
    initialPrice: {
      type: Number,
      default: null,
    },
    triggeredPrice: {
      type: Number,
      default: null,
    },
    triggered: {
      type: Boolean,
      default: false,
      index: true,
    },
    triggeredAt: {
      type: Date,
      default: null,
    },
    active: {
      type: Boolean,
      default: true,
    },
    notes: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for fast alert engine polling
alertSchema.index({ triggered: 1, active: 1, symbol: 1 });

const Alert = mongoose.model("Alert", alertSchema);

module.exports = Alert;
