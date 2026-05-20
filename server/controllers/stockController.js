const yahooFinance =
  require("yahoo-finance2").default;

// LIVE STOCKS
const getLiveStocks = async (

  req,
  res

) => {

  try {

    const symbols =
      req.query.symbols;

    if (!symbols) {

      return res.status(400).json({

        message:
          "Symbols are required"

      });

    }

    const symbolList =
      symbols.split(",");

    const stocks = [];

    for (const symbol of symbolList) {

      try {

        const cleanSymbol =
          symbol.trim();

        const quote =
          await yahooFinance.quote(
            cleanSymbol
          );

        if (

          !quote ||

          !quote.regularMarketPrice

        ) {

          continue;

        }

        stocks.push({

          symbol: cleanSymbol,

          name:
            quote.longName ||
            quote.shortName ||
            cleanSymbol,

          price:
            quote.regularMarketPrice,

          change:
            quote.regularMarketChange || 0,

          changePercent:
            quote.regularMarketChangePercent || 0,

        });

      } catch (err) {

        console.log(

          `Failed symbol: ${symbol}`

        );

      }

    }

    return res.json(stocks);

  } catch (error) {

    console.log(

      "Live Stock Error:",

      error.message

    );

    return res.status(500).json({

      message:
        "Internal server error",

      error:
        error.message

    });

  }

};

// HISTORICAL DATA
const getHistoricalData =
  async (req, res) => {

    try {

      const symbol =
        req.params.symbol;

      const queryOptions = {

        period1:
          new Date(

            Date.now() -

            30 * 24 * 60 * 60 * 1000

          ),

        interval: "1d",

      };

      const result =
        await yahooFinance.chart(

          symbol,

          queryOptions

        );

      const chartData =

        result.quotes.map(

          (item) => ({

            date:
              new Date(
                item.date
              ).toLocaleDateString(

                "en-IN",

                {

                  day: "numeric",

                  month: "short",

                }

              ),

            price:
              item.close || 0,

          })

        );

      res.json(chartData);

    } catch (error) {

      console.log(

        "Historical Error:",

        error.message

      );

      res.status(500).json({

        message:
          "Failed historical data"

      });

    }

  };

module.exports = {

  getLiveStocks,

  getHistoricalData,

};