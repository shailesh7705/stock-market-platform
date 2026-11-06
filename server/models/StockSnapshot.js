// server/models/StockSnapshot.js
const mongoose = require("mongoose");

const stockSnapshotSchema = new mongoose.Schema(
  {
    symbol: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
      uppercase: true,
    },
    companyName: {
      type: String,
      required: true,
      trim: true,
    },
    sector: {
      type: String,
      default: "Other",
      index: true,
    },
    industry: {
      type: String,
      default: "",
    },
    price: {
      type: Number,
      required: true,
    },
    change: {
      type: Number,
      default: 0,
    },
    changePercent: {
      type: Number,
      default: 0,
    },
    dayHigh: {
      type: Number,
      default: null,
    },
    dayLow: {
      type: Number,
      default: null,
    },
    volume: {
      type: Number,
      default: 0,
    },
    marketCap: {
      type: Number,
      default: 0,
      index: true,
    },
    pe: {
      type: Number,
      default: null,
    },
    dividendYield: {
      type: Number,
      default: null,
    },
    pulseScore: {
      type: Number,
      default: null,
      index: true,
    },
    technicals: {
      rsi: { type: Number, default: null },
      sma50: { type: Number, default: null },
      sma200: { type: Number, default: null },
      high52: { type: Number, default: null },
      low52: { type: Number, default: null },
    },
    isStale: {
      type: Boolean,
      default: false,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

stockSnapshotSchema.index({ sector: 1, pulseScore: -1 });
stockSnapshotSchema.index({ marketCap: -1, changePercent: -1 });

module.exports = mongoose.model("StockSnapshot", stockSnapshotSchema);
