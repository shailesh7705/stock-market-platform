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
          "Symbols required"

      });

    }

    const symbolList =
      symbols.split(",");

    const results =
      await Promise.allSettled(

        symbolList.map(

          async (symbol) => {

            try {

              const quote =
                await yahooFinance.quote(
                  symbol
                );

              return {

                symbol,

                name:
                  quote.longName ||
                  quote.shortName ||
                  symbol,

                price:
                  quote.regularMarketPrice || 0,

                change:
                  quote.regularMarketChange || 0,

                changePercent:
                  quote.regularMarketChangePercent || 0,

              };

            } catch (err) {

              console.log(

                `Failed: ${symbol}`

              );

              return null;

            }

          }

        )

      );

    const stocks =
      results

        .filter(

          (r) =>

            r.status ===
              "fulfilled" &&

            r.value

        )

        .map((r) => r.value);

    res.json(stocks);

  } catch (error) {

    console.log(error);

    res.status(500).json({

      message:
        "Failed to fetch stocks"

    });

  }

};

module.exports = {

  getLiveStocks

};