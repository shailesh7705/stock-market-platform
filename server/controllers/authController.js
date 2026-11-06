const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Alert = require("../models/Alert");
const Watchlist = require("../models/Watchlist");
const Portfolio = require("../models/Portfolio");
const Notification = require("../models/Notification");
const sendEmail = require("../utils/sendEmail");

const PASSWORD_RULE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
const GENERIC_AUTH_ERROR = "Invalid email or password";
const RESET_MESSAGE = "If an account exists for that email, a reset link is on the way.";

const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

const isProduction = process.env.NODE_ENV === "production";

const ACCESS_COOKIE_OPTS = {
  httpOnly: true,
  secure: isProduction,
  sameSite: "lax",
  maxAge: 15 * 60 * 1000, // 15 minutes
  path: "/",
};

const REFRESH_COOKIE_OPTS = {
  httpOnly: true,
  secure: isProduction,
  sameSite: "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: "/api/auth",
};

/**
 * Generate Access Token (15m) + Rotating Refresh Token (7d)
 */
async function issueTokens(user, req, res) {
  const tokenVersion = user.tokenVersion || 0;
  const accessToken = jwt.sign(
    { id: user._id, tokenVersion },
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
  );

  const rawRefreshToken = crypto.randomBytes(40).toString("hex");
  const tokenHash = hashToken(rawRefreshToken);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  // Maintain active refresh tokens (filter out expired ones)
  const now = new Date();
  const validTokens = (user.refreshTokens || []).filter(
    (rt) => rt.expiresAt && rt.expiresAt > now
  );

  // Keep up to 10 most recent sessions
  validTokens.push({
    tokenHash,
    createdAt: now,
    expiresAt,
    userAgent: req.headers["user-agent"] ? String(req.headers["user-agent"]).slice(0, 200) : null,
    ip: req.ip || null,
  });

  if (validTokens.length > 10) {
    validTokens.splice(0, validTokens.length - 10);
  }

  user.refreshTokens = validTokens;
  await user.save();

  if (res && typeof res.cookie === "function") {
    res.cookie("access_token", accessToken, ACCESS_COOKIE_OPTS);
    res.cookie("refresh_token", rawRefreshToken, REFRESH_COOKIE_OPTS);
  }

  return { accessToken, rawRefreshToken };
}

function sanitizeUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    alertSound: user.alertSound !== false,
    isEmailVerified: Boolean(user.isEmailVerified),
    emailNotificationsEnabled: user.emailNotificationsEnabled !== false,
    alertDigestFrequency: user.alertDigestFrequency || "instant",
    themePreference: user.themePreference || "dark",
  };
}

/**
 * Register User
 */
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body || {};

    if (!name || !String(name).trim() || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    if (!PASSWORD_RULE.test(String(password))) {
      return res.status(400).json({
        message:
          "Password must be at least 8 characters and include an uppercase letter, a lowercase letter, and a number",
      });
    }

    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Email verification token (expires in 24 hours)
    const rawVerifyToken = crypto.randomBytes(32).toString("hex");
    const verifyTokenHash = hashToken(rawVerifyToken);
    const verifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const user = await User.create({
      name: String(name).trim(),
      email: normalizedEmail,
      password: hashedPassword,
      isEmailVerified: false,
      emailVerificationTokenHash: verifyTokenHash,
      emailVerificationExpires: verifyExpires,
    });

    // Send verification email in background
    const frontendUrl = (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/+$/, "");
    const verifyUrl = `${frontendUrl}/verify-email/${encodeURIComponent(rawVerifyToken)}`;
    sendEmail({
      kind: "verify",
      to: user.email,
      verifyUrl,
    }).catch((err) => console.warn("[Auth] Verification email error:", err.message));

    const { accessToken } = await issueTokens(user, req, res);

    return res.status(201).json({
      message: "User registered successfully. Please check your email to verify your account.",
      token: accessToken,
      user: sanitizeUser(user),
    });
  } catch (error) {
    console.error("[Auth] Register error:", error.message);
    return res.status(500).json({ message: "Server Error" });
  }
};

/**
 * Login User
 */
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ message: GENERIC_AUTH_ERROR });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    let user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      const rawEmail = String(email).trim();
      if (rawEmail !== normalizedEmail) {
        user = await User.findOne({ email: rawEmail });
      }
    }

    if (!user) {
      return res.status(400).json({ message: GENERIC_AUTH_ERROR });
    }

    const isMatch = await bcrypt.compare(String(password), user.password);
    if (!isMatch) {
      return res.status(400).json({ message: GENERIC_AUTH_ERROR });
    }

    const { accessToken } = await issueTokens(user, req, res);

    return res.status(200).json({
      message: "Login Successful",
      token: accessToken,
      user: sanitizeUser(user),
    });
  } catch (error) {
    console.error("[Auth] Login error:", error.message);
    return res.status(500).json({ message: "Server Error" });
  }
};

/**
 * Refresh Session (SP-29 Rotating Refresh Token)
 */
const refreshSession = async (req, res) => {
  try {
    const rawToken = req.cookies?.refresh_token || req.body?.refreshToken;

    if (!rawToken) {
      return res.status(401).json({ message: "No refresh token provided" });
    }

    const tokenHash = hashToken(rawToken);
    const user = await User.findOne({ "refreshTokens.tokenHash": tokenHash });

    if (!user) {
      // Possible token reuse or revoked session — clear cookies for security
      if (res && typeof res.clearCookie === "function") {
        res.clearCookie("access_token", { path: "/" });
        res.clearCookie("refresh_token", { path: "/api/auth" });
      }
      return res.status(401).json({ message: "Invalid or expired refresh token" });
    }

    const matchedIndex = user.refreshTokens.findIndex((rt) => rt.tokenHash === tokenHash);
    const matchedToken = user.refreshTokens[matchedIndex];

    if (!matchedToken || matchedToken.expiresAt < new Date()) {
      // Expired token: remove it and return 401
      if (matchedIndex !== -1) user.refreshTokens.splice(matchedIndex, 1);
      await user.save();
      return res.status(401).json({ message: "Refresh token has expired. Please sign in again." });
    }

    // Token Rotation: Remove the consumed token and issue a fresh pair
    user.refreshTokens.splice(matchedIndex, 1);
    const { accessToken } = await issueTokens(user, req, res);

    return res.status(200).json({
      message: "Token refreshed successfully",
      token: accessToken,
      user: sanitizeUser(user),
    });
  } catch (error) {
    console.error("[Auth] Refresh token error:", error.message);
    return res.status(500).json({ message: "Server Error" });
  }
};

/**
 * Logout User (clears cookies and removes refresh token)
 */
const logoutUser = async (req, res) => {
  try {
    const rawToken = req.cookies?.refresh_token || req.body?.refreshToken;
    if (rawToken) {
      const tokenHash = hashToken(rawToken);
      await User.updateOne(
        { "refreshTokens.tokenHash": tokenHash },
        { $pull: { refreshTokens: { tokenHash } } }
      ).catch(() => {});
    }

    if (res && typeof res.clearCookie === "function") {
      res.clearCookie("access_token", { path: "/" });
      res.clearCookie("refresh_token", { path: "/api/auth" });
    }

    return res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("[Auth] Logout error:", error.message);
    return res.status(500).json({ message: "Server Error" });
  }
};

/**
 * Logout from all devices (SP-29: invalidates all sessions)
 */
const logoutAllDevices = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.tokenVersion = (user.tokenVersion || 0) + 1;
    user.refreshTokens = [];
    await user.save();

    if (res && typeof res.clearCookie === "function") {
      res.clearCookie("access_token", { path: "/" });
      res.clearCookie("refresh_token", { path: "/api/auth" });
    }

    return res.status(200).json({ message: "Logged out of all devices successfully" });
  } catch (error) {
    console.error("[Auth] Logout all error:", error.message);
    return res.status(500).json({ message: "Server Error" });
  }
};

/**
 * Get Current User Profile
 */
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User account no longer exists" });
    }

    return res.status(200).json({
      user: sanitizeUser(user),
      sessionsCount: (user.refreshTokens || []).length || 1,
    });
  } catch (error) {
    console.error("[Auth] GetMe error:", error.message);
    return res.status(500).json({ message: "Server Error" });
  }
};

/**
 * Verify Email (SP-30)
 */
const verifyEmail = async (req, res) => {
  try {
    const token = String(req.body?.token || req.query?.token || "").trim();
    if (!token) {
      return res.status(400).json({ message: "Verification token is required" });
    }

    const tokenHash = hashToken(token);
    const user = await User.findOne({
      emailVerificationTokenHash: tokenHash,
      emailVerificationExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ message: "Verification link is invalid or has expired" });
    }

    user.isEmailVerified = true;
    user.emailVerificationTokenHash = null;
    user.emailVerificationExpires = null;
    await user.save();

    return res.status(200).json({
      message: "Email verified successfully! You are now eligible to receive real-time email alerts.",
      user: sanitizeUser(user),
    });
  } catch (error) {
    console.error("[Auth] Verify email error:", error.message);
    return res.status(500).json({ message: "Server Error" });
  }
};

/**
 * Resend Email Verification (SP-30)
 */
const resendVerification = async (req, res) => {
  try {
    const email = req.user?.email || String(req.body?.email || "").trim().toLowerCase();
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(200).json({ message: "If an account exists, a verification link has been sent." });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ message: "Your email is already verified" });
    }

    const rawVerifyToken = crypto.randomBytes(32).toString("hex");
    user.emailVerificationTokenHash = hashToken(rawVerifyToken);
    user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save();

    const frontendUrl = (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/+$/, "");
    const verifyUrl = `${frontendUrl}/verify-email/${encodeURIComponent(rawVerifyToken)}`;
    sendEmail({
      kind: "verify",
      to: user.email,
      verifyUrl,
    }).catch(() => {});

    return res.status(200).json({ message: "Verification email sent successfully." });
  } catch (error) {
    console.error("[Auth] Resend verification error:", error.message);
    return res.status(500).json({ message: "Server Error" });
  }
};

/**
 * Change Password (SP-30)
 */
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body || {};

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current and new passwords are required" });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(String(currentPassword), user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    if (!PASSWORD_RULE.test(String(newPassword))) {
      return res.status(400).json({
        message:
          "New password must be at least 8 characters and include an uppercase letter, a lowercase letter, and a number",
      });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    // Invalidate other devices
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    user.refreshTokens = [];
    await user.save();

    // Re-issue tokens for current session
    const { accessToken } = await issueTokens(user, req, res);

    return res.status(200).json({
      message: "Password changed successfully. Other sessions have been logged out.",
      token: accessToken,
    });
  } catch (error) {
    console.error("[Auth] Change password error:", error.message);
    return res.status(500).json({ message: "Server Error" });
  }
};

/**
 * Update User Settings / Preferences (SP-30)
 */
const updateSettings = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const {
      name,
      alertSound,
      emailNotificationsEnabled,
      alertDigestFrequency,
      themePreference,
    } = req.body || {};

    if (name && String(name).trim()) {
      user.name = String(name).trim();
    }
    if (typeof alertSound === "boolean") {
      user.alertSound = alertSound;
    }
    if (typeof emailNotificationsEnabled === "boolean") {
      user.emailNotificationsEnabled = emailNotificationsEnabled;
    }
    if (["instant", "daily", "off"].includes(alertDigestFrequency)) {
      user.alertDigestFrequency = alertDigestFrequency;
    }
    if (["system", "dark", "light"].includes(themePreference)) {
      user.themePreference = themePreference;
    }

    await user.save();

    return res.status(200).json({
      message: "Settings updated successfully",
      user: sanitizeUser(user),
    });
  } catch (error) {
    console.error("[Auth] Update settings error:", error.message);
    return res.status(500).json({ message: "Server Error" });
  }
};

/**
 * Delete Account (SP-30 / DPDP Act 2023)
 */
const deleteAccount = async (req, res) => {
  try {
    const password = String(req.body?.password || "");
    if (!password) {
      return res.status(400).json({ message: "Password is required to confirm account deletion" });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect password" });
    }

    const userId = user._id;

    // Cascade delete all associated data
    await Promise.all([
      Alert.deleteMany({ user: userId }),
      Watchlist.deleteMany({ user: userId }),
      Portfolio.deleteMany({ user: userId }),
      Notification.deleteMany({ user: userId }),
      User.findByIdAndDelete(userId),
    ]);

    if (res && typeof res.clearCookie === "function") {
      res.clearCookie("access_token", { path: "/" });
      res.clearCookie("refresh_token", { path: "/api/auth" });
    }

    return res.status(200).json({
      message: "Your account and all associated personal data have been permanently deleted.",
    });
  } catch (error) {
    console.error("[Auth] Delete account error:", error.message);
    return res.status(500).json({ message: "Server Error" });
  }
};

/**
 * Export User Data (SP-30 / DPDP Act 2023)
 */
const exportUserData = async (req, res) => {
  try {
    const userId = req.user._id;

    const [userDoc, alerts, watchlist, portfolio, notifications] = await Promise.all([
      User.findById(userId).select("-password -passwordResetHash -emailVerificationTokenHash -refreshTokens"),
      Alert.find({ user: userId }),
      Watchlist.find({ user: userId }),
      Portfolio.find({ user: userId }),
      Notification.find({ user: userId }),
    ]);

    const exportPayload = {
      user: userDoc,
      alerts,
      watchlist,
      portfolio,
      notifications,
      exportedAt: new Date().toISOString(),
      formatVersion: "1.0",
      compliance: "Digital Personal Data Protection Act 2023",
    };

    res.setHeader("Content-Disposition", 'attachment; filename="stockpulse-data-export.json"');
    res.setHeader("Content-Type", "application/json");
    return res.status(200).json(exportPayload);
  } catch (error) {
    console.error("[Auth] Export user data error:", error.message);
    return res.status(500).json({ message: "Server Error" });
  }
};

/**
 * Forgot Password
 */
const forgotPassword = async (req, res) => {
  try {
    const email = String(req.body?.email || "").trim().toLowerCase();
    if (!email || !email.includes("@")) {
      return res.status(400).json({ message: "Enter the email on your account" });
    }

    const user = await User.findOne({ email });
    if (!user || !process.env.JWT_SECRET) {
      return res.status(200).json({ message: RESET_MESSAGE });
    }

    const token = jwt.sign(
      { id: user._id, purpose: "password-reset" },
      process.env.JWT_SECRET,
      { expiresIn: "30m" }
    );

    user.passwordResetHash = hashToken(token);
    user.passwordResetExpires = new Date(Date.now() + 30 * 60 * 1000);
    await user.save();

    const frontendUrl = (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/+$/, "");
    const resetUrl = `${frontendUrl}/reset-password/${encodeURIComponent(token)}`;
    sendEmail({
      kind: "reset",
      to: user.email,
      resetUrl,
    }).catch(() => {});

    return res.status(200).json({ message: RESET_MESSAGE });
  } catch (error) {
    console.error("[Auth] Forgot password error:", error.message);
    return res.status(500).json({ message: "Server Error" });
  }
};

/**
 * Reset Password
 */
const resetPassword = async (req, res) => {
  try {
    const token = String(req.body?.token || "");
    const password = String(req.body?.password || "");

    if (!token || !process.env.JWT_SECRET) {
      return res.status(400).json({ message: "Reset link is invalid or has expired" });
    }

    if (!PASSWORD_RULE.test(password)) {
      return res.status(400).json({
        message:
          "Password must be at least 8 characters and include an uppercase letter, a lowercase letter, and a number",
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return res.status(400).json({ message: "Reset link is invalid or has expired" });
    }

    if (decoded.purpose !== "password-reset" || !decoded.id) {
      return res.status(400).json({ message: "Reset link is invalid or has expired" });
    }

    const user = await User.findById(decoded.id);
    if (
      !user ||
      !user.passwordResetHash ||
      user.passwordResetHash !== hashToken(token) ||
      !user.passwordResetExpires ||
      user.passwordResetExpires.getTime() < Date.now()
    ) {
      return res.status(400).json({ message: "Reset link is invalid or has expired" });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    user.passwordResetHash = null;
    user.passwordResetExpires = null;
    // Invalidate all active sessions
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    user.refreshTokens = [];
    await user.save();

    return res.status(200).json({ message: "Password updated. You can sign in with the new password." });
  } catch (error) {
    console.error("[Auth] Reset password error:", error.message);
    return res.status(500).json({ message: "Server Error" });
  }
};

/**
 * Legacy updatePreferences (maps to updateSettings)
 */
const updatePreferences = async (req, res) => {
  return updateSettings(req, res);
};

module.exports = {
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
};
