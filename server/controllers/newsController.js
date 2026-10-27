// server/controllers/newsController.js
const axios = require("axios");

let cachedNews = null;
let lastFetchTime = 0;
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

const FALLBACK_NEWS = [
  {
    title: "Nifty 50 and Sensex Consolidate Near Key Moving Averages Amid Strong FII Flows",
    description: "Benchmark indices traded in a steady range today as institutional investors evaluated quarterly corporate earnings and macroeconomic data.",
    image: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&auto=format&fit=crop&q=60",
    url: "https://www.moneycontrol.com/news/business/markets/",
    source: "Moneycontrol",
    publishedAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
  },
  {
    title: "RBI Monetary Policy Stance and Inflation Trends Anchor Market Sentiment",
    description: "Banking and financial services led market momentum following commentary on systemic liquidity and credit growth projections.",
    image: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=600&auto=format&fit=crop&q=60",
    url: "https://economictimes.indiatimes.com/markets",
    source: "Economic Times",
    publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    title: "IT & Auto Stocks Gain Momentum on Strong Export Outlook and Festive Demand",
    description: "Technology majors saw renewed buying interest following favorable deal pipelines and digital transformation contracts across North America.",
    image: "https://images.unsplash.com/photo-1642543492481-44e81e3914a7?w=600&auto=format&fit=crop&q=60",
    url: "https://www.livemint.com/market",
    source: "LiveMint",
    publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
  },
  {
    title: "India Inc Capital Expenditure Pipeline Reaches Multi-Year High Across Core Sectors",
    description: "Infrastructure, renewables, and manufacturing investments continue to drive long-term earnings upgrades for mid and large-cap equities.",
    image: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=600&auto=format&fit=crop&q=60",
    url: "https://www.business-standard.com/markets",
    source: "Business Standard",
    publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
  },
];

const getMarketNews = async (req, res) => {
  try {
    const now = Date.now();
    if (cachedNews && now - lastFetchTime < CACHE_TTL) {
      return res.status(200).json(cachedNews);
    }

    const apiKey = (process.env.NEWS_API_KEY || "").trim();
    if (!apiKey) {
      cachedNews = FALLBACK_NEWS;
      lastFetchTime = now;
      return res.status(200).json(FALLBACK_NEWS);
    }

    const response = await axios.get("https://newsapi.org/v2/everything", {
      params: {
        q: "Indian stock market OR NSE OR Sensex OR Nifty",
        sortBy: "publishedAt",
        language: "en",
        pageSize: 10,
        apiKey,
      },
      timeout: 5000,
    });

    const uniqueTitles = new Set();
    const formattedNews = (response.data?.articles || [])
      .filter((article) => {
        if (!article.title || uniqueTitles.has(article.title) || article.title === "[Removed]") {
          return false;
        }
        uniqueTitles.add(article.title);
        return true;
      })
      .slice(0, 6)
      .map((article) => ({
        title: article.title,
        description: article.description || "Click to read full market coverage.",
        image: article.urlToImage || FALLBACK_NEWS[0].image,
        url: article.url,
        source: article.source?.name || "Market News",
        publishedAt: article.publishedAt,
      }));

    if (formattedNews.length > 0) {
      cachedNews = formattedNews;
      lastFetchTime = now;
      return res.status(200).json(formattedNews);
    }

    cachedNews = FALLBACK_NEWS;
    lastFetchTime = now;
    return res.status(200).json(FALLBACK_NEWS);
  } catch (error) {
    console.warn("[News] NewsAPI request failed, using fallback:", error.message);
    if (cachedNews) return res.status(200).json(cachedNews);
    return res.status(200).json(FALLBACK_NEWS);
  }
};

module.exports = {
  getMarketNews,
};
