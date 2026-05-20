
const stocks = require("../data/stocks.json");
const YahooFinance = require("yahoo-finance2").default;

const yahooFinance = new YahooFinance();

const getStockData = async (req, res) => {

  try {

    const { symbol } = req.params;

    const stock = await yahooFinance.quote(symbol);

    res.status(200).json(stock);

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }

};

const searchStocks = async (req, res) => {

  try {

    const query = req.query.q?.toLowerCase();

    if (!query) {

      return res.status(200).json([]);

    }
const filteredStocks = stocks

  .filter((stock) => {

    const symbol =

      stock.symbol.toLowerCase();

    const name =

      stock.name.toLowerCase();

    return (

      symbol.startsWith(query) ||

      name.startsWith(query) ||

      symbol.includes(query) ||

      name.includes(query)

    );

  })

  .slice(0, 8);

    res.status(200).json(filteredStocks);

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }

};
const getMultipleStocks = async (req, res) => {

  try {

    const symbols = req.query.symbols?.split(",");

    if (!symbols || symbols.length === 0) {

      return res.status(400).json({
        message: "No symbols provided"
      });

    }

    const stockPromises = symbols.map((symbol) =>

      yahooFinance.quote(symbol)

    );

    const stocks = await Promise.all(stockPromises);

    const formattedStocks = stocks.map((stock) => ({

      symbol: stock.symbol,

      price: stock.regularMarketPrice,

      change: stock.regularMarketChangePercent,

      positive: stock.regularMarketChangePercent >= 0

    }));

    res.status(200).json(formattedStocks);

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }

};
const getHistoricalStockData = async (

  req,
  res

) => {

  try {

    const {

      symbol

    } = req.params;

    const {

      range = "1mo"

    } = req.query;

    let interval = "1d";

    if (range === "1d") {

      interval = "5m";

    }

    if (range === "1wk") {

      interval = "30m";

    }

    const result = await yahooFinance.chart(

      symbol,

      {

        period1: "2024-01-01",

        interval

      }

    );

    const formattedData =

      result.quotes.map((item) => ({

        date:

          new Date(item.date)

            .toLocaleDateString(

              "en-IN",

              {

                day: "numeric",

                month: "short"

              }

            ),

        price: item.close

      }));

    res.status(200).json(

      formattedData

    );

  } catch (error) {

    console.log(error);

    res.status(500).json({

      message:

        "Historical Data Error"

    });

  }

};

module.exports = {

  getStockData,

  searchStocks,

  getMultipleStocks,

  getHistoricalStockData

};