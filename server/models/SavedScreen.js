// server/models/SavedScreen.js
const mongoose = require("mongoose");

const savedScreenSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    description: {
      type: String,
      default: "",
      maxlength: 250,
    },
    filters: {
      marketCap: { min: Number, max: Number },
      pe: { min: Number, max: Number },
      pb: { min: Number, max: Number },
      roe: { min: Number, max: Number },
      roce: { min: Number, max: Number },
      debtToEquity: { min: Number, max: Number },
      dividendYield: { min: Number, max: Number },
      pulseScore: { min: Number, max: Number },
      rsi: { min: Number, max: Number },
      changePercent: { min: Number, max: Number },
      sectors: [String],
    },
    columns: {
      type: [String],
      default: ["symbol", "companyName", "price", "changePercent", "pulseScore", "pe", "roe", "dividendYield"],
    },
    sortBy: {
      type: String,
      default: "marketCap",
    },
    sortOrder: {
      type: String,
      enum: ["asc", "desc"],
      default: "desc",
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

savedScreenSchema.index({ user: 1, name: 1 }, { unique: true });

module.exports = mongoose.model("SavedScreen", savedScreenSchema);
