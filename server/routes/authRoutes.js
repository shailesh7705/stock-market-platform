const express = require("express");
const protect = require("../middleware/authMiddleware");
const { authLimiter } = require("../middleware/rateLimiters");

const {
  registerUser,
  loginUser
} = require("../controllers/authController");

const router = express.Router();

router.post("/register", authLimiter, registerUser);

router.post("/login", authLimiter, loginUser);
router.get("/profile", protect, (req, res) => {

  res.json({
    message: "Protected Profile Data",
    user: req.user
  });

});

module.exports = router;