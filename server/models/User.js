const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
    },

    password: {
      type: String,
      required: true,
    },

    alertSound: {
      type: Boolean,
      default: true,
    },

    passwordResetHash: {
      type: String,
      default: null,
    },

    passwordResetExpires: {
      type: Date,
      default: null,
    },

    // ─── SP-29: Session & Refresh Tokens ──────────────────────────────────────────
    tokenVersion: {
      type: Number,
      default: 0,
    },

    refreshTokens: [
      {
        tokenHash: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
        expiresAt: { type: Date, required: true },
        userAgent: { type: String, default: null },
        ip: { type: String, default: null },
      },
    ],

    // ─── SP-30: Account Verification & Settings ──────────────────────────────────
    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    emailVerificationTokenHash: {
      type: String,
      default: null,
    },

    emailVerificationExpires: {
      type: Date,
      default: null,
    },

    emailNotificationsEnabled: {
      type: Boolean,
      default: true,
    },

    alertDigestFrequency: {
      type: String,
      enum: ["instant", "daily", "off"],
      default: "instant",
    },

    themePreference: {
      type: String,
      enum: ["system", "dark", "light"],
      default: "dark",
    },

    watchlistBoards: {
      type: [
        {
          name: { type: String, required: true },
          position: { type: Number, default: 0 },
        },
      ],
      default: undefined,
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);

module.exports = User;
