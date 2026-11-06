const mongoose = require("mongoose");

const watchlistSchema = new mongoose.Schema({

  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  symbol: {
    type: String,
    required: true
  },

  companyName: {
  type: String,
  required: false,
  default: ""
},

  listName: {
    type: String,
    default: "My Watchlist",
    trim: true,
  },

  tags: {
    type: [String],
    default: [],
  },

  position: {
    type: Number,
    default: 0,
  },

}, {
  timestamps: true
});

watchlistSchema.index({ user: 1, listName: 1, symbol: 1 }, { unique: true });
watchlistSchema.index({ user: 1, listName: 1, position: 1 });

const Watchlist = mongoose.model(
  "Watchlist",
  watchlistSchema
);

module.exports = Watchlist;