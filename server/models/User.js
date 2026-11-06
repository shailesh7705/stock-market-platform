const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({

  name: {
    type: String,
    required: true
  },

  email: {
    type: String,
    required: true,
    unique: true
  },

  password: {
    type: String,
    required: true
  },

  alertSound: {
    type: Boolean,
    default: true
  },

  passwordResetHash: {
    type: String,
    default: null
  },

  passwordResetExpires: {
    type: Date,
    default: null
  },

  watchlistBoards: {
    type: [
      {
        name: { type: String, required: true },
        position: { type: Number, default: 0 },
      },
    ],
    default: undefined,
  }

}, {
  timestamps: true
});

const User = mongoose.model("User", userSchema);

module.exports = User;