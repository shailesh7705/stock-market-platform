import API from "../api/axios";

// Symbols such as M&M must be URL-encoded, so pass them via axios params / encodeURIComponent.
const symbolPath = (symbol) => encodeURIComponent(symbol);

export const searchStocks = async (query) => {
  try {
    const response = await API.get("/stocks/search", { params: { q: query } });
    return response.data;
  } catch (error) {
    console.log("Search Error:", error);
    throw error;
  }
};

export const getLiveStocks = async (symbols) => {
  try {
    const response = await API.get("/stocks/live", { params: { symbols: symbols.join(",") } });
    return response.data;
  } catch (error) {
    console.log("Live Stock Error:", error);
    throw error;
  }
};

export const getHistoricalData = async (symbol, range = "1mo") => {
  try {
    const response = await API.get(`/stocks/history/${symbolPath(symbol)}`, { params: { range } });
    return response.data;
  } catch (error) {
    console.log("Historical Data Error:", error);
    throw error;
  }
};

export const getStockDetails = async (symbol) => {
  try {
    const response = await API.get(`/stocks/details/${symbolPath(symbol)}`);
    return response.data;
  } catch (error) {
    console.log("Stock Details Error:", error);
    throw error;
  }
};

export const getPeerComparison = async (symbol) => {
  const response = await API.get(`/stocks/peers/${symbolPath(symbol)}`, { timeout: 45000 });
  return response.data;
};

export const getCuratedScreeners = async () => {
  const response = await API.get("/stocks/screeners", { timeout: 90000 });
  return response.data;
};

export const getBatchStockDetails = async (symbols) => {
  try {
    const response = await API.get("/stocks/details/batch", { params: { symbols: symbols.join(",") } });
    return response.data;
  } catch (error) {
    console.log("Batch Stock Details Error:", error);
    throw error;
  }
};
