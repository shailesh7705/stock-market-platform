import API from "../api/axios";

export const searchStocks = async (query) => {
  try {
    const response = await API.get(`/stocks/search?q=${query}`);
    return response.data;
  } catch (error) {
    console.log("Search Error:", error);
    throw error;
  }
};

export const getLiveStocks = async (symbols) => {
  try {
    const response = await API.get(`/stocks/live?symbols=${symbols.join(",")}`);
    return response.data;
  } catch (error) {
    console.log("Live Stock Error:", error);
    throw error;
  }
};

export const getHistoricalData = async (symbol, range = "1mo") => {
  try {
    const response = await API.get(`/stocks/history/${symbol}?range=${range}`);
    return response.data;
  } catch (error) {
    console.log("Historical Data Error:", error);
    throw error;
  }
};

export const getStockDetails = async (symbol) => {
  try {
    const response = await API.get(`/stocks/details/${symbol}`);
    return response.data;
  } catch (error) {
    console.log("Stock Details Error:", error);
    throw error;
  }
};

export const getBatchStockDetails = async (symbols) => {
  try {
    const response = await API.get(`/stocks/details/batch?symbols=${symbols.join(",")}`);
    return response.data;
  } catch (error) {
    console.log("Batch Stock Details Error:", error);
    throw error;
  }
};
