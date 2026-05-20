import API from "../api/axios";

export const getMarketNews = async () => {

  try {

    const response = await API.get(

      "/news/market"

    );

    return response.data;

  } catch (error) {

    console.log(error);

    throw error;

  }

};