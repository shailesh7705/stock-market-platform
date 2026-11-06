process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-secret-test-secret-test-secret-123";
process.env.NEWS_API_KEY = "";
require("./yahooHook");

const test = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const { MongoMemoryServer } = require("mongodb-memory-server");
const { yahoo } = require("./yahooHook");
const { createApp } = require("../app");
const { store } = require("../utils/memoryCache");
const Alert = require("../models/Alert");
const User = require("../models/User");
const { checkAlerts } = require("../utils/alertEngine");

const app = createApp();
const password = "Secret12";

function quoteRow(symbol) {
  return {
    symbol,
    shortName: String(symbol).replace(".NS", ""),
    longName: String(symbol).replace(".NS", ""),
    regularMarketPrice: 100,
    regularMarketChangePercent: String(symbol).includes("TCS") ? -1.5 : 1.2,
    regularMarketChange: 1,
    regularMarketDayHigh: 110,
    regularMarketDayLow: 90,
    regularMarketPreviousClose: 99,
    regularMarketVolume: 1000,
    marketCap: 2e12,
    currency: "INR",
    fullExchangeName: "NSE",
    trailingPE: 20,
    dividendYield: 0.012,
    fiftyTwoWeekHigh: 120,
    fiftyTwoWeekLow: 80,
  };
}

function installYahoo() {
  yahoo.quote = async (input) => {
    const list = Array.isArray(input) ? input : [input];
    if (list.some((symbol) => String(symbol).includes("FAKE"))) {
      throw new Error("No data found, symbol may be delisted");
    }
    if (list.some((symbol) => String(symbol).includes("DOWN"))) {
      throw new Error("socket hang up");
    }
    const rows = list.map((symbol) => quoteRow(symbol));
    return Array.isArray(input) ? rows : rows[0];
  };
  yahoo.quoteSummary = async () => ({
    summaryDetail: { payoutRatio: 0.3, trailingPE: 20, dividendYield: 0.012 },
    financialData: {
      currentPrice: 100,
      returnOnEquity: 0.18,
      returnOnAssets: 0.08,
      earningsGrowth: 0.12,
      revenueGrowth: 0.1,
      operatingMargins: 0.2,
      profitMargins: 0.15,
      debtToEquity: 0.4,
    },
    defaultKeyStatistics: { trailingPE: 22, priceToBook: 4, pegRatio: 1.2 },
    assetProfile: { sector: "Technology", industry: "Software", longBusinessSummary: "A company." },
    recommendationTrend: { trend: [{ strongBuy: 2, buy: 3, hold: 1, sell: 0, strongSell: 0 }] },
  });
  yahoo.chart = async () => ({
    quotes: Array.from({ length: 30 }, (_, index) => ({ close: 90 + index })),
  });
  yahoo.search = async () => ({ quotes: [] });
}

async function loginAs(email, name) {
  const registered = await request(app).post("/api/auth/register").send({ name, email, password });
  assert.equal(registered.status, 201);
  const login = await request(app).post("/api/auth/login").send({ email, password });
  assert.equal(login.status, 200);
  return login.body.token;
}

test("stockpulse api", async (t) => {
  const mongo = await MongoMemoryServer.create({
    binary: { version: process.env.MONGOMS_VERSION || "7.0.21" },
  });
  await mongoose.connect(mongo.getUri());
  installYahoo();

  t.after(async () => {
    await mongoose.disconnect();
    await mongo.stop();
  });

  await t.test("register, login, and an expired token", async () => {
    const token = await loginAs("ada@example.com", "Ada");
    const alerts = await request(app).get("/api/alerts").set("Authorization", `Bearer ${token}`);
    assert.equal(alerts.status, 200);
    assert.equal(Array.isArray(alerts.body), true);

    const duplicate = await request(app).post("/api/auth/register").send({ name: "Ada", email: "ada@example.com", password });
    assert.equal(duplicate.status, 400);
    const wrong = await request(app).post("/api/auth/login").send({ email: "ada@example.com", password: "wrongpass" });
    assert.equal(wrong.status, 400);

    const user = await User.findOne({ email: "ada@example.com" });
    const expired = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: -10 });
    const denied = await request(app).get("/api/alerts").set("Authorization", `Bearer ${expired}`);
    assert.equal(denied.status, 401);
  });

  await t.test("validation rejects a bad symbol list", async () => {
    const symbols = Array.from({ length: 51 }, (_, index) => `S${index}.NS`).join(",");
    const response = await request(app).get(`/api/stocks/live?symbols=${symbols}`);
    assert.equal(response.status, 400);
  });

  await t.test("indices are fresh, then delayed when Yahoo fails", async () => {
    const fresh = await request(app).get("/api/stocks/indices");
    assert.equal(fresh.status, 200);
    assert.equal(fresh.body.stale, false);
    assert.ok(fresh.body.data.length > 0);

    store.get("indices").freshUntil = Date.now() - 1000;
    yahoo.quote = async () => {
      throw new Error("Yahoo blocked");
    };
    const delayed = await request(app).get("/api/stocks/indices");
    assert.equal(delayed.status, 200);
    assert.equal(delayed.body.stale, true);
    assert.equal(delayed.body.data[0].price, fresh.body.data[0].price);
    installYahoo();
  });

  await t.test("unknown symbols are 404 and upstream failures are 503", async () => {
    assert.equal((await request(app).get("/api/stocks/details/FAKE.NS")).status, 404);
    assert.equal((await request(app).get("/api/stocks/details/DOWN.NS")).status, 503);
    const details = await request(app).get("/api/stocks/details/RELIANCE.NS");
    assert.equal(details.status, 200);
    assert.equal(details.body.price, 100);
    assert.equal(details.body.payoutRatio, 30);
    assert.ok(details.body.pulseScore.score > 0);
    assert.match(details.body.forecast.oneYear.timeframe, new RegExp(String(new Date().getFullYear() + 1)));
  });

  await t.test("movers, search, history and news respond", async () => {
    const movers = await request(app).get("/api/stocks/movers");
    assert.equal(movers.status, 200);
    assert.ok(movers.body.categories.large.gainers.length > 0);
    assert.ok(movers.body.stocks[0].sparkline.length > 1);
    assert.equal(movers.body.stale, false);

    const search = await request(app).get("/api/stocks/search?q=RELIANCE");
    assert.equal(search.status, 200);
    assert.ok(search.body.length > 0);

    assert.equal((await request(app).get("/api/stocks/history/RELIANCE.NS?range=1mo")).status, 200);
    assert.equal((await request(app).get("/api/news/market")).status, 200);
    assert.equal((await request(app).get("/api/market/calendar")).status, 200);
  });

  await t.test("a user cannot change another user's alerts, watchlist or portfolio", async () => {
    const tokenA = await loginAs("user.a@example.com", "User A");
    const tokenB = await loginAs("user.b@example.com", "User B");

    const created = await request(app)
      .post("/api/alerts")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ symbol: "RELIANCE", targetPrice: 250, condition: "above" });
    assert.equal(created.status, 201);

    const stolen = await request(app).delete(`/api/alerts/${created.body._id}`).set("Authorization", `Bearer ${tokenB}`);
    assert.equal(stolen.status, 404);

    const already = await request(app)
      .post("/api/alerts")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ symbol: "RELIANCE", targetPrice: 50, condition: "above" });
    assert.equal(already.status, 409);

    const watch = await request(app)
      .post("/api/watchlist")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ symbol: "TCS", companyName: "TCS" });
    assert.equal(watch.status, 201);
    const watchStolen = await request(app).delete(`/api/watchlist/${watch.body._id}`).set("Authorization", `Bearer ${tokenB}`);
    assert.equal(watchStolen.status, 404);

    const holding = await request(app)
      .post("/api/portfolio")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ symbol: "INFY", quantity: 2, avgBuyPrice: 1500 });
    assert.equal(holding.status, 201);
    const holdingStolen = await request(app)
      .delete(`/api/portfolio/${holding.body.holding._id}`)
      .set("Authorization", `Bearer ${tokenB}`);
    assert.equal(holdingStolen.status, 404);

    const portfolio = await request(app).get("/api/portfolio").set("Authorization", `Bearer ${tokenA}`);
    assert.equal(portfolio.status, 200);
    assert.equal(portfolio.body.summary.dividendCalendar, undefined);

    const notes = await request(app).get("/api/notifications").set("Authorization", `Bearer ${tokenA}`);
    assert.equal(notes.status, 200);
    assert.equal((await request(app).put("/api/notifications/read-all").set("Authorization", `Bearer ${tokenA}`)).status, 200);
    const listed = await request(app).get("/api/watchlist").set("Authorization", `Bearer ${tokenA}`);
    assert.equal(listed.status, 200);
    assert.equal((await request(app).patch(`/api/alerts/${created.body._id}/toggle`).set("Authorization", `Bearer ${tokenA}`)).status, 200);
    const weak = await request(app).post("/api/auth/register").send({ name: "Bo", email: "bo@example.com", password: "short" });
    assert.equal(weak.status, 400);
  });

  await t.test("the alert engine triggers once and records the email", async () => {
    const user = await User.findOne({ email: "user.a@example.com" });
    await Alert.create({
      user: user._id,
      symbol: "RELIANCE.NS",
      targetPrice: 90,
      condition: "above",
      active: true,
      triggered: false,
    });

    global.__marketOpen = true;
    await checkAlerts();
    const triggered = await Alert.findOne({ user: user._id, targetPrice: 90 });
    assert.equal(triggered.triggered, true);
    assert.equal(triggered.emailStatus, "sent");

    await Alert.create({
      user: user._id,
      symbol: "TCS.NS",
      targetPrice: 10,
      condition: "above",
      active: true,
      triggered: true,
      triggeredPrice: 100,
      emailStatus: "pending",
    });
    global.__marketOpen = false;
    await checkAlerts();
    const retried = await Alert.findOne({ symbol: "TCS.NS", targetPrice: 10 });
    assert.equal(retried.emailStatus, "sent");
    global.__marketOpen = true;
  });
});
