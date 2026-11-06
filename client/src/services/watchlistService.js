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
    const listName = typeof stockOrSymbol === "object" ? stockOrSymbol.listName : undefined;
    const tags = typeof stockOrSymbol === "object" ? stockOrSymbol.tags : undefined;

    const response = await API.post("/watchlist", {
      symbol,
      companyName,
      listName,
      tags,
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

export const getWatchlistBoards = async () => {
  const response = await API.get("/watchlist/boards");
  return response.data;
};

export const createWatchlistBoard = async (name) => {
  const response = await API.post("/watchlist/boards", { name });
  return response.data;
};

export const deleteWatchlistBoard = async (name) => {
  const response = await API.delete(`/watchlist/boards/${encodeURIComponent(name)}`);
  return response.data;
};

export const reorderWatchlist = async (listName, orderedIds) => {
  const response = await API.patch("/watchlist/reorder", { listName, orderedIds });
  return response.data;
};

export const updateWatchlistItem = async (id, payload) => {
  const response = await API.patch(`/watchlist/${id}`, payload);
  return response.data;
};

export const exportWatchlist = async (listName) => {
  const response = await API.get("/watchlist/export", {
    params: listName ? { list: listName } : {},
    responseType: "blob",
  });
  return response.data;
};
