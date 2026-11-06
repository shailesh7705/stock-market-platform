const express = require("express");
const protect = require("../middleware/authMiddleware");
const { authLimiter } = require("../middleware/rateLimiters");

const {
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword,
  updatePreferences,
} = require("../controllers/authController");
const validate = require("../middleware/validate");
const { auth } = require("../validation/schemas");

const router = express.Router();

router.post("/register", authLimiter, validate(auth.register), registerUser);

router.post("/login", authLimiter, validate(auth.login), loginUser);
router.post("/forgot-password", authLimiter, validate(auth.forgot), forgotPassword);
router.post("/reset-password", authLimiter, validate(auth.reset), resetPassword);
router.patch("/preferences", protect, validate(auth.preferences), updatePreferences);
router.get("/profile", protect, (req, res) => {

  res.json({
    message: "Protected Profile Data",
    user: req.user
  });

});

module.exports = router;