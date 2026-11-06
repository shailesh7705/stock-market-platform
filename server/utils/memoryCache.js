const NodeCache = require("node-cache");

const store = new NodeCache({
  stdTTL: 60,
  checkperiod: 60,
  maxKeys: 1000,
  useClones: false,
  deleteOnExpire: true,
});

function getCache(key) {
  const value = store.get(key);
  return value === undefined ? null : value;
}

function setCache(key, data, ttlMs = 60000) {
  const ttlSeconds = Math.max(1, Math.round(Number(ttlMs) / 1000));
  store.set(key, data, ttlSeconds);
}

// Keep the last good payload after the fresh window so a failed refresh can say it is delayed.
function remember(key, data, freshMs = 60000, keepMs = 6 * 60 * 60 * 1000) {
  const entry = {
    data,
    asOf: new Date().toISOString(),
    freshUntil: Date.now() + freshMs,
  };
  store.set(key, entry, Math.max(1, Math.round(keepMs / 1000)));
  return entry;
}

function recall(key) {
  const entry = store.get(key);
  if (!entry || typeof entry.freshUntil !== "number") return null;
  return {
    data: entry.data,
    asOf: entry.asOf,
    stale: Date.now() >= entry.freshUntil,
  };
}

module.exports = {
  getCache,
  setCache,
  remember,
  recall,
  store,
};
