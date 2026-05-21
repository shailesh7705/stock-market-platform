// client/src/services/marketService.js
import API from "../api/axios";

/* Market Indices — NIFTY 50 + SENSEX */
export const getMarketIndices = async () => {
  try {
    // FIX — use dedicated indices endpoint
    const response = await API.get("/stocks/indices");
    return response.data;
  } catch (error) {
    console.log("Market Indices Error:", error);
    return [];
  }
};

/* Market Movers */
export const getMarketMovers = async () => {
  try {
    // FIX — use dedicated movers endpoint
    const response = await API.get("/stocks/movers");
    return response.data;
  } catch (error) {
    console.log("Market Movers Error:", error);
    return [];
  }
};