// server/controllers/watchlistController.js
const Watchlist = require("../models/Watchlist");
const User = require("../models/User");
const YahooFinance = require("yahoo-finance2").default;
const yahooFinance = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

const YF_OPTS = { validateResult: false };
const { sparklinesFor } = require("../utils/sparklines");
const DEFAULT_LIST = "My Watchlist";

function normalizeListName(name) {
  const cleaned = String(name || DEFAULT_LIST).trim().replace(/[\\/]/g, "").slice(0, 40);
  return cleaned || DEFAULT_LIST;
}

function csvCell(value) {
  const text = String(value ?? "");
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

async function backfillLists(userId) {
  await Watchlist.updateMany(
    {
      user: userId,
      $or: [{ listName: { $exists: false } }, { listName: null }, { listName: "" }],
    },
    { $set: { listName: DEFAULT_LIST } }
  );
}

// Safe quote fetch helper
const safeQuote = async (symbols) => {
  try {
    const result = await Promise.race([
      yahooFinance.quote(symbols, {}, YF_OPTS),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Timeout")), 8000)
      ),
    ]);
    return result;
  } catch (err) {
    console.warn("[Watchlist] Quote error:", err.message);
    return null;
  }
};

/* ── Add To Watchlist ──────────────────────────────────────────────────────── */
const addToWatchlist = async (req, res) => {
  try {
    let { symbol, companyName, name, listName, tags } = req.body;

    if (!symbol) {
      return res.status(400).json({ message: "Symbol is required" });
    }

    symbol = symbol.trim().toUpperCase();
    if (!symbol.includes(".")) symbol = `${symbol}.NS`;

    const finalName = companyName || name || symbol.replace(".NS", "");
    const boardName = normalizeListName(listName);
    const cleanTags = Array.isArray(tags)
      ? tags.map((tag) => String(tag).trim()).filter(Boolean).slice(0, 8)
      : [];

    const existing = await Watchlist.findOne({
      user: req.user._id,
      symbol,
      listName: boardName,
    });

    if (existing) {
      return res.status(409).json({ message: "Stock is already in this list" });
    }

    const last = await Watchlist.findOne({ user: req.user._id, listName: boardName }).sort({ position: -1 });

    const item = await Watchlist.create({
      user: req.user._id,
      symbol,
      companyName: finalName,
      listName: boardName,
      tags: cleanTags,
      position: last ? last.position + 1 : 0,
    });

    // Try to get live price immediately
    const quote = await safeQuote(symbol);
    const price = quote?.regularMarketPrice || 0;
    const changePercent = quote?.regularMarketChangePercent || 0;
    const positive = changePercent >= 0;

    res.status(201).json({
      _id: item._id,
      symbol: item.symbol,
      name: item.companyName,
      exchange: "NSE",
      price: price > 0 ? `₹${price.toFixed(2)}` : "₹0.00",
      numericPrice: price,
      change: `${positive ? "+" : ""}${changePercent.toFixed(2)}%`,
      changePercent,
      positive,
      dayHigh: quote?.regularMarketDayHigh || null,
      dayLow: quote?.regularMarketDayLow || null,
      data: [],
      listName: item.listName,
      tags: item.tags || [],
      position: item.position,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "Stock is already in this list" });
    }
    console.error("[Watchlist] Add error:", error.message);
    res.status(500).json({ message: "Failed to add to watchlist" });
  }
};

/* ── Get Watchlist with live prices ───────────────────────────────────────── */
const getWatchlist = async (req, res) => {
  try {
    await backfillLists(req.user._id);
    const query = { user: req.user._id };
    if (req.query.list) query.listName = normalizeListName(req.query.list);
    const watchlist = await Watchlist.find(query).sort({ listName: 1, position: 1, createdAt: 1 });
    if (!watchlist.length) return res.json([]);

    const symbols = watchlist.map((item) => item.symbol);
    const raw = await safeQuote(symbols);
    const quotes = Array.isArray(raw) ? raw : raw ? [raw] : [];

    // Create symbol map
    const quoteMap = new Map();
    for (const q of quotes) {
      if (q?.symbol) quoteMap.set(q.symbol, q);
    }

    const lines = await sparklinesFor(symbols);
    const formatted = watchlist.map((item) => {
      const quote = quoteMap.get(item.symbol);
      const price = quote?.regularMarketPrice || 0;
      const changePercent = quote?.regularMarketChangePercent || 0;
      const positive = changePercent >= 0;

      return {
        _id: item._id,
        symbol: item.symbol,
        name: item.companyName || quote?.shortName || item.symbol.replace(".NS", ""),
        exchange: "NSE",
        price: price > 0 ? `₹${price.toFixed(2)}` : "₹0.00",
        numericPrice: price,
        change: `${positive ? "+" : ""}${changePercent.toFixed(2)}%`,
        changePercent,
        positive,
        volume: quote?.regularMarketVolume || 0,
        dayHigh: quote?.regularMarketDayHigh || null,
        dayLow: quote?.regularMarketDayLow || null,
        fiftyTwoWeekHigh: quote?.fiftyTwoWeekHigh || null,
        fiftyTwoWeekLow: quote?.fiftyTwoWeekLow || null,
        data: lines.get(item.symbol) || [],
        listName: item.listName || DEFAULT_LIST,
        tags: item.tags || [],
        position: item.position || 0,
      };
    });

    res.status(200).json(formatted);
  } catch (error) {
    console.error("[Watchlist] Get error:", error.message);
    res.status(500).json({ message: "Failed to fetch watchlist" });
  }
};

/* ── Remove From Watchlist ─────────────────────────────────────────────────── */
const removeFromWatchlist = async (req, res) => {
  try {
    const item = await Watchlist.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!item) {
      return res.status(404).json({ message: "Watchlist item not found" });
    }

    await item.deleteOne();
    res.status(200).json({ message: "Removed successfully" });
  } catch (error) {
    console.error("[Watchlist] Remove error:", error.message);
    res.status(500).json({ message: "Failed to remove from watchlist" });
  }
};

const getBoards = async (req, res) => {
  try {
    await backfillLists(req.user._id);
    const user = await User.findById(req.user._id);
    const counts = await Watchlist.aggregate([
      { $match: { user: user._id } },
      { $group: { _id: "$listName", count: { $sum: 1 } } },
    ]);
    const countMap = new Map(counts.map((row) => [row._id, row.count]));
    let boards = Array.isArray(user.watchlistBoards) ? user.watchlistBoards : [];

    if (!boards.length) {
      const names = counts.map((row) => row._id).filter(Boolean);
      boards = (names.length ? names : [DEFAULT_LIST]).map((name, position) => ({ name, position }));
      user.watchlistBoards = boards;
      await user.save();
    }

    const payload = [...boards]
      .sort((a, b) => a.position - b.position)
      .map((board) => ({
        name: board.name,
        position: board.position,
        count: countMap.get(board.name) || 0,
      }));

    for (const [name, count] of countMap) {
      if (name && !payload.some((board) => board.name === name)) {
        payload.push({ name, position: payload.length, count });
      }
    }

    res.status(200).json(payload);
  } catch (error) {
    console.error("[Watchlist] Boards error:", error.message);
    res.status(500).json({ message: "Failed to load watchlists" });
  }
};

const createBoard = async (req, res) => {
  try {
    const name = normalizeListName(req.body?.name);
    const user = await User.findById(req.user._id);
    const boards = Array.isArray(user.watchlistBoards) ? [...user.watchlistBoards] : [];
    if (!boards.some((board) => board.name === DEFAULT_LIST)) {
      boards.unshift({ name: DEFAULT_LIST, position: 0 });
    }
    if (boards.some((board) => board.name.toLowerCase() === name.toLowerCase())) {
      return res.status(400).json({ message: "A list with that name already exists" });
    }
    boards.push({ name, position: boards.length });
    user.watchlistBoards = boards.map((board, position) => ({ name: board.name, position }));
    await user.save();
    res.status(201).json({ name, position: boards.length - 1, count: 0 });
  } catch (error) {
    console.error("[Watchlist] Create board error:", error.message);
    res.status(500).json({ message: "Failed to create watchlist" });
  }
};

const deleteBoard = async (req, res) => {
  try {
    const name = normalizeListName(decodeURIComponent(req.params.name || ""));
    if (name === DEFAULT_LIST) {
      return res.status(400).json({ message: "The default watchlist stays in place" });
    }
    const user = await User.findById(req.user._id);
    user.watchlistBoards = (user.watchlistBoards || [])
      .filter((board) => board.name !== name)
      .map((board, position) => ({ name: board.name, position }));
    await user.save();
    await Watchlist.updateMany(
      { user: req.user._id, listName: name },
      { $set: { listName: DEFAULT_LIST } }
    );
    res.status(200).json({ message: "List removed" });
  } catch (error) {
    console.error("[Watchlist] Delete board error:", error.message);
    res.status(500).json({ message: "Failed to remove watchlist" });
  }
};

const reorderWatchlist = async (req, res) => {
  try {
    const listName = normalizeListName(req.body?.listName);
    const orderedIds = Array.isArray(req.body?.orderedIds) ? req.body.orderedIds : [];
    await Promise.all(
      orderedIds.map((id, position) =>
        Watchlist.updateOne(
          { _id: id, user: req.user._id, listName },
          { $set: { position } }
        )
      )
    );
    res.status(200).json({ message: "Reordered" });
  } catch (error) {
    console.error("[Watchlist] Reorder error:", error.message);
    res.status(500).json({ message: "Failed to reorder watchlist" });
  }
};

const updateWatchlistItem = async (req, res) => {
  try {
    const item = await Watchlist.findOne({
      _id: req.params.id,
      user: req.user._id,
    });
    if (!item) {
      return res.status(404).json({ message: "Watchlist item not found" });
    }

    if (req.body.listName) {
      const nextList = normalizeListName(req.body.listName);
      const duplicate = await Watchlist.findOne({
        user: req.user._id,
        symbol: item.symbol,
        listName: nextList,
        _id: { $ne: item._id },
      });
      if (duplicate) {
        return res.status(409).json({ message: "Stock is already in this list" });
      }
      item.listName = nextList;
    }

    if (Array.isArray(req.body.tags)) {
      item.tags = req.body.tags.map((tag) => String(tag).trim()).filter(Boolean).slice(0, 8);
    }

    await item.save();
    res.status(200).json({
      _id: item._id,
      symbol: item.symbol,
      listName: item.listName,
      tags: item.tags,
      position: item.position,
    });
  } catch (error) {
    console.error("[Watchlist] Update error:", error.message);
    res.status(500).json({ message: "Failed to update watchlist item" });
  }
};

const exportWatchlist = async (req, res) => {
  try {
    await backfillLists(req.user._id);
    const query = { user: req.user._id };
    if (req.query.list) query.listName = normalizeListName(req.query.list);
    const items = await Watchlist.find(query).sort({ listName: 1, position: 1, createdAt: 1 });
    const lines = ["List,Symbol,Company,Tags"];
    for (const item of items) {
      lines.push(
        [
          csvCell(item.listName || DEFAULT_LIST),
          csvCell(item.symbol),
          csvCell(item.companyName),
          csvCell((item.tags || []).join("|")),
        ].join(",")
      );
    }
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", "attachment; filename=stockpulse-watchlist.csv");
    res.status(200).send(`\uFEFF${lines.join("\n")}`);
  } catch (error) {
    console.error("[Watchlist] Export error:", error.message);
    res.status(500).json({ message: "Failed to export watchlist" });
  }
};

module.exports = {
  addToWatchlist,
  getWatchlist,
  removeFromWatchlist,
  getBoards,
  createBoard,
  deleteBoard,
  reorderWatchlist,
  updateWatchlistItem,
  exportWatchlist,
};
