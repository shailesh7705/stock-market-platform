const Watchlist = require("../models/Watchlist");

const addToWatchlist = async (req, res) => {

  try {

    const { symbol, companyName } = req.body;

    const watchlistItem = await Watchlist.create({

      user: req.user._id,
      symbol,
      companyName

    });

    res.status(201).json(watchlistItem);

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }

};
const getWatchlist = async (req, res) => {

  try {

    const watchlist = await Watchlist.find({
  user: req.user._id
});

const formattedWatchlist = watchlist.map((item) => ({

  _id: item._id,

  name: item.companyName,

  exchange: "NSE",

  price: "₹0.00",

  change: "+0.00%",

  positive: true,

  symbol: item.symbol,

  data: [20, 25, 22, 30, 27, 35]

}));

res.status(200).json(formattedWatchlist); }catch (error) {

    res.status(500).json({
      message: error.message
    });

  }

};
const removeFromWatchlist = async (req, res) => {

  try {

    const item = await Watchlist.findById(
      req.params.id
    );

    if (!item) {

      return res.status(404).json({
        message: error.message
      });

    }

    await item.deleteOne();

    res.status(200).json({
      message: "Removed Successfully"
    });

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }

};

module.exports = {
  addToWatchlist,
  getWatchlist,
  removeFromWatchlist
};