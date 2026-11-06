const test = require("node:test");
const assert = require("node:assert/strict");
const { isConditionMet, chunk, armingDecision, deliverAlertEmail, QUOTE_CHUNK } = require("../utils/alertRules");
const { alerts } = require("../validation/schemas");

test("above is met at the target and above it", () => {
  assert.equal(isConditionMet("above", 100, 100), true);
  assert.equal(isConditionMet("above", 100, 100.01), true);
  assert.equal(isConditionMet("above", 100, 99.99), false);
});

test("below is met at the target and under it", () => {
  assert.equal(isConditionMet("below", 100, 100), true);
  assert.equal(isConditionMet("below", 100, 99), true);
  assert.equal(isConditionMet("below", 100, 101), false);
});

test("a missing price never counts as met", () => {
  assert.equal(isConditionMet("above", 100, null), false);
  assert.equal(isConditionMet("below", 100, 0), false);
});

test("creating an alert whose target is already met is rejected", () => {
  const above = armingDecision({
    symbol: "RELIANCE.NS",
    condition: "above",
    targetPrice: 1000,
    currentPrice: 2500,
  });
  assert.equal(above.ok, false);
  assert.equal(above.status, 409);
  assert.equal(above.body.code, "CONDITION_ALREADY_MET");
  assert.equal(above.body.suggestedCondition, "below");

  const below = armingDecision({
    symbol: "TCS.NS",
    condition: "below",
    targetPrice: 4000,
    currentPrice: 3900,
  });
  assert.equal(below.status, 409);
  assert.equal(below.body.suggestedCondition, "above");
});

test("a target that is still ahead is accepted", () => {
  const decision = armingDecision({
    symbol: "INFY.NS",
    condition: "above",
    targetPrice: 2000,
    currentPrice: 1500,
  });
  assert.equal(decision.ok, true);
  assert.equal(decision.currentPrice, 1500);
});

test("a missing live price rejects the alert", () => {
  const decision = armingDecision({
    symbol: "INFY.NS",
    condition: "above",
    targetPrice: 2000,
    currentPrice: null,
  });
  assert.equal(decision.status, 503);
});

test("create requires an explicit condition", () => {
  const missing = alerts.create.body.safeParse({ symbol: "RELIANCE", targetPrice: 10 });
  assert.equal(missing.success, false);

  const parsed = alerts.create.body.safeParse({
    symbol: "RELIANCE",
    targetPrice: 10,
    condition: "above",
  });
  assert.equal(parsed.success, true);
  assert.equal(parsed.data.symbol, "RELIANCE.NS");
  assert.equal(parsed.data.condition, "above");
});

test("quotes are requested in batches of 50", () => {
  const symbols = Array.from({ length: 120 }, (_, index) => `S${index}.NS`);
  const groups = chunk(symbols);
  assert.equal(QUOTE_CHUNK, 50);
  assert.deepEqual(groups.map((group) => group.length), [50, 50, 20]);
});

test("email delivery retries twice and then succeeds", async () => {
  let calls = 0;
  const result = await deliverAlertEmail(
    async () => {
      calls += 1;
      if (calls < 3) return { success: false, error: "mailbox busy" };
      return { success: true };
    },
    { to: "person@example.com" },
    { retryDelayMs: 0, timeoutMs: 50 }
  );
  assert.equal(result.emailStatus, "sent");
  assert.equal(calls, 3);
});

test("email delivery is failed after the timeout retries are exhausted", async () => {
  let calls = 0;
  const result = await deliverAlertEmail(
    () => {
      calls += 1;
      return new Promise(() => {});
    },
    { to: "person@example.com" },
    { attempts: 2, retryDelayMs: 0, timeoutMs: 20 }
  );
  assert.equal(result.emailStatus, "failed");
  assert.equal(calls, 2);
});
