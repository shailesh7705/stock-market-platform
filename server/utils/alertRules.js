const QUOTE_CHUNK = 50;

function isConditionMet(condition, targetPrice, currentPrice) {
  const target = Number(targetPrice);
  const price = Number(currentPrice);
  if (!Number.isFinite(target) || target <= 0 || !Number.isFinite(price) || price <= 0) return false;
  if (condition === "above") return price >= target;
  if (condition === "below") return price <= target;
  return false;
}

function chunk(items, size = QUOTE_CHUNK) {
  const groups = [];
  for (let index = 0; index < items.length; index += size) {
    groups.push(items.slice(index, index + size));
  }
  return groups;
}

function armingDecision({ symbol, condition, targetPrice, currentPrice }) {
  const price = Number(currentPrice);
  if (!Number.isFinite(price) || price <= 0) {
    return {
      ok: false,
      status: 503,
      body: {
        message: "Live price is unavailable right now. Try again in a moment.",
      },
    };
  }

  if (condition !== "above" && condition !== "below") {
    return {
      ok: false,
      status: 400,
      body: {
        message: "Choose whether the price should rise above or fall below the target.",
      },
    };
  }

  if (!isConditionMet(condition, targetPrice, price)) {
    return { ok: true, currentPrice: price };
  }

  const suggestedCondition = condition === "above" ? "below" : "above";
  const relation = condition === "above" ? "at or above" : "at or below";
  const formattedTarget = Number(targetPrice).toLocaleString("en-IN");
  const formattedPrice = price.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return {
    ok: false,
    status: 409,
    body: {
      code: "CONDITION_ALREADY_MET",
      message: `${symbol} is already ${relation} ₹${formattedTarget} (now ₹${formattedPrice}). Switch the condition or pick a different target.`,
      currentPrice: price,
      condition,
      suggestedCondition,
    },
  };
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// One attempt plus two retries. A hung send is cut off by timeoutMs.
async function deliverAlertEmail(send, payload, options = {}) {
  const attempts = options.attempts ?? 3;
  const timeoutMs = options.timeoutMs ?? 20000;
  const wait = options.sleep ?? sleep;
  const retryDelayMs = options.retryDelayMs ?? 500;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const result = await Promise.race([
        Promise.resolve().then(() => send(payload)),
        new Promise((_, reject) => {
          setTimeout(() => reject(new Error("Email timed out")), timeoutMs);
        }),
      ]);
      if (result?.success) return { emailStatus: "sent" };
    } catch {
      // Retry below. The message stays on the server logs at the call site.
    }
    if (attempt < attempts) await wait(retryDelayMs * attempt);
  }

  return { emailStatus: "failed" };
}

module.exports = {
  QUOTE_CHUNK,
  isConditionMet,
  chunk,
  armingDecision,
  deliverAlertEmail,
};
