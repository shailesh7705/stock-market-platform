const express = require("express");
const protect = require("../middleware/authMiddleware");

const {
  registerUser,
  loginUser
} = require("../controllers/authController");

const router = express.Router();

router.post("/register", registerUser);

router.post("/login", loginUser);
router.get("/profile", protect, (req, res) => {

  res.json({
    message: "Protected Profile Data",
    user: req.user
  });

});

module.exports = router;