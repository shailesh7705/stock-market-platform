const { z } = require("zod");
const { normalizeSymbol } = require("../utils/symbols");

const MAX_BATCH_SYMBOLS = 50;
const INDEX_SYMBOL = /^\^[A-Z0-9]{2,15}$/;

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid id");

const tradableSymbol = z
  .string("Symbol is required")
  .max(30, "Symbol is too long")
  .transform((value, ctx) => {
    const symbol = normalizeSymbol(value);
    if (!symbol) {
      ctx.addIssue({ code: "custom", message: "Enter a valid NSE or BSE symbol, e.g. RELIANCE.NS" });
      return z.NEVER;
    }
    return symbol;
  });

const readSymbol = (value) => {
  const upper = String(value).trim().toUpperCase();
  if (INDEX_SYMBOL.test(upper)) return upper;
  return normalizeSymbol(upper);
};

// Drops unrecognised symbols instead of failing, so one bad legacy watchlist row cannot break a page.
const symbolList = z
  .string("Symbols required")
  .max(MAX_BATCH_SYMBOLS * 32, "Too many symbols")
  .transform((value, ctx) => {
    const parts = value.split(",").map((s) => s.trim()).filter(Boolean);
    if (parts.length > MAX_BATCH_SYMBOLS) {
      ctx.addIssue({ code: "custom", message: `Request up to ${MAX_BATCH_SYMBOLS} symbols at a time` });
      return z.NEVER;
    }
    const symbols = [...new Set(parts.map(readSymbol).filter(Boolean))];
    if (symbols.length === 0) {
      ctx.addIssue({ code: "custom", message: "No valid symbols provided" });
      return z.NEVER;
    }
    return symbols.join(",");
  });

const symbolParam = z.object({
  symbol: z
    .string()
    .max(30, "Symbol is too long")
    .transform((value, ctx) => {
      const symbol = readSymbol(value);
      if (!symbol) {
        ctx.addIssue({ code: "custom", message: "Invalid symbol" });
        return z.NEVER;
      }
      return symbol;
    }),
});

const idParam = z.object({ id: objectId });

// Cursor pagination: pass the createdAt of the last item as `before` to fetch the next page.
const pageQuery = (defaultLimit, maxLimit) =>
  z.object({
    limit: z.coerce.number().int().min(1).max(maxLimit).default(defaultLimit),
    before: z.coerce.date("Invalid cursor").optional(),
  });
const positiveNumber = (label) =>
  z.coerce.number(`${label} must be a number`).positive(`${label} must be a positive number`).max(1e9, `${label} is too large`);
const shortText = (max) => z.string().trim().max(max, `Must be ${max} characters or fewer`);
const optionalText = (max) => shortText(max).nullish();
const email = z.string("Email is required").trim().toLowerCase().max(254, "Email is too long").email("Enter a valid email address");
// Login keeps the original casing so accounts created before email normalisation can still sign in.
const loginEmail = z.string("Invalid email or password").trim().min(1, "Invalid email or password").max(254, "Invalid email or password");
const password = z.string("Password is required").min(1, "Password is required").max(128, "Password is too long");

const stocks = {
  live: { query: z.object({ symbols: symbolList }) },
  batch: { query: z.object({ symbols: symbolList }) },
  symbol: { params: symbolParam },
  history: {
    params: symbolParam,
    query: z.object({
      range: z
        .preprocess(
          (value) => (typeof value === "string" ? value.trim().toLowerCase() : value),
          z.enum(["1d", "5d", "1wk", "1m", "1mo", "3m", "3mo", "6m", "6mo", "1y", "5y"], "Unsupported chart range")
        )
        .optional(),
    }),
  },
  search: {
    query: z.object({ q: z.string("Query too short").trim().min(1, "Query too short").max(64, "Query is too long") }),
  },
};

const auth = {
  register: {
    body: z.object({
      name: z.string("Name is required").trim().min(1, "Name is required").max(60, "Name is too long"),
      email,
      password,
    }),
  },
  login: { body: z.object({ email: loginEmail, password }) },
  forgot: { body: z.object({ email }) },
  reset: {
    body: z.object({
      token: z.string("Reset link is invalid or has expired").min(1).max(2048),
      password,
    }),
  },
  preferences: { body: z.object({ alertSound: z.boolean("alertSound must be true or false") }) },
};

const alerts = {
  create: {
    body: z.object({
      symbol: tradableSymbol,
      targetPrice: positiveNumber("Target price"),
      condition: z.enum(
        ["above", "below"],
        "Choose whether the price should rise above or fall below the target"
      ),
      notes: optionalText(280),
    }),
  },
  update: {
    params: idParam,
    body: z.object({
      targetPrice: positiveNumber("Target price").optional(),
      condition: z.enum(["above", "below"]).optional(),
      rearm: z.boolean().optional(),
    }),
  },
  test: {
    body: z.object({
      symbol: tradableSymbol.optional(),
      targetPrice: positiveNumber("Target price").optional(),
      condition: z.enum(["above", "below"]).optional(),
    }),
  },
  byId: { params: idParam },
  list: { query: pageQuery(200, 500) },
};

const listName = shortText(40);
const tags = z.array(shortText(24)).max(8, "Up to 8 tags per stock");

const watchlist = {
  list: { query: z.object({ list: shortText(80).optional() }) },
  add: {
    body: z.object({
      symbol: tradableSymbol,
      companyName: optionalText(120),
      name: optionalText(120),
      listName: listName.nullish(),
      tags: tags.nullish(),
    }),
  },
  createBoard: { body: z.object({ name: z.string("List name is required").trim().min(1, "List name is required").max(40) }) },
  boardParam: { params: z.object({ name: z.string().min(1).max(120) }) },
  reorder: {
    body: z.object({
      listName: listName.optional(),
      orderedIds: z.array(objectId).max(500, "Too many items to reorder"),
    }),
  },
  update: {
    params: idParam,
    body: z.object({ listName: listName.optional(), tags: tags.optional() }),
  },
  byId: { params: idParam },
};

const holdingFields = {
  companyName: optionalText(120),
  buyDate: z.preprocess(
    (value) => (value === "" || value === null ? undefined : value),
    z.coerce.date("Invalid buy date").optional()
  ),
  notes: optionalText(500),
  broker: optionalText(40),
};

const portfolio = {
  add: {
    body: z.object({
      symbol: tradableSymbol,
      quantity: positiveNumber("Quantity"),
      avgBuyPrice: positiveNumber("Average buy price"),
      ...holdingFields,
    }),
  },
  // Rows are validated individually in the controller so one bad CSV line does not reject the whole import.
  bulk: {
    body: z.object({
      holdings: z.array(z.record(z.string(), z.unknown())).min(1, "No holdings to import").max(100, "Import up to 100 holdings at a time"),
      broker: optionalText(40),
    }),
  },
  update: {
    params: idParam,
    body: z.object({
      quantity: positiveNumber("Quantity").optional(),
      avgBuyPrice: positiveNumber("Average buy price").optional(),
      notes: optionalText(500),
    }),
  },
  byId: { params: idParam },
};

const notifications = { byId: { params: idParam }, list: { query: pageQuery(50, 100) } };

module.exports = { stocks, auth, alerts, watchlist, portfolio, notifications, MAX_BATCH_SYMBOLS };
