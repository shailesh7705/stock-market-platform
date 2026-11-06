const test = require("node:test");
const assert = require("node:assert/strict");
const { tryAcquire, renewLease, releaseLease } = require("../utils/jobLease");

function memoryJobs() {
  const docs = new Map();
  return {
    async updateOne(filter, update, options = {}) {
      let doc = docs.get(filter._id);
      if (!doc && options.upsert) {
        doc = { _id: filter._id, ...(update.$setOnInsert || {}) };
        docs.set(filter._id, doc);
        return { matchedCount: 0, upsertedCount: 1 };
      }
      if (!doc) return { matchedCount: 0 };
      if (filter.owner && doc.owner !== filter.owner) return { matchedCount: 0 };
      Object.assign(doc, update.$set || {});
      return { matchedCount: 1 };
    },
    async findOneAndUpdate(filter, update) {
      const doc = docs.get(filter._id);
      if (!doc) return null;
      const locked = new Date(doc.lockedUntil);
      if (!(locked <= filter.lockedUntil.$lte)) return null;
      Object.assign(doc, update.$set || {});
      return { ...doc };
    },
  };
}

test("only one owner holds the alert lease at a time", async () => {
  const jobs = memoryJobs();
  const now = new Date("2026-11-06T04:00:00Z");
  const later = new Date("2026-11-06T04:00:30Z");

  assert.equal(await tryAcquire(jobs, { key: "alert-check", owner: "a", now, ttlMs: 60000 }), true);
  assert.equal(await tryAcquire(jobs, { key: "alert-check", owner: "b", now: later, ttlMs: 60000 }), false);
  assert.equal(await renewLease(jobs, { key: "alert-check", owner: "b", now: later, ttlMs: 60000 }), false);
  assert.equal(await renewLease(jobs, { key: "alert-check", owner: "a", now: later, ttlMs: 60000 }), true);

  await releaseLease(jobs, { key: "alert-check", owner: "a", now: later });
  assert.equal(await tryAcquire(jobs, { key: "alert-check", owner: "b", now: later, ttlMs: 60000 }), true);
});
