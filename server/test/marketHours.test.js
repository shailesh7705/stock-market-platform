const test = require("node:test");
const assert = require("node:assert/strict");
const { getMarketSession, isMarketOpen } = require("../utils/marketHours");

const at = (iso) => new Date(iso);

test("the NSE session is open from 09:15 until 15:30 IST", () => {
  assert.equal(isMarketOpen(at("2026-11-06T03:44:00Z")), false);
  assert.equal(getMarketSession(at("2026-11-06T03:44:00Z")).phase, "pre");

  assert.equal(isMarketOpen(at("2026-11-06T03:45:00Z")), true);
  assert.equal(isMarketOpen(at("2026-11-06T09:59:00Z")), true);

  const close = getMarketSession(at("2026-11-06T10:00:00Z"));
  assert.equal(close.isOpen, false);
  assert.equal(close.phase, "post");
});

test("alerts stay quiet on weekends and NSE holidays", () => {
  assert.equal(isMarketOpen(at("2026-11-08T05:00:00Z")), false);
  assert.equal(getMarketSession(at("2026-11-08T05:00:00Z")).tradingDay, false);

  const holiday = getMarketSession(at("2026-11-10T05:00:00Z"));
  assert.equal(holiday.holiday, true);
  assert.equal(holiday.isOpen, false);
});
