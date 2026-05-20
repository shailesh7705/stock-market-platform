import { useState } from "react";
import { fetchStock } from "../services/stockService";
import { addWatchlistStock } from "../services/watchlistService";
import { createAlert } from "../services/alertService";

function StockSearch() {

  const [symbol, setSymbol] = useState("");
  const [stockData, setStockData] = useState(null);
  const [targetPrice, setTargetPrice] = useState("");

  async function handleSearch() {

    try {

      const data = await fetchStock(symbol);

      setStockData(data);

    } catch (error) {

      console.log(error);

      alert("Stock Not Found");

    }

  }
  async function handleAddWatchlist() {

  try {

    await addWatchlistStock({

      symbol: stockData.symbol,
      companyName: stockData.longName

    });

    alert("Added To Watchlist");

  } catch (error) {

    console.log(error);

  }

}
async function handleCreateAlert() {

  try {

    await createAlert({
      symbol: stockData.symbol,
      targetPrice
    });

    alert("Alert Created");

  } catch (error) {

  console.log(error.response?.data || error);

  alert("Failed To Add Watchlist");

}

}

  return (
    <div className="mb-10">

      <div className="flex gap-4 flex-wrap">

        <input
          type="text"
          placeholder="Enter Stock Symbol (Example: TCS.NS)"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          className="bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 w-full md:w-96"
        />

        <button
          onClick={handleSearch}
          className="bg-green-500 hover:bg-green-600 px-6 py-3 rounded-xl"
        >
          Search
        </button>

      </div>

      {stockData && (

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mt-8">

          <h2 className="text-3xl font-bold text-green-400">
            {stockData.longName}
          </h2>

          <p className="mt-4 text-xl">
            Symbol: {stockData.symbol}
          </p>

          <p className="mt-2 text-xl">
            Current Price: ₹{stockData.regularMarketPrice}
          </p>

          <p className="mt-2 text-xl">
            Market Change: {stockData.regularMarketChangePercent?.toFixed(2)}%
          </p>
          <button onClick={handleAddWatchlist}
          className="bg-green-500 hover:bg-green-600 px-5 py-3 rounded-xl mt-6">
          Add To Watchlist
          </button>
          <div className="mt-6">

  <input
    type="number"
    placeholder="Enter Target Price"
    value={targetPrice}
    onChange={(e) =>
      setTargetPrice(e.target.value)
    }
    className="bg-black border border-gray-700 rounded-xl px-4 py-3 mr-4"
  />

  <button
    onClick={handleCreateAlert}
    className="bg-yellow-500 hover:bg-yellow-600 px-5 py-3 rounded-xl"
  >
    Create Alert
  </button>

</div>  
          </div>

      )}

    </div>
  );
}

export default StockSearch;