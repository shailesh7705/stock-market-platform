import API from "../api/axios";

/* Get Watchlist */
export const getWatchlist = async () => {
  try {
    const response = await API.get("/watchlist");
    return response.data;
  } catch (error) {
    console.log("Watchlist Fetch Error:", error);
    throw error;
  }
};

/* Add Stock To Watchlist */
export const addToWatchlist = async (stockOrSymbol, optionalName) => {
  try {
    const symbol = typeof stockOrSymbol === "object" ? stockOrSymbol.symbol : stockOrSymbol;
    const companyName =
      typeof stockOrSymbol === "object"
        ? stockOrSymbol.companyName || stockOrSymbol.name || stockOrSymbol.symbol
        : optionalName || stockOrSymbol;

    const response = await API.post("/watchlist", {
      symbol,
      companyName,
    });
    return response.data;
  } catch (error) {
    console.log("Add Watchlist Error:", error);
    throw error;
  }
};

/* Remove Stock */
export const removeFromWatchlist = async (id) => {
  try {
    const response = await API.delete(`/watchlist/${id}`);
    return response.data;
  } catch (error) {
    console.log("Remove Watchlist Error:", error);
    throw error;
  }
};
