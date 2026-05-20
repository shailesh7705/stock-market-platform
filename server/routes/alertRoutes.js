const express = require("express");

const {

  createAlert,
  getAlerts,
  deleteAlert

} = require("../controllers/alertController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

/* Create Alert */
router.post(

  "/",

  protect,

  createAlert

);

/* Get Alerts */
router.get(

  "/",

  protect,

  getAlerts

);

/* Delete Alert */
router.delete(

  "/:id",

  protect,

  deleteAlert

);

module.exports = router;