function Sidebar() {
  return (
    <div className="w-64 bg-gray-950 border-r border-gray-800 p-6 hidden md:block">

      <h2 className="text-3xl font-bold text-green-400 mb-10">
        StockAlert
      </h2>

      <ul className="space-y-6 text-lg">

        <li className="hover:text-green-400 cursor-pointer">
          Dashboard
        </li>

        <li className="hover:text-green-400 cursor-pointer">
          Watchlist
        </li>

        <li className="hover:text-green-400 cursor-pointer">
          Alerts
        </li>

        <li className="hover:text-green-400 cursor-pointer">
          Portfolio
        </li>

        <li className="hover:text-green-400 cursor-pointer">
          Settings
        </li>

      </ul>
        <button
        onClick={() => {
          localStorage.removeItem("token");
          window.location.href = "/login";
        }}
        className="mt-10 bg-red-500 hover:bg-red-600 px-5 py-3 rounded-xl w-full"
      >
        Logout
      </button>

    </div>
  );
}

export default Sidebar;