// server/routes/screenerRoutes.js
const express = require("express");
const {
  queryScreener,
  getPresets,
  getSavedScreens,
  createSavedScreen,
  deleteSavedScreen,
} = require("../controllers/screenerController");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/query", queryScreener);
router.get("/presets", getPresets);
router.get("/saved", protect, getSavedScreens);
router.post("/saved", protect, createSavedScreen);
router.delete("/saved/:id", protect, deleteSavedScreen);

module.exports = router;
