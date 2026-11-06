// server/models/ShareholdingPattern.js
const mongoose = require("mongoose");

const shareholdingQuarterSchema = new mongoose.Schema(
  {
    period: {
      type: String, // e.g. "Dec 2024", "Sep 2024", "Jun 2024"
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    promoter: {
      type: Number,
      required: true,
      default: 0,
    },
    fii: {
      type: Number, // Foreign Institutional Investors
      required: true,
      default: 0,
    },
    dii: {
      type: Number, // Domestic Institutional Investors
      required: true,
      default: 0,
    },
    mutualFunds: {
      type: Number,
      required: true,
      default: 0,
    },
    retailAndOthers: {
      type: Number,
      required: true,
      default: 0,
    },
    promoterPledgedPercent: {
      type: Number, // % of promoter holding that is pledged
      default: 0,
    },
  },
  { _id: false }
);

const shareholdingPatternSchema = new mongoose.Schema(
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
      default: "",
    },
    quarters: [shareholdingQuarterSchema],
    insights: [
      {
        type: { type: String, enum: ["positive", "neutral", "negative", "warning"] },
        title: String,
        description: String,
      },
    ],
    lastUpdated: {
      type: Date,
      default: Date.now,
      index: true,
    },
    source: {
      type: String,
      default: "NSE Shareholding Filings & Yahoo Finance",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("ShareholdingPattern", shareholdingPatternSchema);
