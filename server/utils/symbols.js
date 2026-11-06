// NSE/BSE tickers include letters, digits, "&" (M&M) and "-" (BAJAJ-AUTO).
const SYMBOL_PATTERN = /^[A-Z0-9&-]{1,20}\.(NS|BO)$/;

const normalizeSymbol = (input) => {
  if (typeof input !== "string") return null;
  let symbol = input.trim().toUpperCase();
  if (!symbol) return null;
  if (!symbol.includes(".")) symbol = `${symbol}.NS`;
  return SYMBOL_PATTERN.test(symbol) ? symbol : null;
};

module.exports = { SYMBOL_PATTERN, normalizeSymbol };
