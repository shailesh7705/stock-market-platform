const express = require("express");
const protect = require("../middleware/authMiddleware");
const { authLimiter } = require("../middleware/rateLimiters");

const {
  registerUser,
  loginUser,
  refreshSession,
  logoutUser,
  logoutAllDevices,
  getMe,
  verifyEmail,
  resendVerification,
  changePassword,
  updateSettings,
  deleteAccount,
  exportUserData,
  forgotPassword,
  resetPassword,
  updatePreferences,
} = require("../controllers/authController");
const validate = require("../middleware/validate");
const { auth } = require("../validation/schemas");

const router = express.Router();

// ─── Authentication & Session Lifecycle ───────────────────────────────────────
router.post("/register", authLimiter, validate(auth.register), registerUser);
router.post("/login", authLimiter, validate(auth.login), loginUser);
router.post("/refresh", refreshSession);
router.post("/logout", logoutUser);
router.post("/logout-all", protect, logoutAllDevices);

// ─── Current User & Verification ──────────────────────────────────────────────
router.get("/me", protect, getMe);
router.post("/verify-email", validate(auth.verifyEmail), verifyEmail);
router.post("/resend-verification", authLimiter, resendVerification);

// ─── Account Settings, Password & Privacy (DPDP Act) ──────────────────────────
router.put("/password", protect, validate(auth.changePassword), changePassword);
router.put("/settings", protect, validate(auth.updateSettings), updateSettings);
router.patch("/settings", protect, validate(auth.updateSettings), updateSettings);
router.delete("/account", protect, validate(auth.deleteAccount), deleteAccount);
router.get("/export-data", protect, exportUserData);

// ─── Password Reset ───────────────────────────────────────────────────────────
router.post("/forgot-password", authLimiter, validate(auth.forgot), forgotPassword);
router.post("/reset-password", authLimiter, validate(auth.reset), resetPassword);

// ─── Legacy Preferences & Profile Compat ──────────────────────────────────────
router.patch("/preferences", protect, validate(auth.preferences), updatePreferences);
router.put("/preferences", protect, validate(auth.preferences), updatePreferences);
router.get("/profile", protect, (req, res) => {
  res.json({
    message: "Protected Profile Data",
    user: req.user,
  });
});

module.exports = router;
