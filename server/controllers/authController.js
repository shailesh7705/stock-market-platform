const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

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
      },
    });
  } catch (error) {
    console.error("[Auth] Login error:", error.message);
    return res.status(500).json({
      message: "Server Error",
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
};
