import API from "../api/axios";

/* Market Indices */
export const getMarketIndices = async () => {

  try {

    // Using stable NSE stocks instead of indices
    const response = await API.get(

      "/stocks/live?symbols=RELIANCE.NS,TCS.NS"

    );

    return response.data;

  } catch (error) {

    console.log(

      "Market Indices Error:",

      error

    );

    return [];

  }

};

/* Market Movers */
export const getMarketMovers = async () => {

  try {

    const symbols = [

      "RELIANCE.NS",

      "TCS.NS",

      "INFY.NS",

      "HDFCBANK.NS",

      "ICICIBANK.NS",

      "SBIN.NS",

      "LT.NS",

      "AXISBANK.NS",

      "ONGC.NS",

      "BPCL.NS",

      "ITC.NS"

    ];

    const response = await API.get(

      `/stocks/live?symbols=${symbols.join(",")}`

    );

    return response.data;

  } catch (error) {

    console.log(

      "Market Movers Error:",

      error

    );

    return [];

  }

};