const mongoose = require("mongoose");
const Portfolio = require("../models/Portfolio");
const { fetchSingleStockDetails } = require("./stockController");

function round2(value) {
  return Number(Number(value || 0).toFixed(2));
}

function gradeFromScore(score) {
  if (score === null || score === undefined || Number.isNaN(score)) {
    return { grade: null, gradeLabel: null };
  }
  if (score >= 85) {
    return { grade: "A+", gradeLabel: "Elite Long-Term Compounder (Coffee Can Grade)" };
  }
  if (score >= 70) {
    return { grade: "A", gradeLabel: "Strong Fundamental Hold" };
  }
  if (score >= 52) {
    return { grade: "B", gradeLabel: "Moderate / Accumulate on Dips" };
  }
  if (score >= 38) {
    return { grade: "C", gradeLabel: "Selective / Cyclical" };
  }
  return { grade: "D", gradeLabel: "High Risk / Poor Long-Term Compounder" };
}

function normalizeSymbol(raw) {
  if (!raw || typeof raw !== "string") return "";
  let symbol = raw.trim().toUpperCase();
  if (!symbol) return "";
  if (!symbol.includes(".")) symbol = `${symbol}.NS`;
  return symbol;
}

function parsePositive(value, label) {
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0.01) {
    return { error: `${label} must be at least 0.01` };
  }
  return { value: num };
}

async function enrichHolding(doc) {
  const holding = typeof doc.toObject === "function" ? doc.toObject() : { ...doc };
  let details = null;

  try {
    details = await fetchSingleStockDetails(holding.symbol);
  } catch (err) {
    console.warn(`[Portfolio] Market data failed for ${holding.symbol}:`, err.message);
  }

  const quantity = Number(holding.quantity) || 0;
  const avgBuyPrice = Number(holding.avgBuyPrice) || 0;
  const investedValue = quantity * avgBuyPrice;
  const livePrice = Number(details?.price) > 0 ? Number(details.price) : null;
  const changeAmount = Number(details?.changeAmount || 0);
  const previousClose = livePrice !== null ? livePrice - changeAmount : null;

  const currentValue = livePrice !== null ? quantity * livePrice : null;
  const unrealizedPnL = currentValue !== null ? currentValue - investedValue : null;
  const unrealizedPnLPct =
    unrealizedPnL !== null && investedValue > 0 ? (unrealizedPnL / investedValue) * 100 : null;
  const dayChangeValue =
    livePrice !== null && previousClose !== null ? quantity * (livePrice - previousClose) : null;

  const pulse = details?.pulseScore || null;

  return {
    ...holding,
    companyName: holding.companyName || details?.name || holding.symbol,
    livePrice: livePrice !== null ? round2(livePrice) : null,
    previousClose: previousClose !== null ? round2(previousClose) : null,
    dayChangePercent: details?.change ?? null,
    investedValue: round2(investedValue),
    currentValue: currentValue !== null ? round2(currentValue) : null,
    unrealizedPnL: unrealizedPnL !== null ? round2(unrealizedPnL) : null,
    unrealizedPnLPct: unrealizedPnLPct !== null ? round2(unrealizedPnLPct) : null,
    dayChangeValue: dayChangeValue !== null ? round2(dayChangeValue) : null,
    pulseScore: pulse?.score ?? null,
    pulseGrade: pulse?.grade ?? null,
    pulseGradeLabel: pulse?.gradeLabel ?? null,
    quoteAvailable: livePrice !== null,
  };
}

function buildSummary(holdings) {
  const totalInvested = holdings.reduce((sum, h) => sum + (h.investedValue || 0), 0);
  const quoted = holdings.filter((h) => h.quoteAvailable && h.currentValue !== null);
  const quotedInvested = quoted.reduce((sum, h) => sum + (h.investedValue || 0), 0);
  const totalCurrentValue = quoted.reduce((sum, h) => sum + h.currentValue, 0);
  const totalPnL = totalCurrentValue - quotedInvested;
  const totalPnLPct = quotedInvested > 0 ? (totalPnL / quotedInvested) * 100 : 0;
  const todayPnL = quoted.reduce((sum, h) => sum + (h.dayChangeValue || 0), 0);

  let weighted = 0;
  let weight = 0;
  for (const holding of holdings) {
    if (holding.pulseScore === null || holding.pulseScore === undefined) continue;
    const basis = holding.currentValue > 0 ? holding.currentValue : holding.investedValue;
    if (!basis) continue;
    weighted += holding.pulseScore * basis;
    weight += basis;
  }

  const portfolioPulseScore = weight > 0 ? Number((weighted / weight).toFixed(1)) : null;
  const grade = gradeFromScore(portfolioPulseScore);

  return {
    totalInvested: round2(totalInvested),
    totalCurrentValue: round2(totalCurrentValue),
    totalPnL: round2(totalPnL),
    totalPnLPct: round2(totalPnLPct),
    todayPnL: round2(todayPnL),
    portfolioPulseScore,
    portfolioGrade: grade.grade,
    portfolioGradeLabel: grade.gradeLabel,
    holdingsCount: holdings.length,
    quotesPartial: quoted.length !== holdings.length,
  };
}

async function portfolioPayload(userId) {
  const docs = await Portfolio.find({ user: userId }).sort({ createdAt: -1 });
  const holdings = await Promise.all(docs.map((doc) => enrichHolding(doc)));
  return {
    holdings,
    summary: buildSummary(holdings),
  };
}

const getPortfolio = async (req, res) => {
  try {
    const payload = await portfolioPayload(req.user._id);
    return res.json(payload);
  } catch (error) {
    console.error("[Portfolio] Fetch error:", error.message);
    return res.status(500).json({ message: "Failed to load portfolio" });
  }
};

const addHolding = async (req, res) => {
  try {
    const { companyName, buyDate, notes, broker } = req.body || {};
    const symbol = normalizeSymbol(req.body?.symbol);

    if (!symbol) {
      return res.status(400).json({ message: "Symbol is required" });
    }

    const qty = parsePositive(req.body?.quantity, "Quantity");
    if (qty.error) return res.status(400).json({ message: qty.error });

    const price = parsePositive(req.body?.avgBuyPrice, "Average buy price");
    if (price.error) return res.status(400).json({ message: price.error });

    const existing = await Portfolio.findOne({ user: req.user._id, symbol });

    if (existing) {
      const oldQty = Number(existing.quantity);
      const oldAvg = Number(existing.avgBuyPrice);
      const addQty = qty.value;
      const addPrice = price.value;
      const newAvgPrice = (oldQty * oldAvg + addQty * addPrice) / (oldQty + addQty);

      existing.quantity = Number((oldQty + addQty).toFixed(4));
      existing.avgBuyPrice = Number(newAvgPrice.toFixed(4));
      if (companyName) existing.companyName = String(companyName).trim();
      if (notes !== undefined) existing.notes = String(notes || "").trim();
      if (buyDate) existing.buyDate = new Date(buyDate);
      if (broker) existing.broker = String(broker).trim();
      await existing.save();

      const holding = await enrichHolding(existing);
      return res.status(200).json({ holding, merged: true });
    }

    const created = await Portfolio.create({
      user: req.user._id,
      symbol,
      companyName: companyName ? String(companyName).trim() : symbol.replace(".NS", "").replace(".BO", ""),
      quantity: qty.value,
      avgBuyPrice: price.value,
      buyDate: buyDate ? new Date(buyDate) : new Date(),
      notes: notes ? String(notes).trim() : "",
      broker: broker ? String(broker).trim() : "Manual",
    });

    const holding = await enrichHolding(created);
    return res.status(201).json({ holding, merged: false });
  } catch (error) {
    console.error("[Portfolio] Add error:", error.message);
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    return res.status(500).json({ message: "Failed to add holding" });
  }
};

const updateHolding = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid holding id" });
    }

    const holding = await Portfolio.findOne({ _id: id, user: req.user._id });
    if (!holding) {
      return res.status(404).json({ message: "Holding not found" });
    }

    const { quantity, avgBuyPrice, notes } = req.body || {};
    let changed = false;

    if (quantity !== undefined) {
      const qty = parsePositive(quantity, "Quantity");
      if (qty.error) return res.status(400).json({ message: qty.error });
      holding.quantity = qty.value;
      changed = true;
    }

    if (avgBuyPrice !== undefined) {
      const price = parsePositive(avgBuyPrice, "Average buy price");
      if (price.error) return res.status(400).json({ message: price.error });
      holding.avgBuyPrice = price.value;
      changed = true;
    }

    if (notes !== undefined) {
      holding.notes = String(notes || "").trim();
      changed = true;
    }

    if (!changed) {
      return res.status(400).json({ message: "Nothing to update" });
    }

    await holding.save();
    const enriched = await enrichHolding(holding);
    return res.json({ holding: enriched });
  } catch (error) {
    console.error("[Portfolio] Update error:", error.message);
    return res.status(500).json({ message: "Failed to update holding" });
  }
};

const deleteHolding = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid holding id" });
    }

    const deleted = await Portfolio.findOneAndDelete({ _id: id, user: req.user._id });
    if (!deleted) {
      return res.status(404).json({ message: "Holding not found" });
    }

    return res.json({ message: "Holding removed", id: deleted._id });
  } catch (error) {
    console.error("[Portfolio] Delete error:", error.message);
    return res.status(500).json({ message: "Failed to remove holding" });
  }
};

module.exports = {
  getPortfolio,
  addHolding,
  updateHolding,
  deleteHolding,
};
