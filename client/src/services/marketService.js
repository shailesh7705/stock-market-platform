// client/src/services/marketService.js
import API from "../api/axios";

/* Market Indices — NIFTY 50 + SENSEX */
export const getMarketIndices = async () => {
  try {
    const response = await API.get("/stocks/indices");
    const body = response.data;
    if (Array.isArray(body)) return { data: body, stale: false, asOf: null };
    return {
      data: Array.isArray(body?.data) ? body.data : [],
      stale: Boolean(body?.stale),
      asOf: body?.asOf || null,
    };
  } catch (error) {
    console.log("Market Indices Error:", error);
    return { data: [], stale: false, asOf: null };
  }
};

/* NSE holiday calendar */
let calendarRequest = null;
export const getMarketCalendar = () => {
  calendarRequest ??= API.get("/market/calendar")
    .then((response) => response.data)
    .catch((error) => {
      calendarRequest = null;
      throw error;
    });
  return calendarRequest;
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