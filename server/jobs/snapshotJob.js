// server/jobs/snapshotJob.js
const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");
const StockSnapshot = require("../models/StockSnapshot");
const Job = require("../models/Job");
const { tryAcquire, releaseLease } = require("../utils/jobLease");
const yahooGateway = require("../services/yahooGateway");
const { isMarketOpen } = require("../utils/marketHours");

const LEASE_KEY = "stock-snapshot-job";
const OWNER_ID = `snapshot-${process.pid}-${Math.random().toString(36).slice(2, 8)}`;

const jobState = {
  lastRunAt: null,
  durationMs: 0,
  snapshotsUpdated: 0,
  status: "idle",
  lastError: null,
};

let cachedSymbols = null;
function getUniverseSymbols() {
  if (cachedSymbols) return cachedSymbols;
  try {
    const stocksPath = path.join(__dirname, "../data/stocks.json");
    if (fs.existsSync(stocksPath)) {
      const data = JSON.parse(fs.readFileSync(stocksPath, "utf-8"));
      cachedSymbols = data.map((s) => (s.symbol.endsWith(".NS") ? s.symbol : `${s.symbol}.NS`));
      return cachedSymbols;
    }
  } catch (err) {
    console.warn("[SnapshotJob] Could not read stocks.json:", err.message);
  }
  return [];
}

async function runSnapshotJob({ limit = 100 } = {}) {
  if (mongoose.connection.readyState !== 1) {
    return { ok: false, reason: "Database not connected" };
  }

  const acquired = await tryAcquire(Job.collection, {
    key: LEASE_KEY,
    owner: OWNER_ID,
    ttlMs: 10 * 60 * 1000,
  }).catch(() => false);

  if (!acquired) {
    return { ok: false, reason: "Lease held by another worker" };
  }

  const startTime = Date.now();
  jobState.status = "running";
  jobState.lastRunAt = new Date();

  try {
    const symbols = getUniverseSymbols().slice(0, limit);
    if (symbols.length === 0) {
      jobState.status = "idle";
      return { ok: true, updated: 0 };
    }

    const quotes = await yahooGateway.getQuotes(symbols, 10000);
    const operations = [];

    for (const q of quotes) {
      if (!q || !q.symbol || !q.regularMarketPrice) continue;
      const cleanSym = q.symbol.toUpperCase();
      const changePct = Number((q.regularMarketChangePercent || 0).toFixed(2));
      const change = Number((q.regularMarketChange || 0).toFixed(2));
      const price = Number(q.regularMarketPrice.toFixed(2));

      operations.push({
        updateOne: {
          filter: { symbol: cleanSym },
          update: {
            $set: {
              symbol: cleanSym,
              companyName: q.longName || q.shortName || cleanSym.replace(".NS", ""),
              price,
              change,
              changePercent: changePct,
              dayHigh: q.regularMarketDayHigh || null,
              dayLow: q.regularMarketDayLow || null,
              volume: q.regularMarketVolume || 0,
              marketCap: q.marketCap || 0,
              pe: q.trailingPE ? Number(q.trailingPE.toFixed(2)) : null,
              dividendYield: q.dividendYield ? Number((q.dividendYield * 100).toFixed(2)) : null,
              technicals: {
                high52: q.fiftyTwoWeekHigh || null,
                low52: q.fiftyTwoWeekLow || null,
              },
              isStale: false,
              lastUpdated: new Date(),
            },
          },
          upsert: true,
        },
      });
    }

    if (operations.length > 0) {
      await StockSnapshot.bulkWrite(operations, { ordered: false });
    }

    jobState.status = "success";
    jobState.durationMs = Date.now() - startTime;
    jobState.snapshotsUpdated = operations.length;
    jobState.lastError = null;

    return { ok: true, updated: operations.length, durationMs: jobState.durationMs };
  } catch (err) {
    jobState.status = "error";
    jobState.lastError = err.message;
    jobState.durationMs = Date.now() - startTime;
    console.error("[SnapshotJob] Execution error:", err.message);
    return { ok: false, error: err.message };
  } finally {
    await releaseLease(Job.collection, { key: LEASE_KEY, owner: OWNER_ID }).catch(() => {});
  }
}

let intervalTimer = null;
function startSnapshotJob() {
  if (intervalTimer) return;
  const initialTimeout = setTimeout(() => {
    runSnapshotJob({ limit: 50 }).catch(() => {});
  }, 10000);
  if (initialTimeout.unref) initialTimeout.unref();

  intervalTimer = setInterval(() => {
    if (isMarketOpen()) {
      runSnapshotJob({ limit: 100 }).catch(() => {});
    }
  }, 15 * 60 * 1000);
  if (intervalTimer.unref) intervalTimer.unref();
}

function getSnapshotJobStatus() {
  return { ...jobState };
}

module.exports = {
  runSnapshotJob,
  startSnapshotJob,
  getSnapshotJobStatus,
};
