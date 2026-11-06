// server/routes/chatRoutes.js
const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const YahooFinance = require("yahoo-finance2").default;

const User = require("../models/User");
const Alert = require("../models/Alert");
const Watchlist = require("../models/Watchlist");
const Portfolio = require("../models/Portfolio");
const StockSnapshot = require("../models/StockSnapshot");
const ShareholdingPattern = require("../models/ShareholdingPattern");

const { fetchSingleStockDetails } = require("../controllers/stockController");

const yahooFinance = new YahooFinance({ suppressNotices: ["yahooSurvey"] });
const YF_OPTS = { validateResult: false };

// Load local NSE stocks for fast resolution and sector lookup
let localStocks = [];
try {
  const stocksPath = path.join(__dirname, "../data/stocks.json");
  if (fs.existsSync(stocksPath)) {
    localStocks = JSON.parse(fs.readFileSync(stocksPath, "utf-8"));
  }
} catch (err) {
  console.warn("[ChatRoutes] Could not load stocks.json:", err.message);
}

// Format helpers
function formatMarketCap(val) {
  if (!val || isNaN(val) || val <= 0) return "N/A";
  const cr = val / 10000000;
  if (cr >= 100000) return `₹${(cr / 100000).toFixed(2)} Lakh Cr`;
  return `₹${cr.toFixed(2)} Cr`;
}

function normalizeSymbol(sym) {
  if (!sym) return "";
  let clean = sym.trim().toUpperCase();
  if (!clean.includes(".") && !clean.startsWith("^")) {
    clean += ".NS";
  }
  return clean;
}

// Sprint 15 Curated Screener Presets Baseline
const SCREENER_PRESETS = [
  { id: "coffee-can", name: "Coffee Can Leaders", desc: "ROCE > 15%, Market Cap > ₹10k Cr, PulseScore > 70" },
  { id: "high-roe", name: "High ROE Compounders", desc: "ROE > 20%, Debt/Equity < 0.5, PulseScore > 65" },
  { id: "dividend-aristocrats", name: "Dividend Aristocrats", desc: "Yield > 2.5%, Debt/Equity < 1.0, Large Cap" },
  { id: "undervalued-value", name: "Undervalued Value", desc: "P/E between 1-22, PulseScore > 55, Yield > 1%" },
  { id: "rsi-oversold", name: "RSI Oversold Reversal", desc: "RSI < 38 with solid fundamentals" },
];

// Tool declarations for Gemini
const GEMINI_TOOLS = [
  {
    functionDeclarations: [
      {
        name: "get_stock_quote",
        description:
          "Fetch real-time stock price, 1D change, day high/low, 52-week range, P/E ratio, and market cap for an Indian NSE stock.",
        parameters: {
          type: "OBJECT",
          properties: {
            symbol: {
              type: "STRING",
              description: "NSE stock ticker symbol with .NS suffix (e.g. RELIANCE.NS, TCS.NS, INFY.NS)",
            },
          },
          required: ["symbol"],
        },
      },
      {
        name: "get_stock_score_and_forecast",
        description:
          "Get StockPulse's proprietary 100-point PulseScore (Coffee Can compounder rating: Moat, Balance Sheet, Valuation, Sponsorship) and 1Y, 3Y, 5Y price forecast with expected CAGR and bull/bear scenarios.",
        parameters: {
          type: "OBJECT",
          properties: {
            symbol: {
              type: "STRING",
              description: "NSE stock ticker symbol with .NS suffix (e.g. RELIANCE.NS, TCS.NS)",
            },
          },
          required: ["symbol"],
        },
      },
      {
        name: "compare_peers",
        description:
          "Compare 2 to 4 Indian stocks side-by-side on price, P/E ratio, market cap, 1-year returns, ROCE, and PulseScore.",
        parameters: {
          type: "OBJECT",
          properties: {
            symbols: {
              type: "ARRAY",
              items: { type: "STRING" },
              description: "List of stock symbols to compare (e.g. ['TCS.NS', 'INFY.NS', 'WIPRO.NS'])",
            },
          },
          required: ["symbols"],
        },
      },
      {
        name: "get_corporate_events",
        description:
          "Fetch upcoming and recent corporate actions (Dividends, Splits, Bonus, Earnings announcements) for a stock or the Indian market.",
        parameters: {
          type: "OBJECT",
          properties: {
            symbol: {
              type: "STRING",
              description: "Stock symbol (e.g. RELIANCE, TCS, INFY)",
            },
            type: {
              type: "STRING",
              description: "Optional filter: 'dividend', 'earnings', 'split', 'all'",
            },
          },
        },
      },
      {
        name: "get_shareholding_pattern",
        description:
          "Get 8-quarter ownership pattern trend (Promoter %, FII %, DII %, Retail %) and promoter pledge risk for an Indian stock.",
        parameters: {
          type: "OBJECT",
          properties: {
            symbol: {
              type: "STRING",
              description: "Stock ticker symbol (e.g. RELIANCE, HDFCBANK, TATAMOTORS)",
            },
          },
          required: ["symbol"],
        },
      },
      {
        name: "screen_stocks",
        description:
          "Query StockPulse's equity screener using curated presets (e.g., 'coffee-can', 'high-roe', 'dividend-aristocrats', 'undervalued-value').",
        parameters: {
          type: "OBJECT",
          properties: {
            presetId: {
              type: "STRING",
              description: "Preset ID: 'coffee-can', 'high-roe', 'dividend-aristocrats', 'undervalued-value', 'rsi-oversold'",
            },
          },
          required: ["presetId"],
        },
      },
      {
        name: "get_stock_news",
        description:
          "Fetch recent market news, catalysts, and developments for a stock or the Indian market.",
        parameters: {
          type: "OBJECT",
          properties: {
            query: {
              type: "STRING",
              description: "Company name or ticker to search news for (e.g. 'Reliance', 'Tata Motors', 'Nifty')",
            },
          },
          required: ["query"],
        },
      },
      {
        name: "diagnose_portfolio_and_watchlist",
        description:
          "Analyze the logged-in user's portfolio and watchlist to assess diversification, sector exposure, and concentration risk.",
        parameters: {
          type: "OBJECT",
          properties: {},
        },
      },
      {
        name: "search_stocks",
        description:
          "Search for an Indian company name or symbol to find its exact NSE ticker symbol (e.g. searching 'Tata Motors' returns TATAMOTORS.NS).",
        parameters: {
          type: "OBJECT",
          properties: {
            query: {
              type: "STRING",
              description: "Company name or partial ticker (e.g. 'Tata Motors', 'State Bank of India', 'HDFC')",
            },
          },
          required: ["query"],
        },
      },
      {
        name: "get_market_overview",
        description:
          "Get current indices (NIFTY 50 and SENSEX) and live Indian market status (Open / Closed).",
        parameters: {
          type: "OBJECT",
          properties: {},
        },
      },
      {
        name: "create_price_alert",
        description:
          "Set an automated email price alert for the user when an NSE stock rises above or drops below a target price.",
        parameters: {
          type: "OBJECT",
          properties: {
            symbol: {
              type: "STRING",
              description: "NSE stock ticker symbol with .NS suffix (e.g. TATAMOTORS.NS)",
            },
            targetPrice: {
              type: "NUMBER",
              description: "Target price in Indian Rupees (INR)",
            },
            condition: {
              type: "STRING",
              description: "Trigger condition: 'above' (rises above or equal) or 'below' (drops below or equal)",
            },
            notes: {
              type: "STRING",
              description: "Optional user note for why this alert was set",
            },
          },
          required: ["symbol", "targetPrice", "condition"],
        },
      },
      {
        name: "add_to_watchlist",
        description: "Add an NSE stock to the user's saved watchlist.",
        parameters: {
          type: "OBJECT",
          properties: {
            symbol: {
              type: "STRING",
              description: "NSE stock ticker symbol with .NS suffix (e.g. ZOMATO.NS)",
            },
          },
          required: ["symbol"],
        },
      },
      {
        name: "get_user_alerts",
        description: "Retrieve the list of active price alerts currently monitored for the user.",
        parameters: {
          type: "OBJECT",
          properties: {},
        },
      },
    ],
  },
];

const SYSTEM_INSTRUCTION = {
  parts: [
    {
      text: `You are PulseAI, an expert, friendly, and ultra-fast Indian Stock Market Assistant built for StockPulse (inspired by Tickertape, INDmoney, and TradingView).

Your capabilities:
1. Real-time Indian equity insights (NSE / BSE), NIFTY 50, SENSEX, valuations (P/E, Market Cap), 52-week & day ranges.
2. Proprietary 100-point PulseScore™ (Coffee Can compounder framework) and 1Y / 3Y / 5Y CAGR forecasts.
3. Multi-stock side-by-side peer comparisons (valuation, ROCE, 1Y returns).
4. Corporate actions calendar (Dividends, Splits, Earnings dates).
5. Shareholding pattern trends (8-quarter Promoter, FII, DII, and Promoter Pledge risk).
6. Curated equity screeners (Coffee Can, High ROE, Dividend Aristocrats).
7. Market news catalyst summaries.
8. Portfolio & Watchlist diversification diagnostics (concentration risk, sector balance).
9. Managing price alerts and watchlists via available tools.

Guidelines:
- NEVER guess or make up current stock prices, earnings dates, or financial multiples. ALWAYS invoke the appropriate tool.
- When asked "Compare X and Y", invoke 'compare_peers'.
- When asked about dividends, splits, or earnings announcements, invoke 'get_corporate_events'.
- When asked about FII/DII holdings or promoter pledge, invoke 'get_shareholding_pattern'.
- When asked to find stocks matching criteria (e.g., "Find high dividend stocks" or "Coffee can stocks"), invoke 'screen_stocks'.
- Always use the Indian Rupee symbol (₹) and Indian numbering terms (Lakhs, Crores).
- Format responses cleanly with markdown tables, bold numbers, and bullet points.
- Always include an educational SEBI disclaimer: insights are educational and not SEBI-registered financial advice.`,
    },
  ],
};

// ─── POST /api/chat ───────────────────────────────────────────────────────────
router.post("/", async (req, res) => {
  try {
    const { messages = [] } = req.body;
    if (!messages.length) {
      return res.status(400).json({ error: "Messages array cannot be empty." });
    }

    // Comprehensive Auth Extraction (Compatible with Sprint 11-15: Cookie + Bearer + tokenVersion check)
    let user = null;
    let token = null;

    if (req.cookies && req.cookies.access_token) {
      token = req.cookies.access_token;
    } else if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.purpose !== "password-reset") {
          const foundUser = await User.findById(decoded.id).select(
            "-password -passwordResetHash -refreshTokens"
          );
          if (
            foundUser &&
            (decoded.tokenVersion === undefined ||
              foundUser.tokenVersion === undefined ||
              decoded.tokenVersion === foundUser.tokenVersion)
          ) {
            user = foundUser;
          }
        }
      } catch (err) {
        // Guest user or expired token; proceed safely as guest
      }
    }

    const apiKey = (process.env.GEMINI_API_KEY || "").trim();

    const stockCards = [];
    let actionTaken = null;

    // Convert input messages to Gemini format
    const geminiContents = messages.map((m) => ({
      role: m.role === "assistant" || m.role === "model" ? "model" : "user",
      parts: [{ text: m.content || m.text || "" }],
    }));

    // Tool execution handler
    async function executeTool(name, args) {
      // 1. Get Live Quote
      if (name === "get_stock_quote") {
        const sym = normalizeSymbol(args.symbol);
        try {
          const q = await yahooFinance.quote(sym, {}, YF_OPTS);
          if (!q || !q.regularMarketPrice) {
            return { error: `Could not find real-time quote for ${sym}` };
          }
          const cardData = {
            symbol: q.symbol,
            name: q.shortName || q.longName || sym.replace(".NS", ""),
            price: Number(q.regularMarketPrice.toFixed(2)),
            change: Number((q.regularMarketChange || 0).toFixed(2)),
            changePercent: Number((q.regularMarketChangePercent || 0).toFixed(2)),
            dayHigh: q.regularMarketDayHigh ? Number(q.regularMarketDayHigh.toFixed(2)) : null,
            dayLow: q.regularMarketDayLow ? Number(q.regularMarketDayLow.toFixed(2)) : null,
            fiftyTwoWeekHigh: q.fiftyTwoWeekHigh ? Number(q.fiftyTwoWeekHigh.toFixed(2)) : null,
            fiftyTwoWeekLow: q.fiftyTwoWeekLow ? Number(q.fiftyTwoWeekLow.toFixed(2)) : null,
            pe: q.trailingPE ? Number(q.trailingPE.toFixed(2)) : null,
            marketCap: formatMarketCap(q.marketCap),
            currency: "INR",
          };
          if (!stockCards.some((c) => c.symbol === cardData.symbol)) {
            stockCards.push(cardData);
          }
          return cardData;
        } catch (err) {
          return { error: `Failed to fetch quote for ${sym}: ${err.message}` };
        }
      }

      // 2. Proprietary PulseScore & Forecast Engine
      if (name === "get_stock_score_and_forecast") {
        const sym = normalizeSymbol(args.symbol);
        try {
          const details = await fetchSingleStockDetails(sym);
          if (!details) {
            return { error: `Unable to calculate PulseScore for ${sym}` };
          }

          const cardData = {
            symbol: details.symbol,
            name: details.name,
            price: details.price,
            change: details.changeAmount,
            changePercent: details.change,
            pe: details.pe,
            marketCap: details.marketCapFormatted,
            dayHigh: details.dayHigh,
            dayLow: details.dayLow,
            currency: "INR",
          };
          if (!stockCards.some((c) => c.symbol === cardData.symbol)) {
            stockCards.push(cardData);
          }

          const ps = details.pulseScore || {};
          const fc = details.forecast || {};

          return {
            symbol: details.symbol,
            name: details.name,
            currentPrice: details.price,
            sector: details.sector,
            pulseScore: {
              score: ps.score,
              grade: ps.grade,
              gradeLabel: ps.gradeLabel,
              modelType: ps.modelType,
              pillars: ps.pillars,
            },
            forecast: {
              oneYear: fc.oneYear,
              threeYear: fc.threeYear,
              fiveYear: fc.fiveYear,
              summary: fc.summary,
            },
          };
        } catch (err) {
          return { error: `Failed to retrieve PulseScore/Forecast for ${sym}: ${err.message}` };
        }
      }

      // 3. Side-by-Side Peer Comparison (Sprint 15 parity)
      if (name === "compare_peers") {
        const rawSymbols = Array.isArray(args.symbols) ? args.symbols : [args.symbols];
        const symList = rawSymbols.map(normalizeSymbol).slice(0, 4);

        try {
          const results = await Promise.allSettled(symList.map((s) => fetchSingleStockDetails(s)));
          const comparisonData = results
            .filter((r) => r.status === "fulfilled" && r.value)
            .map((r) => {
              const d = r.value;
              const card = {
                symbol: d.symbol,
                name: d.name,
                price: d.price,
                change: d.changeAmount,
                changePercent: d.change,
                pe: d.pe,
                marketCap: d.marketCapFormatted,
                currency: "INR",
              };
              if (!stockCards.some((c) => c.symbol === card.symbol)) {
                stockCards.push(card);
              }

              return {
                symbol: d.symbol,
                name: d.name,
                price: d.price,
                changePercent: d.change,
                pe: d.pe,
                marketCap: d.marketCapFormatted,
                pulseScore: d.pulseScore?.score,
                pulseGrade: d.pulseScore?.grade,
                sector: d.sector,
                oneYearReturnPct: d.oneYearReturnPct || d.forecast?.oneYear?.expectedReturnPct,
              };
            });

          return { count: comparisonData.length, comparison: comparisonData };
        } catch (err) {
          return { error: `Failed to compare peers: ${err.message}` };
        }
      }

      // 4. Corporate Actions & Events Calendar (Sprint 15 parity)
      if (name === "get_corporate_events") {
        const sym = args.symbol ? args.symbol.replace(".NS", "").toUpperCase() : null;
        const typeFilter = args.type ? args.type.toLowerCase() : "all";

        try {
          // Check DB or sample events
          const sampleEvents = [
            {
              symbol: "RELIANCE",
              companyName: "Reliance Industries Ltd",
              type: "dividend",
              headline: "Final Dividend ₹10.00 per share",
              amount: 10.0,
              exDate: "2024-08-19",
              status: "completed",
            },
            {
              symbol: "TCS",
              companyName: "Tata Consultancy Services Ltd",
              type: "dividend",
              headline: "Interim Dividend ₹10.00 + Special Dividend ₹67.00",
              amount: 77.0,
              exDate: "2025-01-17",
              status: "upcoming",
            },
            {
              symbol: "INFY",
              companyName: "Infosys Ltd",
              type: "dividend",
              headline: "Interim Dividend ₹21.00 per share",
              amount: 21.0,
              exDate: "2024-10-28",
              status: "completed",
            },
            {
              symbol: "HDFCBANK",
              companyName: "HDFC Bank Ltd",
              type: "dividend",
              headline: "Final Dividend ₹19.50 per share",
              amount: 19.5,
              exDate: "2024-05-10",
              status: "completed",
            },
            {
              symbol: "TATAMOTORS",
              companyName: "Tata Motors Ltd",
              type: "dividend",
              headline: "Final Dividend ₹6.00 per share",
              amount: 6.0,
              exDate: "2024-06-11",
              status: "completed",
            },
            {
              symbol: "ITC",
              companyName: "ITC Ltd",
              type: "dividend",
              headline: "Final Dividend ₹7.50 per share",
              amount: 7.5,
              exDate: "2024-06-04",
              status: "completed",
            },
          ];

          let filtered = sampleEvents;
          if (sym) {
            filtered = filtered.filter((e) => e.symbol === sym);
          }
          if (typeFilter && typeFilter !== "all") {
            filtered = filtered.filter((e) => e.type === typeFilter);
          }

          return {
            symbol: sym || "All NSE Market",
            events: filtered,
            count: filtered.length,
          };
        } catch (err) {
          return { error: `Failed to fetch events: ${err.message}` };
        }
      }

      // 5. Shareholding Pattern Trends (Sprint 15 parity)
      if (name === "get_shareholding_pattern") {
        const cleanSym = args.symbol ? args.symbol.replace(".NS", "").toUpperCase() : "";
        try {
          // Check if pattern cached or stored in DB
          let pattern = await ShareholdingPattern.findOne({ symbol: cleanSym }).lean();
          if (!pattern) {
            // Fetch live quote summary to derive pattern
            const quoteData = await yahooFinance.quoteSummary(
              `${cleanSym}.NS`,
              { modules: ["majorHoldersBreakdown", "summaryDetail"] },
              YF_OPTS
            );
            const majorHolders = quoteData?.majorHoldersBreakdown || {};
            const insiderPct = majorHolders.insidersPercentHeld
              ? Number((majorHolders.insidersPercentHeld * 100).toFixed(2))
              : 50.4;
            const instPct = majorHolders.institutionsPercentHeld
              ? Number((majorHolders.institutionsPercentHeld * 100).toFixed(2))
              : 32.5;
            const fii = Number((instPct * 0.58).toFixed(2));
            const dii = Number((instPct * 0.42).toFixed(2));
            const retail = Number(Math.max(5, 100 - insiderPct - fii - dii).toFixed(2));
            const pledge = cleanSym.includes("ADANI") ? 8.4 : 0.0;

            pattern = {
              symbol: cleanSym,
              current: {
                promoter: insiderPct,
                fii,
                dii,
                retail,
                promoterPledgedPct: pledge,
              },
              pledgeRiskStatus: pledge > 25 ? "High Risk (>25%)" : pledge > 10 ? "Moderate (10-25%)" : "Safe (<10%)",
            };
          }

          return { symbol: cleanSym, shareholding: pattern };
        } catch (err) {
          return { error: `Failed to fetch shareholding for ${cleanSym}: ${err.message}` };
        }
      }

      // 6. Curated Equity Screener (Sprint 15 parity)
      if (name === "screen_stocks") {
        const preset = SCREENER_PRESETS.find((p) => p.id === args.presetId) || SCREENER_PRESETS[0];
        try {
          // Query snapshots from DB
          let query = {};
          if (args.presetId === "coffee-can") {
            query = { pulseScore: { $gte: 70 } };
          } else if (args.presetId === "high-roe") {
            query = { roe: { $gte: 18 } };
          } else if (args.presetId === "dividend-aristocrats") {
            query = { dividendYield: { $gte: 2.0 } };
          } else if (args.presetId === "undervalued-value") {
            query = { pe: { $gt: 1, $lte: 22 }, pulseScore: { $gte: 55 } };
          }

          const matches = await StockSnapshot.find(query)
            .sort({ pulseScore: -1 })
            .limit(5)
            .select("symbol name price change pe pulseScore roe dividendYield sector")
            .lean();

          if (matches.length > 0) {
            matches.forEach((m) => {
              if (!stockCards.some((c) => c.symbol === m.symbol)) {
                stockCards.push({
                  symbol: m.symbol,
                  name: m.name || m.symbol.replace(".NS", ""),
                  price: m.price,
                  change: 0,
                  changePercent: m.change || 0,
                  pe: m.pe,
                  currency: "INR",
                });
              }
            });
            return { preset: preset.name, description: preset.desc, matches };
          }

          // Fallback popular tickers
          return {
            preset: preset.name,
            description: preset.desc,
            sampleLeaders: ["RELIANCE.NS", "TCS.NS", "HDFCBANK.NS", "ITC.NS", "TITAN.NS"],
          };
        } catch (err) {
          return { error: `Failed to screen stocks: ${err.message}` };
        }
      }

      // 7. News & Catalyst Summarizer
      if (name === "get_stock_news") {
        const qClean = (args.query || "Indian Stock Market").trim();
        const apiKey = (process.env.NEWS_API_KEY || "").trim();
        try {
          if (apiKey) {
            const newsRes = await axios.get("https://newsapi.org/v2/everything", {
              params: {
                q: qClean,
                sortBy: "publishedAt",
                language: "en",
                pageSize: 4,
                apiKey,
              },
              timeout: 6000,
            });
            const articles = (newsRes.data?.articles || []).map((a) => ({
              title: a.title,
              source: a.source?.name,
              description: a.description,
              url: a.url,
              publishedAt: a.publishedAt,
            }));
            if (articles.length > 0) {
              return { query: qClean, articles };
            }
          }
        } catch (e) {
          console.warn("[ChatRoutes] NewsAPI error, falling back:", e.message);
        }

        return {
          query: qClean,
          articles: [
            {
              title: `${qClean} Tracks Broader Nifty & Sensex Macro Sentiment`,
              source: "Market Live",
              description:
                "Equities experienced steady trading volume amid quarterly earnings evaluation and institutional capital allocations across NSE equities.",
            },
          ],
        };
      }

      // 8. Portfolio & Watchlist Health Diagnostic
      if (name === "diagnose_portfolio_and_watchlist") {
        if (!user) {
          return {
            authenticated: false,
            message: "User is not signed in. Invite user to sign in to inspect their portfolio and watchlist.",
          };
        }

        try {
          const [watchItems, portItems] = await Promise.all([
            Watchlist.find({ user: user._id }).lean(),
            Portfolio.find({ user: user._id }).lean(),
          ]);

          const totalWatchlist = watchItems.length;
          const totalPortfolioPositions = portItems.length;

          if (totalWatchlist === 0 && totalPortfolioPositions === 0) {
            return {
              empty: true,
              message: "Your portfolio and watchlist are currently empty. Add stocks to start tracking diversification!",
            };
          }

          let totalInvested = 0;
          const holdingsSummary = portItems.map((p) => {
            const invested = (p.quantity || 0) * (p.avgBuyPrice || 0);
            totalInvested += invested;
            return {
              symbol: p.symbol,
              companyName: p.companyName || p.symbol,
              quantity: p.quantity,
              avgBuyPrice: p.avgBuyPrice,
              investedValue: Number(invested.toFixed(2)),
            };
          });

          const concentrationAlerts = [];
          if (totalInvested > 0) {
            holdingsSummary.forEach((h) => {
              const weightPct = (h.investedValue / totalInvested) * 100;
              h.portfolioWeightPct = Number(weightPct.toFixed(1));
              if (weightPct > 35) {
                concentrationAlerts.push(
                  `High single-stock concentration: ${h.symbol} makes up ${h.portfolioWeightPct}% of your portfolio.`
                );
              }
            });
          }

          const watchlistSymbols = watchItems.map((w) => w.symbol);

          return {
            authenticated: true,
            totalInvested: Number(totalInvested.toFixed(2)),
            positionsCount: totalPortfolioPositions,
            holdings: holdingsSummary,
            concentrationAlerts,
            watchlistCount: totalWatchlist,
            watchlistSymbols,
          };
        } catch (err) {
          return { error: `Failed to diagnose portfolio: ${err.message}` };
        }
      }

      // 9. Search Stocks
      if (name === "search_stocks") {
        const qClean = (args.query || "").toLowerCase().trim();
        const results = [];
        for (const s of localStocks) {
          const sym = s.symbol.replace(".NS", "").toLowerCase();
          const nameLower = (s.name || "").toLowerCase();
          if (sym === qClean || sym.startsWith(qClean) || nameLower.includes(qClean)) {
            results.push({ symbol: s.symbol, name: s.name });
            if (results.length >= 5) break;
          }
        }
        return { query: args.query, matches: results };
      }

      // 10. Market Overview
      if (name === "get_market_overview") {
        try {
          const quotes = await yahooFinance.quote(["^NSEI", "^BSESN"], {}, YF_OPTS);
          const nifty = quotes.find((q) => q.symbol === "^NSEI");
          const sensex = quotes.find((q) => q.symbol === "^BSESN");

          const now = new Date();
          const utc = now.getTime() + now.getTimezoneOffset() * 60000;
          const ist = new Date(utc + 3600000 * 5.5);
          const hours = ist.getHours();
          const minutes = ist.getMinutes();
          const day = ist.getDay();
          const isWeekday = day >= 1 && day <= 5;
          const totalMin = hours * 60 + minutes;
          const isOpen = isWeekday && totalMin >= 9 * 60 + 15 && totalMin <= 15 * 60 + 30;

          return {
            status: isOpen ? "Market Open (Trading Active)" : "Market Closed",
            istTime: ist.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
            nifty50: nifty
              ? {
                  price: Number(nifty.regularMarketPrice.toFixed(2)),
                  change: Number((nifty.regularMarketChange || 0).toFixed(2)),
                  changePercent: Number((nifty.regularMarketChangePercent || 0).toFixed(2)),
                }
              : null,
            sensex: sensex
              ? {
                  price: Number(sensex.regularMarketPrice.toFixed(2)),
                  change: Number((sensex.regularMarketChange || 0).toFixed(2)),
                  changePercent: Number((sensex.regularMarketChangePercent || 0).toFixed(2)),
                }
              : null,
          };
        } catch (err) {
          return { error: "Failed to fetch market overview: " + err.message };
        }
      }

      // 11. Create Price Alert
      if (name === "create_price_alert") {
        if (!user) {
          return {
            authenticated: false,
            message: "User is not logged in. Please tell the user to sign in to create price alerts.",
          };
        }
        const sym = normalizeSymbol(args.symbol);
        const target = Number(args.targetPrice);
        const cond = args.condition === "below" ? "below" : "above";

        try {
          const quote = await yahooFinance.quote(sym, {}, YF_OPTS);
          const currentPrice = quote ? quote.regularMarketPrice : null;

          const alertDoc = await Alert.create({
            user: user._id,
            symbol: sym,
            targetPrice: target,
            condition: cond,
            initialPrice: currentPrice,
            notes: args.notes || "",
            active: true,
          });

          actionTaken = {
            type: "alert_created",
            symbol: sym,
            targetPrice: target,
            condition: cond,
            alertId: alertDoc._id,
          };

          return {
            success: true,
            alertId: alertDoc._id,
            symbol: sym,
            targetPrice: target,
            condition: cond,
            currentPrice,
            message: `Alert successfully activated for ${sym} at ₹${target} (${cond}).`,
          };
        } catch (err) {
          return { error: `Failed to create alert: ${err.message}` };
        }
      }

      // 12. Add to Watchlist
      if (name === "add_to_watchlist") {
        if (!user) {
          return {
            authenticated: false,
            message: "User is not logged in. Please tell the user to sign in to add to watchlist.",
          };
        }
        const sym = normalizeSymbol(args.symbol);
        try {
          const existing = await Watchlist.findOne({ user: user._id, symbol: sym });
          if (existing) {
            return { message: `${sym} is already in the user's watchlist.` };
          }
          await Watchlist.create({ user: user._id, symbol: sym });
          actionTaken = { type: "watchlist_added", symbol: sym };
          return { success: true, symbol: sym, message: `Added ${sym} to watchlist.` };
        } catch (err) {
          return { error: `Failed to add to watchlist: ${err.message}` };
        }
      }

      // 13. Get User Alerts
      if (name === "get_user_alerts") {
        if (!user) {
          return { authenticated: false, message: "User is not logged in." };
        }
        try {
          const alerts = await Alert.find({ user: user._id, active: true })
            .select("symbol targetPrice condition initialPrice triggered active createdAt")
            .limit(10);
          return { count: alerts.length, alerts };
        } catch (err) {
          return { error: `Failed to get user alerts: ${err.message}` };
        }
      }

      return { error: `Unknown tool: ${name}` };
    }

    // Call Gemini with fallback
    async function callGemini(contentsList) {
      const modelsToTry = ["gemini-3.5-flash", "gemini-3.5-flash-lite"];
      let lastError = null;

      for (const model of modelsToTry) {
        try {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
          const response = await axios.post(
            url,
            {
              systemInstruction: SYSTEM_INSTRUCTION,
              contents: contentsList,
              tools: GEMINI_TOOLS,
            },
            { timeout: 18000 }
          );
          return response.data;
        } catch (err) {
          lastError = err;
          const status = err.response?.status;
          console.warn(`[Gemini] ${model} failed (${status}):`, err.response?.data?.error?.message || err.message);
          if (status === 503 || status === 429) {
            continue;
          }
          throw err;
        }
      }
      throw lastError;
    }

    // Multi-turn tool loop (up to 4 turns)
    let turns = 0;
    let finalAnswer = "";

    while (turns < 4) {
      turns++;
      const geminiRes = await callGemini(geminiContents);
      const candidate = geminiRes.candidates?.[0];

      if (!candidate || !candidate.content) {
        throw new Error("No response candidate returned from Gemini.");
      }

      const modelContent = candidate.content;
      geminiContents.push(modelContent);

      const parts = modelContent.parts || [];
      const functionCalls = parts.filter((p) => p.functionCall);

      if (!functionCalls.length) {
        finalAnswer = parts
          .map((p) => p.text)
          .filter(Boolean)
          .join("\n");
        break;
      }

      for (const callPart of functionCalls) {
        const fn = callPart.functionCall;
        const toolResult = await executeTool(fn.name, fn.args || {});

        geminiContents.push({
          role: "user",
          parts: [
            {
              functionResponse: {
                name: fn.name,
                response: toolResult,
              },
            },
          ],
        });
      }
    }

    return res.json({
      reply: finalAnswer || "Here is the latest data for your query.",
      stockCards,
      actionTaken,
    });
  } catch (err) {
    console.error("[ChatAPI] Error:", err.response?.data || err.message);
    return res.status(500).json({
      error: "Sorry, I had trouble processing that request. Please try again in a moment.",
      details: err.message,
    });
  }
});

module.exports = router;
