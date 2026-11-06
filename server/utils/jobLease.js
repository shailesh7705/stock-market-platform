const DEFAULT_TTL_MS = 3 * 60 * 1000;

function unwrap(result) {
  if (!result) return null;
  if (Object.prototype.hasOwnProperty.call(result, "value")) return result.value;
  return result;
}

async function tryAcquire(collection, { key, owner, now = new Date(), ttlMs = DEFAULT_TTL_MS }) {
  const until = new Date(now.getTime() + ttlMs);
  await collection.updateOne(
    { _id: key },
    { $setOnInsert: { lockedUntil: new Date(0), owner: "" } },
    { upsert: true }
  );

  const acquired = unwrap(
    await collection.findOneAndUpdate(
      { _id: key, lockedUntil: { $lte: now } },
      { $set: { lockedUntil: until, owner } },
      { new: true, returnDocument: "after" }
    )
  );

  return Boolean(acquired && acquired.owner === owner);
}

async function renewLease(collection, { key, owner, now = new Date(), ttlMs = DEFAULT_TTL_MS }) {
  const until = new Date(now.getTime() + ttlMs);
  const result = await collection.updateOne(
    { _id: key, owner },
    { $set: { lockedUntil: until } }
  );
  return (result.matchedCount ?? result.n ?? 0) > 0;
}

async function releaseLease(collection, { key, owner, now = new Date() }) {
  await collection.updateOne({ _id: key, owner }, { $set: { lockedUntil: now } });
}

module.exports = {
  DEFAULT_TTL_MS,
  tryAcquire,
  renewLease,
  releaseLease,
};
