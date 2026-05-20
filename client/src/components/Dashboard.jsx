import StockChart from "./components/charts/StockChart";

import WatchlistWidget from "./components/watchlist/WatchlistWidget";

import MarketMovers from "./components/market/MarketMovers";

import NotificationPanel from "./components/notifications/NotificationPanel";

import AlertsPanel from "./components/alerts/AlertsPanel";

import DashboardGrid from "./components/dashboard/DashboardGrid";

function Dashboard() {

  return (

    <div
      className="

        flex-1

        p-5 md:p-7 xl:p-8

        overflow-y-auto

      "
    >

      {/* Header */}
      <div className="mb-8">

        <h1
          className="

            text-3xl xl:text-4xl

            font-bold

            tracking-tight

          "
        >

          Market Dashboard

        </h1>

        <p className="text-gray-500 mt-2 text-sm">

          Track stocks, alerts and market movements in realtime.

        </p>

      </div>

      {/* Main Grid */}
      <DashboardGrid>

        {/* Chart */}
        <div className="lg:col-span-8">

          <StockChart />

        </div>

        {/* Notifications */}
        <div className="lg:col-span-4">

          <NotificationPanel />

        </div>

        {/* Watchlist */}
        <div className="lg:col-span-4">

          <WatchlistWidget />

        </div>

        {/* Market Movers */}
        <div className="lg:col-span-4">

          <MarketMovers />

        </div>

        {/* Alerts */}
        <div className="lg:col-span-4">

          <AlertsPanel />

        </div>

      </DashboardGrid>

    </div>

  );

}

export default Dashboard;