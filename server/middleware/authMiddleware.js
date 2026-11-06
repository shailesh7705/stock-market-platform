const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  let token = null;

  // 1. Prefer httpOnly cookie
  if (req.cookies && req.cookies.access_token) {
    token = req.cookies.access_token;
  }
  // 2. Fallback to Authorization: Bearer <token>
  else if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      if (decoded.purpose === "password-reset") {
        return res.status(401).json({
          message: "Not Authorized. Please sign in.",
          expired: true,
        });
      }

      /* Attach Full User Object excluding sensitive secrets */
      req.user = await User.findById(decoded.id).select(
        "-password -passwordResetHash -refreshTokens"
      );

      if (!req.user) {
        return res.status(401).json({
          message: "User account no longer exists. Please sign in again.",
          expired: true,
        });
      }

      // Check for tokenVersion invalidation (logout-all or password reset)
      if (
        decoded.tokenVersion !== undefined &&
        req.user.tokenVersion !== undefined &&
        decoded.tokenVersion !== req.user.tokenVersion
      ) {
        return res.status(401).json({
          message: "Your session has been invalidated. Please sign in again.",
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
