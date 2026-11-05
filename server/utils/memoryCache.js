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

module.exports = {
  getCache,
  setCache,
  store,
};
