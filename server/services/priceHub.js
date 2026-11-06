// server/services/priceHub.js
const yahooGateway = require("./yahooGateway");
const { isMarketOpen } = require("../utils/marketHours");

class PriceHub {
  constructor() {
    this.clients = new Map(); // res -> Set of symbols
    this.symbolSubscribers = new Map(); // symbol -> Set of res
    this.pollInterval = null;
    this.heartbeatInterval = null;
    this.lastPrices = new Map(); // symbol -> { price, change, changePercent }
  }

  start() {
    if (this.pollInterval) return;

    // Heartbeat every 25 seconds to keep SSE connections alive
    this.heartbeatInterval = setInterval(() => {
      const ping = `event: ping\ndata: ${Date.now()}\n\n`;
      for (const res of this.clients.keys()) {
        try {
          res.write(ping);
        } catch {
          this.removeClient(res);
        }
      }
    }, 25000);
    if (this.heartbeatInterval && this.heartbeatInterval.unref) {
      this.heartbeatInterval.unref();
    }

    // Live price tick poller every 10 seconds
    this.pollInterval = setInterval(async () => {
      if (this.clients.size === 0) return;
      await this.pollTicks();
    }, 10000);
    if (this.pollInterval && this.pollInterval.unref) {
      this.pollInterval.unref();
    }

    console.log("[PriceHub] Real-time SSE PriceHub initialized.");
  }

  stop() {
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    if (this.pollInterval) clearInterval(this.pollInterval);
    this.heartbeatInterval = null;
    this.pollInterval = null;
  }

  async pollTicks() {
    const symbols = Array.from(this.symbolSubscribers.keys()).filter((sym) => {
      const set = this.symbolSubscribers.get(sym);
      return set && set.size > 0;
    });

    if (symbols.length === 0) return;

    try {
      const quotes = await yahooGateway.getQuotes(symbols, 8000);
      for (const q of quotes) {
        if (!q || !q.symbol || !q.regularMarketPrice) continue;
        const sym = q.symbol.toUpperCase();
        const price = Number(q.regularMarketPrice.toFixed(2));
        const change = Number((q.regularMarketChange || 0).toFixed(2));
        const changePercent = Number((q.regularMarketChangePercent || 0).toFixed(2));

        const last = this.lastPrices.get(sym);
        if (!last || last.price !== price || last.change !== change) {
          this.lastPrices.set(sym, { price, change, changePercent });
          this.broadcastTick({
            symbol: sym,
            price,
            change,
            changePercent,
            dayHigh: q.regularMarketDayHigh || null,
            dayLow: q.regularMarketDayLow || null,
            volume: q.regularMarketVolume || 0,
            timestamp: Date.now(),
          });
        }
      }
    } catch (err) {
      console.warn("[PriceHub] Poll ticks warning:", err.message);
    }
  }

  broadcastTick(tick) {
    const subscribers = this.symbolSubscribers.get(tick.symbol);
    if (!subscribers || subscribers.size === 0) return;

    const payload = `event: quote\ndata: ${JSON.stringify(tick)}\n\n`;
    for (const res of subscribers) {
      try {
        res.write(payload);
      } catch {
        this.removeClient(res);
      }
    }
  }

  addClient(res, rawSymbols = []) {
    const symbols = rawSymbols
      .map((s) => String(s).trim().toUpperCase())
      .filter(Boolean)
      .slice(0, 50);

    const symbolSet = new Set(symbols);
    this.clients.set(res, symbolSet);

    for (const sym of symbolSet) {
      if (!this.symbolSubscribers.has(sym)) {
        this.symbolSubscribers.set(sym, new Set());
      }
      this.symbolSubscribers.get(sym).add(res);
    }

    for (const sym of symbolSet) {
      const cached = this.lastPrices.get(sym);
      if (cached) {
        res.write(`event: quote\ndata: ${JSON.stringify({ symbol: sym, ...cached })}\n\n`);
      }
    }

    const missing = symbols.filter((s) => !this.lastPrices.has(s));
    if (missing.length > 0) {
      yahooGateway
        .getQuotes(missing, 5000)
        .then((quotes) => {
          for (const q of quotes) {
            if (!q?.symbol || !q.regularMarketPrice) continue;
            const sym = q.symbol.toUpperCase();
            const tick = {
              symbol: sym,
              price: Number(q.regularMarketPrice.toFixed(2)),
              change: Number((q.regularMarketChange || 0).toFixed(2)),
              changePercent: Number((q.regularMarketChangePercent || 0).toFixed(2)),
              timestamp: Date.now(),
            };
            this.lastPrices.set(sym, tick);
            this.broadcastTick(tick);
          }
        })
        .catch(() => {});
    }
  }

  removeClient(res) {
    const symbolSet = this.clients.get(res);
    if (symbolSet) {
      for (const sym of symbolSet) {
        const subs = this.symbolSubscribers.get(sym);
        if (subs) {
          subs.delete(res);
          if (subs.size === 0) {
            this.symbolSubscribers.delete(sym);
          }
        }
      }
      this.clients.delete(res);
    }
  }

  getClientCount() {
    return this.clients.size;
  }

  getSubscribedSymbolCount() {
    return this.symbolSubscribers.size;
  }
}

const priceHub = new PriceHub();
// priceHub is started explicitly in server/index.js

module.exports = priceHub;
