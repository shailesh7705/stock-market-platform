function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  const source = String(text || "").replace(/^\uFEFF/, "");

  for (let i = 0; i < source.length; i += 1) {
    const char = source[i];
    if (quoted) {
      if (char === '"') {
        if (source[i + 1] === '"') {
          cell += '"';
          i += 1;
        } else {
          quoted = false;
        }
      } else {
        cell += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(cell.trim());
      cell = "";
    } else if (char === "\n") {
      row.push(cell.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      cell = "";
    } else if (char !== "\r") {
      cell += char;
    }
  }

  if (cell.length || row.length) {
    row.push(cell.trim());
    if (row.some(Boolean)) rows.push(row);
  }
  return rows;
}

function headerKey(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function findColumn(headers, names) {
  const keys = headers.map(headerKey);
  return names.map((name) => keys.indexOf(name)).find((index) => index >= 0) ?? -1;
}

function numberFrom(value) {
  if (value === null || value === undefined || value === "") return null;
  const cleaned = String(value).replace(/[,₹\s]/g, "").replace(/[^\d.-]/g, "");
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : null;
}

const ISIN_TO_SYMBOL = {
  INE002A01018: "RELIANCE.NS",
  INE467B01029: "TCS.NS",
  INE040A01034: "HDFCBANK.NS",
  INE090A01021: "ICICIBANK.NS",
  INE009A01021: "INFY.NS",
  INE154A01025: "ITC.NS",
  INE062A01020: "SBIN.NS",
  INE030A01027: "HINDUNILVR.NS",
  INE397D01024: "BHARTIARTL.NS",
  INE018A01030: "LT.NS",
  INE296A01024: "BAJFINANCE.NS",
  INE585B01010: "MARUTI.NS",
  INE280A01028: "TITAN.NS",
  INE044A01036: "SUNPHARMA.NS",
  INE155A01022: "TATAMOTORS.NS",
  INE733E01010: "NTPC.NS",
  INE213A01029: "ONGC.NS",
  INE238A01034: "AXISBANK.NS",
  INE237A01028: "KOTAKBANK.NS",
};

function normalizeSymbol(raw) {
  if (!raw) return "";
  let symbol = String(raw).trim().toUpperCase();
  symbol = symbol.replace(/\s+/g, "");
  if (!symbol || symbol === "N/A") return "";
  if (symbol.includes("-")) {
    const equity = symbol.match(/^([A-Z0-9&]+)-EQ$/);
    if (equity) symbol = equity[1];
  }
  if (symbol.endsWith(".NSE")) symbol = symbol.replace(".NSE", ".NS");
  if (!symbol.includes(".")) symbol = `${symbol}.NS`;
  return symbol;
}

function detectBroker(headers) {
  const keys = headers.map(headerKey);
  if (keys.includes("tradetype") || keys.includes("orderid") || keys.includes("tradeid")) return "Zerodha";
  if (keys.includes("instrument") && (keys.includes("avgcost") || keys.includes("averagecost"))) return "Zerodha";
  if (keys.includes("stockname") || keys.some((key) => key.includes("groww"))) return "Groww";
  return "CSV";
}

function parseDate(value) {
  if (!value) return "";
  const text = String(value).trim();
  const direct = new Date(text);
  if (!Number.isNaN(direct.getTime()) && text.length >= 8) return direct.toISOString().slice(0, 10);
  const match = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/);
  if (!match) return "";
  const year = match[3].length === 2 ? `20${match[3]}` : match[3];
  return `${year}-${match[2].padStart(2, "0")}-${match[1].padStart(2, "0")}`;
}

function blankPosition(symbol) {
  return {
    symbol,
    companyName: symbol.replace(".NS", "").replace(".BO", ""),
    isin: "",
    quantity: 0,
    avgBuyPrice: 0,
    buyDate: "",
    cost: 0,
  };
}

export function parseBrokerCsv(text) {
  const table = parseCsv(text);
  if (table.length < 2) {
    return { broker: "CSV", rows: [], error: "The file needs a header row and at least one holding." };
  }

  const headers = table[0];
  const broker = detectBroker(headers);
  const symbolIndex = findColumn(headers, ["symbol", "tradingsymbol", "instrument", "nsecode", "stocksymbol"]);
  const nameIndex = findColumn(headers, ["stockname", "companyname", "name", "instrumentname"]);
  const isinIndex = findColumn(headers, ["isin"]);
  const qtyIndex = findColumn(headers, ["quantity", "qty", "quantityavailable", "qtyavailable", "netqty"]);
  const priceIndex = findColumn(headers, [
    "averageprice",
    "avgcost",
    "averagecost",
    "averagebuyprice",
    "buyprice",
    "avgprice",
    "price",
  ]);
  const dateIndex = findColumn(headers, ["tradedate", "date", "orderexecutiontime", "tradedatetime"]);
  const sideIndex = findColumn(headers, ["tradetype", "transactiontype", "side", "type"]);

  if (qtyIndex < 0 || priceIndex < 0 || (symbolIndex < 0 && isinIndex < 0)) {
    return {
      broker,
      rows: [],
      error: "Could not find symbol, quantity, and average price columns. Use a Zerodha or Groww holdings/tradebook export.",
    };
  }

  const positions = new Map();

  const unresolved = [];

  table.slice(1).forEach((cells, index) => {
    const isin = isinIndex >= 0 ? String(cells[isinIndex] || "").trim().toUpperCase() : "";
    let symbol = normalizeSymbol(symbolIndex >= 0 ? cells[symbolIndex] : "");
    if (!symbol && isin) symbol = ISIN_TO_SYMBOL[isin] || "";
    const quantity = numberFrom(cells[qtyIndex]);
    const price = numberFrom(cells[priceIndex]);
    if (!symbol) {
      unresolved.push({
        id: isin || `row-${index}`,
        include: false,
        symbol: "",
        companyName: nameIndex >= 0 ? cells[nameIndex] || "Unknown" : "Unknown",
        isin,
        quantity: quantity || 0,
        avgBuyPrice: price || 0,
        buyDate: "",
        flags: ["Missing NSE symbol. Add a symbol column or a known ISIN."],
      });
      return;
    }
    if (quantity === null || price === null) return;

    const side = sideIndex >= 0 ? String(cells[sideIndex] || "").toUpperCase() : "BUY";
    const isSell = side.includes("SELL");
    const current = positions.get(symbol) || blankPosition(symbol);
    if (nameIndex >= 0 && cells[nameIndex]) current.companyName = cells[nameIndex];
    if (isin) current.isin = isin;
    const tradeDate = parseDate(dateIndex >= 0 ? cells[dateIndex] : "");
    if (tradeDate) current.buyDate = tradeDate;

    if (isSell) {
      current.quantity = Math.max(0, current.quantity - quantity);
      if (current.quantity === 0) current.cost = 0;
    } else if (sideIndex >= 0) {
      current.cost += quantity * price;
      current.quantity += quantity;
      current.avgBuyPrice = current.quantity > 0 ? current.cost / current.quantity : 0;
    } else {
      current.quantity += quantity;
      current.cost += quantity * price;
      current.avgBuyPrice = current.quantity > 0 ? current.cost / current.quantity : price;
    }
    positions.set(symbol, current);
  });

  const rows = unresolved.concat(Array.from(positions.values())
    .filter((position) => position.quantity > 0)
    .map((position) => {
      const flags = [];
      if (!position.symbol) flags.push("Missing symbol");
      if (position.quantity < 0.01) flags.push("Quantity must be at least 0.01");
      if (!position.avgBuyPrice || position.avgBuyPrice < 0.01) flags.push("Average price must be positive");
      return {
        id: position.symbol,
        include: flags.length === 0,
        symbol: position.symbol,
        companyName: position.companyName,
        isin: position.isin,
        quantity: Number(position.quantity.toFixed(4)),
        avgBuyPrice: Number(position.avgBuyPrice.toFixed(4)),
        buyDate: position.buyDate,
        flags,
      };
    }));

  return { broker, rows, error: rows.length ? "" : "No open positions were found in this file." };
}
