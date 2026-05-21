// client/src/pages/WatchlistPage.jsx
import AppLayout      from "../components/layout/AppLayout";
import WatchlistWidget from "../components/watchlist/WatchlistWidget";

function WatchlistPage() {
  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-[20px] font-bold text-white">Watchlist</h1>
        <p className="text-[12px] text-gray-500 mt-1">
          All your tracked stocks with live prices
        </p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-12">
          <WatchlistWidget />
        </div>
      </div>
    </AppLayout>
  );
}

export default WatchlistPage;