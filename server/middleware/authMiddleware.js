const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      /* Attach Full User Object */
      req.user = await User.findById(decoded.id).select("-password");

      if (!req.user) {
        return res.status(401).json({
          message: "User account no longer exists. Please sign in again.",
          expired: true,
        });
      }

      return next();
    } catch (error) {
      const isExpired = error.name === "TokenExpiredError";
      return res.status(401).json({
        message: isExpired
          ? "Your session has expired. Please sign in again."
          : "Not Authorized. Please sign in.",
        expired: true,
      });
    }
  }

  return res.status(401).json({
    message: "Please sign in to access this feature.",
    expired: true,
  });
};

module.exports = protect;
