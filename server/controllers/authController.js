const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const sendEmail = require("../utils/sendEmail");

const PASSWORD_RULE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
const GENERIC_AUTH_ERROR = "Invalid email or password";

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
      return res.status(400).json({
        message: "User already exists",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await User.create({
      name: String(name).trim(),
      email: normalizedEmail,
      password: hashedPassword,
    });

    return res.status(201).json({
      message: "User registered successfully",
    });
  } catch (error) {
    console.error("[Auth] Register error:", error.message);
    return res.status(500).json({
      message: "Server Error",
    });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ message: GENERIC_AUTH_ERROR });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    let user = await User.findOne({ email: normalizedEmail });

    // Older accounts may have been stored before email normalization.
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

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      message: "Login Successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        alertSound: user.alertSound !== false,
      },
    });
  } catch (error) {
    console.error("[Auth] Login error:", error.message);
    return res.status(500).json({
      message: "Server Error",
    });
  }
};

const RESET_MESSAGE = "If an account exists for that email, a reset link is on the way.";

const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

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
      { expiresIn: "20m" }
    );

    user.passwordResetHash = hashToken(token);
    user.passwordResetExpires = new Date(Date.now() + 20 * 60 * 1000);
    await user.save();

    const frontendUrl = (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/+$/, "");
    const resetUrl = `${frontendUrl}/reset-password/${encodeURIComponent(token)}`;
    const emailResult = await sendEmail({
      kind: "reset",
      to: user.email,
      resetUrl,
    });

    if (!emailResult?.success) {
      console.warn("[Auth] Password reset email was not delivered:", emailResult?.error);
    }

    return res.status(200).json({ message: RESET_MESSAGE });
  } catch (error) {
    console.error("[Auth] Forgot password error:", error.message);
    return res.status(500).json({ message: "Server Error" });
  }
};

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
    await user.save();

    return res.status(200).json({ message: "Password updated. You can sign in with the new password." });
  } catch (error) {
    console.error("[Auth] Reset password error:", error.message);
    return res.status(500).json({ message: "Server Error" });
  }
};

const updatePreferences = async (req, res) => {
  try {
    if (typeof req.body?.alertSound !== "boolean") {
      return res.status(400).json({ message: "alertSound must be true or false" });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User account no longer exists" });
    }

    user.alertSound = req.body.alertSound;
    await user.save();

    return res.status(200).json({
      alertSound: user.alertSound,
    });
  } catch (error) {
    console.error("[Auth] Preference error:", error.message);
    return res.status(500).json({ message: "Server Error" });
  }
};

module.exports = {
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword,
  updatePreferences,
};
