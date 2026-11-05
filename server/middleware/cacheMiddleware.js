const { getCache, setCache } = require("../utils/memoryCache");

function cacheKey(req) {
  const url = new URL(req.originalUrl, "http://stockpulse.local");
  url.searchParams.delete("_t");
  const query = url.searchParams.toString();
  return `http:${url.pathname}${query ? `?${query}` : ""}`;
}

function cacheGet(ttlSeconds) {
  return (req, res, next) => {
    if (req.method !== "GET") return next();
    const key = cacheKey(req);
    const hit = getCache(key);
    if (hit) {
      res.set("X-Cache", "HIT");
      return res.json(hit);
    }

    res.set("X-Cache", "MISS");
    const send = res.json.bind(res);
    res.json = (body) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        setCache(key, body, ttlSeconds * 1000);
      }
      return send(body);
    };
    return next();
  };
}

module.exports = { cacheGet };
