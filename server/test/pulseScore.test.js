const test = require("node:test");
const assert = require("node:assert/strict");
const { calculatePulseScore } = require("../utils/pulseScore");
const { calculateForecast } = require("../utils/forecastEngine");

test("null fundamentals still produce a score between 0 and 100", () => {
  const score = calculatePulseScore({}, null);
  assert.equal(typeof score.score, "number");
  assert.ok(score.score >= 0 && score.score <= 100);
  assert.ok(score.pillars.pillar1_moat);
  assert.ok(score.pillars.pillar3_valuation);
});

test("a negative P/E is not treated as a cheap stock", () => {
  const score = calculatePulseScore(
    { defaultKeyStatistics: { trailingPE: -12 }, assetProfile: { sector: "Technology" } },
    100
  );
  assert.equal(score.pillars.pillar3_valuation.details.sectorRelativePE.stockPE, null);
  assert.ok(score.score >= 0 && score.score <= 100);
});

test("forecast horizons are counted from the current year", () => {
  const year = new Date().getFullYear();
  const forecast = calculateForecast(
    { financialData: { currentPrice: 100, returnOnEquity: 0.15 } },
    100,
    { score: 70, grade: "B" }
  );
  assert.match(forecast.oneYear.timeframe, new RegExp(String(year + 1)));
  assert.match(forecast.threeYear.timeframe, new RegExp(String(year + 3)));
  assert.match(forecast.fiveYear.timeframe, new RegExp(String(year + 5)));
});
