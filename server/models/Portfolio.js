const mongoose = require("mongoose");

const portfolioSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    symbol: { type: String, required: true, uppercase: true, trim: true },
    companyName: { type: String, trim: true },
    quantity: {
      type: Number,
      required: true,
      min: [0.01, "Quantity must be greater than 0"],
    },
    avgBuyPrice: {
      type: Number,
      required: true,
      min: [0.01, "Average buy price must be positive"],
    },
    buyDate: { type: Date, default: Date.now },
    notes: { type: String, trim: true, default: "" },
    broker: { type: String, default: "Manual", trim: true },
  },
  { timestamps: true }
);

portfolioSchema.index({ user: 1, symbol: 1 }, { unique: true });

module.exports = mongoose.model("Portfolio", portfolioSchema);
