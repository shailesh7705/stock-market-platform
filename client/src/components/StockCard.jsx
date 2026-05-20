function StockCard(props) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-green-400 transition duration-300">

      <div className="flex justify-between items-center">

        <div>
          <h2 className="text-2xl font-bold">
            {props.name}
          </h2>

          <p className="text-gray-400 mt-2">
            NSE
          </p>
        </div>

        <div className="text-right">
          <h3 className="text-2xl font-bold text-green-400">
            ₹{props.price}
          </h3>

          <p className="text-green-400">
            +{props.change}%
          </p>
        </div>

      </div>

    </div>
  );
}

export default StockCard;