const axios = require("axios");

const getMarketNews = async (

  req,
  res

) => {

  try {

    const response = await axios.get(

      "https://newsapi.org/v2/everything",

      {

        params: {

          q:

            "Indian stock market OR NSE OR Sensex",

          sortBy: "publishedAt",

          language: "en",

          pageSize: 12,

          apiKey:

            process.env.NEWS_API_KEY

        }

      }

    );

   const uniqueTitles = new Set();

const formattedNews =

  response.data.articles

    .filter((article) => {

      if (

        !article.title ||

        uniqueTitles.has(article.title)

      ) {

        return false;

      }

      uniqueTitles.add(article.title);

      return true;

    })

    .slice(0, 6)

    .map((article) => ({

      title: article.title,

      description:

        article.description,

      image: article.urlToImage,

      url: article.url,

      source:

        article.source.name,

      publishedAt:

        article.publishedAt

    }));

    res.status(200).json(

      formattedNews

    );

  } catch (error) {

    console.log(error);

    res.status(500).json({

      message: "News Fetch Error"

    });

  }

};

module.exports = {

  getMarketNews

};