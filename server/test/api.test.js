process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-secret-test-secret-test-secret-123";
process.env.NEWS_API_KEY = "";
require("./yahooHook");

const test = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
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
    price: { regularMarketPrice: 100, regularMarketChange: 1.5, regularMarketChangePercent: 0.015, shortName: "Reliance Industries", longName: "Reliance Industries Ltd", marketCap: 2e12 },
    summaryDetail: { payoutRatio: 0.3, trailingPE: 20, dividendYield: 0.012, fiftyTwoWeekHigh: 120, fiftyTwoWeekLow: 80 },
    financialData: {
      currentPrice: 100,
      returnOnEquity: 0.18,
      returnOnAssets: 0.08,
      earningsGrowth: 0.12,
      revenueGrowth: 0.1,
      operatingMargins: 0.2,
      profitMargins: 0.15,
      debtToEquity: 40,
    },
    defaultKeyStatistics: { trailingPE: 22, priceToBook: 4, pegRatio: 1.2 },
    assetProfile: { sector: "Technology", industry: "Software", longBusinessSummary: "A company." },
    recommendationTrend: { trend: [{ strongBuy: 2, buy: 3, hold: 1, sell: 0, strongSell: 0 }] },
    incomeStatementHistory: {
      incomeStatementHistory: [
        { endDate: new Date("2024-03-31"), totalRevenue: 1000000000, operatingIncome: 250000000, ebit: 250000000, netIncome: 180000000, dilutedEPS: 18 },
        { endDate: new Date("2023-03-31"), totalRevenue: 850000000, operatingIncome: 200000000, ebit: 200000000, netIncome: 140000000, dilutedEPS: 14 },
      ],
    },
    incomeStatementHistoryQuarterly: {
      incomeStatementHistory: [
        { endDate: new Date("2024-12-31"), totalRevenue: 280000000, operatingIncome: 70000000, ebit: 70000000, netIncome: 50000000, dilutedEPS: 5 },
      ],
    },
    balanceSheetHistory: {
      balanceSheetStatements: [
        { endDate: new Date("2024-03-31"), totalAssets: 1500000000, totalCurrentLiabilities: 300000000, totalStockholderEquity: 900000000, totalDebt: 200000000 },
      ],
    },
    balanceSheetHistoryQuarterly: {
      balanceSheetStatements: [
        { endDate: new Date("2024-12-31"), totalAssets: 1600000000, totalCurrentLiabilities: 320000000, totalStockholderEquity: 950000000, totalDebt: 180000000 },
      ],
    },
    cashflowStatementHistory: {
      cashflowStatements: [
        { endDate: new Date("2024-03-31"), totalCashFromOperatingActivities: 220000000, capitalExpenditures: -50000000 },
      ],
    },
    cashflowStatementHistoryQuarterly: {
      cashflowStatements: [
        { endDate: new Date("2024-12-31"), totalCashFromOperatingActivities: 60000000, capitalExpenditures: -15000000 },
      ],
    },
    majorHoldersBreakdown: {
      insidersPercentHeld: 0.50,
      institutionsPercentHeld: 0.32,
    },
    calendarEvents: {
      earnings: { earningsDate: [new Date("2025-02-15")] },
      exDividendDate: new Date("2025-01-20"),
    },
  });
  yahoo.chart = async () => ({
    quotes: Array.from({ length: 30 }, (_, index) => ({ date: new Date(Date.now() - (30 - index) * 86400000), close: 90 + index })),
    events: {
      dividends: {
        "1": { amount: 15, date: 1725000000 },
      },
      splits: {
        "1": { numerator: 2, denominator: 1, date: 1690000000 },
      },
    },
  });
  yahoo.search = async () => ({
    quotes: [],
    news: [
      {
        uuid: "news-1",
        title: "Reliance Surges on Strong Quarterly Earnings Growth",
        publisher: "Mint",
        link: "https://example.com/news/1",
        providerPublishTime: 1731000000,
        type: "news",
      },
    ],
  });
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

  await t.test("sprint 14 auth lifecycle, security cookies, preferences and DPDP compliance", async () => {
    // 1. Register with cookies and verification token
    const regRes = await request(app)
      .post("/api/auth/register")
      .send({ name: "Sprint Fourteen", email: "sprint14@example.com", password: "Password123" });
    assert.equal(regRes.status, 201);
    assert.ok(regRes.body.token);

    const cookies = regRes.headers["set-cookie"] || [];
    assert.ok(cookies.some((c) => c.includes("access_token=")));
    assert.ok(cookies.some((c) => c.includes("refresh_token=")));

    // 2. Email verification
    const spUser = await User.findOne({ email: "sprint14@example.com" });
    assert.equal(spUser.isEmailVerified, false);
    assert.ok(spUser.emailVerificationTokenHash);

    const badVerify = await request(app).post("/api/auth/verify-email").send({ token: "invalid-token" });
    assert.equal(badVerify.status, 400);

    const resend = await request(app).post("/api/auth/resend-verification").send({ email: "sprint14@example.com" });
    assert.equal(resend.status, 200);

    const rawVerifyToken = crypto.randomBytes(32).toString("hex");
    spUser.emailVerificationTokenHash = crypto.createHash("sha256").update(rawVerifyToken).digest("hex");
    spUser.emailVerificationExpires = new Date(Date.now() + 3600000);
    await spUser.save();

    const goodVerify = await request(app).post("/api/auth/verify-email").send({ token: rawVerifyToken });
    assert.equal(goodVerify.status, 200);
    assert.equal(goodVerify.body.user.isEmailVerified, true);

    // 3. Profile & me
    const meRes = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${regRes.body.token}`);
    assert.equal(meRes.status, 200);
    assert.equal(meRes.body.user.email, "sprint14@example.com");
    assert.ok(meRes.body.sessionsCount >= 1);

    // 4. Update Settings / Preferences
    const settingsRes = await request(app)
      .put("/api/auth/settings")
      .set("Authorization", `Bearer ${regRes.body.token}`)
      .send({
        name: "Sprint 14 Renamed",
        alertSound: true,
        emailNotificationsEnabled: true,
        alertDigestFrequency: "daily",
        themePreference: "light",
      });
    assert.equal(settingsRes.status, 200);
    assert.equal(settingsRes.body.user.name, "Sprint 14 Renamed");
    assert.equal(settingsRes.body.user.themePreference, "light");

    // Also test legacy updatePreferences mapping
    const prefRes = await request(app)
      .put("/api/auth/preferences")
      .set("Authorization", `Bearer ${regRes.body.token}`)
      .send({ alertSound: false, themePreference: "dark" });
    assert.equal(prefRes.status, 200);

    // 5. Change Password
    const badPw = await request(app)
      .put("/api/auth/password")
      .set("Authorization", `Bearer ${regRes.body.token}`)
      .send({ currentPassword: "WrongPassword1", newPassword: "NewPassword123" });
    assert.equal(badPw.status, 400);

    const goodPw = await request(app)
      .put("/api/auth/password")
      .set("Authorization", `Bearer ${regRes.body.token}`)
      .send({ currentPassword: "Password123", newPassword: "NewPassword123" });
    assert.equal(goodPw.status, 200);

    // 6. Token refresh & reuse detection
    const refreshCookie = (goodPw.headers["set-cookie"] || []).find((c) => c.startsWith("refresh_token="));
    assert.ok(refreshCookie);
    const refreshCookieVal = refreshCookie.split(";")[0];

    const refreshRes = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", [refreshCookieVal]);
    assert.equal(refreshRes.status, 200);
    assert.ok(refreshRes.body.token);

    // Replay old refresh token -> triggers reuse detection & revocation
    const reuseRes = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", [refreshCookieVal]);
    assert.equal(reuseRes.status, 401);

    // 7. Logout single session
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: "sprint14@example.com", password: "NewPassword123" });
    assert.equal(loginRes.status, 200);

    const loginRefreshCookie = (loginRes.headers["set-cookie"] || []).find((c) => c.startsWith("refresh_token="));
    const logoutRes = await request(app)
      .post("/api/auth/logout")
      .set("Authorization", `Bearer ${loginRes.body.token}`)
      .set("Cookie", [loginRefreshCookie.split(";")[0]]);
    assert.equal(logoutRes.status, 200);

    // 8. Logout all devices (remote session revocation)
    const login2 = await request(app)
      .post("/api/auth/login")
      .send({ email: "sprint14@example.com", password: "NewPassword123" });
    const logoutAllRes = await request(app)
      .post("/api/auth/logout-all")
      .set("Authorization", `Bearer ${login2.body.token}`);
    assert.equal(logoutAllRes.status, 200);

    // Old token must now be rejected
    const checkInvalidated = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${login2.body.token}`);
    assert.equal(checkInvalidated.status, 401);

    // 9. Export user data & Delete account (DPDP Act 2023)
    const login3 = await request(app)
      .post("/api/auth/login")
      .send({ email: "sprint14@example.com", password: "NewPassword123" });

    await request(app)
      .post("/api/watchlist")
      .set("Authorization", `Bearer ${login3.body.token}`)
      .send({ symbol: "INFY", companyName: "Infosys" });

    const exportRes = await request(app)
      .get("/api/auth/export-data")
      .set("Authorization", `Bearer ${login3.body.token}`);
    assert.equal(exportRes.status, 200);
    assert.equal(exportRes.body.user.email, "sprint14@example.com");
    assert.ok(Array.isArray(exportRes.body.watchlist));
    assert.ok(exportRes.body.watchlist.length > 0);

    // Account deletion - wrong password
    const delBad = await request(app)
      .delete("/api/auth/account")
      .set("Authorization", `Bearer ${login3.body.token}`)
      .send({ password: "WrongPassword" });
    assert.equal(delBad.status, 400);

    // Account deletion - success
    const delGood = await request(app)
      .delete("/api/auth/account")
      .set("Authorization", `Bearer ${login3.body.token}`)
      .send({ password: "NewPassword123" });
    assert.equal(delGood.status, 200);

    const deletedUser = await User.findOne({ email: "sprint14@example.com" });
    assert.equal(deletedUser, null);

    // 10. Forgot password & reset password flow
    await request(app)
      .post("/api/auth/register")
      .send({ name: "Forgot Pass", email: "forgot@example.com", password: "Password123" });

    const fpRes = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: "forgot@example.com" });
    assert.equal(fpRes.status, 200);

    const fpUser = await User.findOne({ email: "forgot@example.com" });
    assert.ok(fpUser.passwordResetHash);
    assert.ok(fpUser.passwordResetExpires);

    const resetJwt = jwt.sign(
      { id: fpUser._id, purpose: "password-reset" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    fpUser.passwordResetHash = crypto.createHash("sha256").update(resetJwt).digest("hex");
    await fpUser.save();

    const resetRes = await request(app)
      .post("/api/auth/reset-password")
      .send({ token: resetJwt, password: "NewPassword456" });
    assert.equal(resetRes.status, 200);
  });

  await t.test("sprint 15 research depth: financials, shareholding, events, news, screener, compare", async () => {
    // 1. Financial Statements (SP-35)
    const finRes = await request(app).get("/api/stocks/RELIANCE.NS/financials?period=annual");
    assert.equal(finRes.status, 200);
    assert.ok(Array.isArray(finRes.body.incomeStatements));
    assert.ok(Array.isArray(finRes.body.balanceSheets));
    assert.ok(Array.isArray(finRes.body.cashFlowStatements));
    assert.ok(finRes.body.summary);
    assert.ok(finRes.body.summary.roce !== undefined);

    const finQRes = await request(app).get("/api/stocks/RELIANCE.NS/financials?period=quarterly");
    assert.equal(finQRes.status, 200);
    assert.equal(finQRes.body.period, "quarterly");

    // 2. Shareholding Pattern & Trend (SP-36)
    const shRes = await request(app).get("/api/stocks/RELIANCE.NS/shareholding");
    assert.equal(shRes.status, 200);
    assert.ok(Array.isArray(shRes.body.quarters));
    assert.ok(shRes.body.quarters.length >= 4);
    assert.ok(shRes.body.quarters[0].promoter > 0);
    assert.ok(Array.isArray(shRes.body.insights));

    // 3. Corporate Actions & Events Calendar (SP-37)
    const stockEvents = await request(app).get("/api/stocks/RELIANCE.NS/events");
    assert.equal(stockEvents.status, 200);
    assert.ok(Array.isArray(stockEvents.body.dividends));
    assert.ok(Array.isArray(stockEvents.body.splits));

    const marketEvents = await request(app).get("/api/events");
    assert.equal(marketEvents.status, 200);
    assert.ok(Array.isArray(marketEvents.body.events));

    const divEvents = await request(app).get("/api/events?type=dividend");
    assert.equal(divEvents.status, 200);
    assert.ok(divEvents.body.events.every((e) => e.type === "dividend"));

    // 4. Per-Stock News & Announcements (SP-38)
    const newsRes = await request(app).get("/api/news/RELIANCE");
    assert.equal(newsRes.status, 200);
    assert.ok(Array.isArray(newsRes.body.news));
    assert.ok(newsRes.body.news.length > 0);
    assert.ok(newsRes.body.news[0].title);
    assert.ok(newsRes.body.news[0].sentiment);

    // 5. Full-Universe Screener & Saved Screens (SP-39)
    const screenerRes = await request(app)
      .post("/api/screener/query")
      .send({
        filters: { roe: { min: 10 } },
        sortBy: "marketCap",
        sortOrder: "desc",
        page: 1,
        limit: 20,
      });
    assert.equal(screenerRes.status, 200);
    assert.ok(Array.isArray(screenerRes.body.data));
    assert.ok(screenerRes.body.total >= 0);
    assert.ok(screenerRes.body.executionTimeMs >= 0);
    const warmQuery = await request(app)
      .post("/api/screener/query")
      .send({ sortBy: "marketCap", page: 1, limit: 10 });
    assert.equal(warmQuery.status, 200);
    assert.ok(warmQuery.body.executionTimeMs < 500);

    // Test CSV export
    const csvRes = await request(app)
      .post("/api/screener/query")
      .send({ format: "csv" });
    assert.equal(csvRes.status, 200);
    assert.ok(csvRes.headers["content-type"].includes("text/csv"));
    assert.ok(csvRes.text.includes("Symbol,Company Name"));

    const presetsRes = await request(app).get("/api/screener/presets");
    assert.equal(presetsRes.status, 200);
    assert.ok(Array.isArray(presetsRes.body.presets));
    assert.ok(presetsRes.body.presets.length >= 4);

    // Saved Screen CRUD
    const screenUserToken = await loginAs("screenuser@example.com", "Screen User");
    const saveRes = await request(app)
      .post("/api/screener/saved")
      .set("Authorization", `Bearer ${screenUserToken}`)
      .send({
        name: "My Custom Screen",
        filters: { roe: { min: 15 }, pe: { max: 25 } },
        sortBy: "roe",
      });
    assert.equal(saveRes.status, 201);
    assert.ok(saveRes.body.screen._id);

    const getSaved = await request(app)
      .get("/api/screener/saved")
      .set("Authorization", `Bearer ${screenUserToken}`);
    assert.equal(getSaved.status, 200);
    assert.equal(getSaved.body.screens.length, 1);

    const delSaved = await request(app)
      .delete(`/api/screener/saved/${saveRes.body.screen._id}`)
      .set("Authorization", `Bearer ${screenUserToken}`);
    assert.equal(delSaved.status, 200);

    // 6. Compare Up to 4 Stocks (SP-40)
    const compareRes = await request(app).get("/api/stocks/compare?symbols=RELIANCE,TCS");
    assert.equal(compareRes.status, 200);
    assert.equal(compareRes.body.stocks.length, 2);
    assert.ok(compareRes.body.highlights);
    assert.ok(compareRes.body.stocks[0].valuation);
    assert.ok(compareRes.body.stocks[0].profitability);
    assert.ok(compareRes.body.stocks[0].health);
    assert.ok(compareRes.body.stocks[0].pulseScore);
    assert.ok(Array.isArray(compareRes.body.stocks[0].chart));
  });
});
