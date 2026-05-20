import API from "../api/axios";

/* Market Indices */
export const getMarketIndices = async () => {

  try {

    const response = await API.get(

      "/stocks/live?symbols=%5ENSEI,%5EBSESN"

    );

    return response.data;

  } catch (error) {

    console.log(

      "Market Indices Error:",

      error

    );

    throw error;

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

    throw error;

  }

};