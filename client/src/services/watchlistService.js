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
export const addToWatchlist = async (stock) => {

  try {

    const response = await API.post(

      "/watchlist",

      {
        symbol: stock.symbol,
        companyName: stock.name
      }

    );

    return response.data;

  } catch (error) {

    console.log("Add Watchlist Error:", error);

    throw error;

  }

};

/* Remove Stock */
export const removeFromWatchlist = async (id) => {

  try {

    const response = await API.delete(

      `/watchlist/${id}`

    );

    return response.data;

  } catch (error) {

    console.log("Remove Watchlist Error:", error);

    throw error;

  }

};