// server/services/yahooGateway.js
const YahooFinance = require("yahoo-finance2").default;
const yahooFinance = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

const YF_OPTS = { validateResult: false };

class CircuitBreaker {
  constructor({ failureThreshold = 5, cooldownMs = 30000 } = {}) {
    this.failureThreshold = failureThreshold;
    this.cooldownMs = cooldownMs;
    this.consecutiveFailures = 0;
    this.state = "CLOSED"; // CLOSED | OPEN | HALF_OPEN
    this.lastFailureTime = 0;
  }

  isOpen() {
    if (this.state === "OPEN") {
      if (Date.now() - this.lastFailureTime > this.cooldownMs) {
        this.state = "HALF_OPEN";
        return false;
      }
      return true;
    }
    return false;
  }

  recordSuccess() {
    this.consecutiveFailures = 0;
    this.state = "CLOSED";
  }

  recordFailure() {
    this.consecutiveFailures += 1;
    this.lastFailureTime = Date.now();
    if (this.consecutiveFailures >= this.failureThreshold) {
      this.state = "OPEN";
      console.warn(`[YahooGateway] Circuit breaker tripped OPEN (${this.consecutiveFailures} consecutive failures). Cooldown: ${this.cooldownMs / 1000}s`);
    }
  }

  getStatus() {
    return {
      state: this.state,
      consecutiveFailures: this.consecutiveFailures,
      lastFailureTime: this.lastFailureTime,
      cooldownRemainingMs: Math.max(0, this.cooldownMs - (Date.now() - this.lastFailureTime)),
    };
  }
}

class YahooGateway {
  constructor() {
    this.client = yahooFinance;
    this.circuitBreaker = new CircuitBreaker();
    this.inFlightQuotes = new Map();
    this.inFlightSummaries = new Map();
  }

  /**
   * Concurrency-controlled execution of an async function
   */
  async _executeWithCircuit(operation) {
    if (this.circuitBreaker.isOpen()) {
      const err = new Error("Yahoo Finance upstream circuit breaker is OPEN");
      err.isCircuitOpen = true;
      err.retryAfter = Math.ceil(this.circuitBreaker.cooldownMs / 1000);
      throw err;
    }

    try {
      const result = await operation();
      this.circuitBreaker.recordSuccess();
      return result;
    } catch (err) {
      this.circuitBreaker.recordFailure();
      throw err;
    }
  }

  /**
   * Fetch a single quote or array of quotes with batching and request deduplication.
   * @param {string|string[]} symbols
   * @param {number} timeoutMs
   * @returns {Promise<object[]>}
   */
  async getQuotes(symbols, timeoutMs = 8000) {
    const list = Array.isArray(symbols) ? [...new Set(symbols)] : [symbols];
    if (list.length === 0) return [];

    // Chunk into batches of up to 50
    const BATCH_SIZE = 50;
    const batches = [];
    for (let i = 0; i < list.length; i += BATCH_SIZE) {
      batches.push(list.slice(i, i + BATCH_SIZE));
    }

    const results = [];
    for (const batch of batches) {
      const batchKey = batch.slice().sort().join(",");
      let promise = this.inFlightQuotes.get(batchKey);

      if (!promise) {
        promise = this._executeWithCircuit(async () => {
          return await Promise.race([
            this.client.quote(batch, {}, YF_OPTS),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error("Timeout")), timeoutMs)
            ),
          ]);
        }).finally(() => {
          this.inFlightQuotes.delete(batchKey);
        });

        this.inFlightQuotes.set(batchKey, promise);
      }

      try {
        const raw = await promise;
        if (Array.isArray(raw)) {
          results.push(...raw.filter(Boolean));
        } else if (raw) {
          results.push(raw);
        }
      } catch (err) {
        console.warn(`[YahooGateway] Batch quote failed for [${batchKey.slice(0, 40)}...]:`, err.message);
        throw err;
      }
    }

    return results;
  }

  /**
   * Fetch quoteSummary for a single symbol with in-flight deduplication.
   * @param {string} symbol
   * @param {object} queryOptions
   * @param {number} timeoutMs
   * @returns {Promise<object>}
   */
  async getQuoteSummary(symbol, queryOptions = {}, timeoutMs = 8000) {
    const key = `${symbol}:${JSON.stringify(queryOptions.modules || [])}`;
    let promise = this.inFlightSummaries.get(key);

    if (!promise) {
      promise = this._executeWithCircuit(async () => {
        return await Promise.race([
          this.client.quoteSummary(symbol, queryOptions, YF_OPTS),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Timeout")), timeoutMs)
          ),
        ]);
      }).finally(() => {
        this.inFlightSummaries.delete(key);
      });

      this.inFlightSummaries.set(key, promise);
    }

    return await promise;
  }

  /**
   * Fetch historical chart data.
   */
  async getChart(symbol, queryOptions = {}, timeoutMs = 8000) {
    return await this._executeWithCircuit(async () => {
      return await Promise.race([
        this.client.chart(symbol, queryOptions, YF_OPTS),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Timeout")), timeoutMs)
        ),
      ]);
    });
  }

  /**
   * Search Yahoo symbols.
   */
  async search(query, queryOptions = {}, timeoutMs = 5000) {
    return await this._executeWithCircuit(async () => {
      return await Promise.race([
        this.client.search(query, queryOptions, YF_OPTS),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Timeout")), timeoutMs)
        ),
      ]);
    });
  }

  getCircuitStatus() {
    return this.circuitBreaker.getStatus();
  }
}

const yahooGateway = new YahooGateway();
module.exports = yahooGateway;
