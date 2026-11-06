const express = require("express");
const { getMarketSession, holidayCalendar } = require("../utils/marketHours");

const router = express.Router();

router.get("/calendar", (req, res) => {
  res.json({
    exchange: "NSE",
    timezone: "Asia/Kolkata",
    coverageThrough: holidayCalendar.coverageThrough,
    holidays: holidayCalendar.holidays,
    session: getMarketSession(),
  });
});

module.exports = router;
