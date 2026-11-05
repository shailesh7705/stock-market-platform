function toPercent(raw) {
  if (raw === null || raw === undefined || raw === "" || Number.isNaN(Number(raw))) return null;
  const num = Number(raw);
  if (!Number.isFinite(num)) return null;
  return Math.abs(num) <= 3 ? Number((num * 100).toFixed(2)) : Number(num.toFixed(2));
}

function debtToEquityRatio(raw) {
  if (raw === null || raw === undefined || Number.isNaN(Number(raw))) return null;
  const num = Number(raw);
  if (!Number.isFinite(num)) return null;
  const ratio = num > 5 ? num / 100 : num;
  return Number(ratio.toFixed(2));
}

function sma(closes, length) {
  if (!Array.isArray(closes) || closes.length < length) return null;
  const slice = closes.slice(-length);
  const total = slice.reduce((sum, value) => sum + value, 0);
  return total / length;
}

function rsi(closes, period = 14) {
  if (!Array.isArray(closes) || closes.length < period + 1) return null;
  let gain = 0;
  let loss = 0;
  for (let i = 1; i <= period; i += 1) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) gain += diff;
    else loss -= diff;
  }
  let avgGain = gain / period;
  let avgLoss = loss / period;
  for (let i = period + 1; i < closes.length; i += 1) {
    const diff = closes[i] - closes[i - 1];
    avgGain = (avgGain * (period - 1) + Math.max(diff, 0)) / period;
    avgLoss = (avgLoss * (period - 1) + Math.max(-diff, 0)) / period;
  }
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return Number((100 - 100 / (1 + rs)).toFixed(1));
}

function cagr(start, end, years) {
  if (!start || !end || start <= 0 || end <= 0 || !years) return null;
  return Number(((Math.pow(end / start, 1 / years) - 1) * 100).toFixed(1));
}

async function mapPool(items, limit, worker) {
  const results = new Array(items.length);
  let cursor = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await worker(items[index], index);
    }
  });
  await Promise.all(runners);
  return results;
}

module.exports = {
  toPercent,
  debtToEquityRatio,
  sma,
  rsi,
  cagr,
  mapPool,
};
