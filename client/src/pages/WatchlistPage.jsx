// client/src/pages/WatchlistPage.jsx
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../components/layout/AppLayout";
import Card from "../components/ui/Card";
import {
  Bookmark,
  TrendingUp,
  TrendingDown,
  Search,
  Plus,
  Download,
  FolderPlus,
} from "lucide-react";
import {
  getWatchlist,
  removeFromWatchlist,
  addToWatchlist,
  getWatchlistBoards,
  createWatchlistBoard,
  deleteWatchlistBoard,
  reorderWatchlist,
  updateWatchlistItem,
  exportWatchlist,
} from "../services/watchlistService";
import SortableWatchlist from "../components/watchlist/SortableWatchlist";
import { getLiveStocks, searchStocks, getBatchStockDetails } from "../services/stockService";
import useWatchlistStore from "../store/watchlistStore";
import CreateAlertModal from "../components/alerts/CreateAlertModal";
import PortfolioDiagnosticWidget from "../components/stocks/PortfolioDiagnosticWidget";
import RecentlyViewedCarousel from "../components/stocks/RecentlyViewedCarousel";
import toast from "react-hot-toast";

function cleanSymbol(sym = "") {
  return sym.replace(".NS", "").replace(".BO", "").toUpperCase();
}

function WatchlistPage() {
  const { watchlist, setWatchlist, removeStock, addStock } = useWatchlistStore();
  const watchlistRef = useRef(watchlist);
  watchlistRef.current = watchlist;
  const [loading, setLoading] = useState(true);
  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [addQuery, setAddQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [boards, setBoards] = useState([{ name: "My Watchlist", count: 0 }]);
  const [activeList, setActiveList] = useState("My Watchlist");
  const [newListName, setNewListName] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchWatchlist();
    loadBoards();
  }, []);

  useEffect(() => {
    if (!watchlist?.length) return;
    fetchLivePrices();
    const interval = setInterval(fetchLivePrices, 15000);
    return () => clearInterval(interval);
  }, [watchlist.length]);

  const loadBoards = async () => {
    try {
      const data = await getWatchlistBoards();
      if (Array.isArray(data) && data.length) {
        setBoards(data);
        setActiveList((current) => (data.some((board) => board.name === current) ? current : data[0].name));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchWatchlist = async () => {
    try {
      const data = await getWatchlist();
      setWatchlist(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLivePrices = async () => {
    try {
      const current = watchlistRef.current || [];
      const symbols = current.map((s) => s.symbol).filter(Boolean);
      if (!symbols.length) return;

      const [liveData, batchDetails] = await Promise.allSettled([
        getLiveStocks(symbols),
        getBatchStockDetails(symbols),
      ]);

      const liveList = liveData.status === "fulfilled" && Array.isArray(liveData.value) ? liveData.value : [];
      const detailsList = batchDetails.status === "fulfilled" && Array.isArray(batchDetails.value) ? batchDetails.value : [];

      const detailsMap = {};
      detailsList.forEach((d) => {
        if (d?.symbol) detailsMap[d.symbol] = d;
      });

      const updated = current.map((stock) => {
        const live = liveList.find((item) => item.symbol === stock.symbol);
        const det = detailsMap[stock.symbol];
        return {
          ...stock,
          price: live?.price ? `₹${live.price.toFixed(2)}` : stock.price,
          numericPrice: live?.price ?? stock.numericPrice,
          change: live?.change !== undefined ? `${live.change >= 0 ? "+" : ""}${live.change.toFixed(2)}%` : stock.change,
          changePercent: live?.change ?? stock.changePercent,
          positive: live?.positive ?? stock.positive,
          dayHigh: live?.high ?? stock.dayHigh,
          dayLow: live?.low ?? stock.dayLow,
          fiftyTwoWeekHigh: live?.fiftyTwoWeekHigh ?? stock.fiftyTwoWeekHigh,
          fiftyTwoWeekLow: live?.fiftyTwoWeekLow ?? stock.fiftyTwoWeekLow,
          pulseScore: det?.pulseScore || stock.pulseScore,
          sector: det?.assetProfile?.sector || stock.sector,
        };
      });
      setWatchlist(updated);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenAlert = (e, stock) => {
    e.stopPropagation();
    setSelectedStock(stock);
    setAlertModalOpen(true);
  };

  const handleRemove = async (e, id, symbol) => {
    e.stopPropagation();
    try {
      removeStock(id);
      await removeFromWatchlist(id);
      toast.success(`${cleanSymbol(symbol)} removed from watchlist`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to remove stock");
      fetchWatchlist();
    }
  };

  // Quick search & add
  useEffect(() => {
    if (!addQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        setSearching(true);
        const data = await searchStocks(addQuery.trim());
        setSearchResults(data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setSearching(false);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [addQuery]);

  const handleQuickAdd = async (stock) => {
    if (watchlist.some((w) => w.symbol === stock.symbol && (w.listName || "My Watchlist") === activeList)) {
      toast.error(`${cleanSymbol(stock.symbol)} is already in ${activeList}`);
      return;
    }
    try {
      const saved = await addToWatchlist({
        symbol: stock.symbol,
        name: stock.name,
        listName: activeList,
      });
      addStock(saved);
      toast.success(`${cleanSymbol(stock.symbol)} added to watchlist!`);
      setAddQuery("");
      setSearchResults([]);
      loadBoards();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add stock");
    }
  };

  const listNameOf = (stock) => stock.listName || "My Watchlist";

  const boardItems = (watchlist || []).filter((stock) => {
    if (listNameOf(stock) !== activeList) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return stock.symbol.toLowerCase().includes(q) || (stock.name || "").toLowerCase().includes(q);
  });

  const handleReorder = async (nextItems) => {
    if (searchQuery.trim()) {
      toast.error("Clear the filter before reordering");
      return;
    }
    const others = (watchlist || []).filter((stock) => listNameOf(stock) !== activeList);
    setWatchlist([...others, ...nextItems]);
    try {
      await reorderWatchlist(activeList, nextItems.map((item) => item._id));
    } catch {
      toast.error("Could not save the new order");
      fetchWatchlist();
    }
  };

  const handleCreateList = async (event) => {
    event.preventDefault();
    const name = newListName.trim();
    if (!name) return;
    try {
      await createWatchlistBoard(name);
      setNewListName("");
      setActiveList(name);
      await loadBoards();
      toast.success(`${name} created`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not create that list");
    }
  };

  const handleDeleteList = async (name) => {
    try {
      await deleteWatchlistBoard(name);
      if (activeList === name) setActiveList("My Watchlist");
      await Promise.all([loadBoards(), fetchWatchlist()]);
      toast.success(`${name} folded into My Watchlist`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not remove that list");
    }
  };

  const handleExport = async () => {
    try {
      const blob = await exportWatchlist(activeList);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${activeList.replace(/\s+/g, "-").toLowerCase()}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Could not export this list");
    }
  };

  const handleMove = async (stock, listName) => {
    try {
      await updateWatchlistItem(stock._id, { listName });
      setWatchlist((watchlist || []).map((item) => (item._id === stock._id ? { ...item, listName } : item)));
      loadBoards();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not move that stock");
    }
  };

  const handleAddTag = async (stock, rawTag) => {
    const tag = rawTag.trim();
    if (!tag) return;
    const tags = Array.from(new Set([...(stock.tags || []), tag])).slice(0, 8);
    try {
      await updateWatchlistItem(stock._id, { tags });
      setWatchlist((watchlist || []).map((item) => (item._id === stock._id ? { ...item, tags } : item)));
    } catch {
      toast.error("Could not save that tag");
    }
  };

  const handleRemoveTag = async (stock, tag) => {
    const tags = (stock.tags || []).filter((item) => item !== tag);
    try {
      await updateWatchlistItem(stock._id, { tags });
      setWatchlist((watchlist || []).map((item) => (item._id === stock._id ? { ...item, tags } : item)));
    } catch {
      toast.error("Could not remove that tag");
    }
  };

  const positiveCount = (watchlist || []).filter((s) => s.positive).length;
  const negativeCount = (watchlist || []).length - positiveCount;

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-6 pb-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-white tracking-tight">Watchlist</h1>
              <span className="text-xs font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2.5 py-0.5 rounded-full">
                {watchlist.length} Tracked
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Real-time NSE tracking with 1-click price target alerts & institutional portfolio diagnostics
            </p>
          </div>

          {/* Quick Add Stock Input */}
          <div className="relative w-full md:w-80">
            <div className="relative flex items-center">
              <Search size={14} className="absolute left-3.5 text-gray-500" />
              <input
                type="text"
                placeholder="Search stock to add to watchlist..."
                value={addQuery}
                onChange={(e) => setAddQuery(e.target.value)}
                className="w-full h-10 rounded-xl bg-[#0e1626] border border-white/10 pl-9 pr-4 text-xs text-white outline-none focus:border-emerald-500/40 transition-all placeholder:text-gray-500 font-medium"
              />
            </div>

            {/* Quick Add Dropdown */}
            {searchResults.length > 0 && (
              <div className="absolute left-0 right-0 top-12 bg-[#0e1626] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden divide-y divide-white/[0.04] max-h-60 overflow-y-auto">
                {searchResults.map((stock) => (
                  <div
                    key={stock.symbol}
                    onClick={() => handleQuickAdd(stock)}
                    className="flex items-center justify-between px-3.5 py-2.5 hover:bg-white/5 cursor-pointer transition-colors"
                  >
                    <div>
                      <span className="text-xs font-bold text-white">{cleanSymbol(stock.symbol)}</span>
                      <p className="text-[11px] text-gray-400 truncate max-w-[200px]">{stock.name}</p>
                    </div>
                    <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded flex items-center gap-1">
                      <Plus size={11} /> Add
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Persistent Recently Viewed Stocks Carousel */}
        <RecentlyViewedCarousel />

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="flex items-center gap-4 py-4 px-5">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
              <Bookmark size={22} />
            </div>
            <div>
              <p className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold">
                Total Assets
              </p>
              <p className="text-2xl font-extrabold text-white mt-0.5">{watchlist.length}</p>
            </div>
          </Card>

          <Card className="flex items-center gap-4 py-4 px-5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <TrendingUp size={22} />
            </div>
            <div>
              <p className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold">
                Gaining Today
              </p>
              <p className="text-2xl font-extrabold text-emerald-400 mt-0.5">{positiveCount}</p>
            </div>
          </Card>

          <Card className="flex items-center gap-4 py-4 px-5">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
              <TrendingDown size={22} />
            </div>
            <div>
              <p className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold">
                Declining Today
              </p>
              <p className="text-2xl font-extrabold text-rose-400 mt-0.5">{negativeCount}</p>
            </div>
          </Card>
        </div>

        {/* Portfolio Health Diagnostic Widget */}
        <PortfolioDiagnosticWidget watchlist={watchlist} />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {boards.map((board) => (
              <button
                key={board.name}
                type="button"
                onClick={() => setActiveList(board.name)}
                className={`h-10 px-3 rounded-xl border text-xs font-bold whitespace-nowrap ${
                  activeList === board.name
                    ? "bg-emerald-500 text-black border-emerald-400"
                    : "bg-[#0e1626] text-gray-300 border-white/10"
                }`}
              >
                {board.name}
                <span className="ml-1.5 font-mono">{board.count || 0}</span>
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <form onSubmit={handleCreateList} className="flex items-center gap-2">
              <input
                value={newListName}
                onChange={(event) => setNewListName(event.target.value)}
                placeholder="New list name"
                className="h-10 w-40 rounded-xl bg-[#0e1626] border border-white/10 px-3 text-xs text-white outline-none"
              />
              <button type="submit" className="h-10 px-3 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-white inline-flex items-center gap-1">
                <FolderPlus size={14} /> Add
              </button>
            </form>
            <button type="button" onClick={handleExport} className="h-10 px-3 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-white inline-flex items-center gap-1">
              <Download size={14} /> CSV
            </button>
            {activeList !== "My Watchlist" && (
              <button type="button" onClick={() => handleDeleteList(activeList)} className="h-10 px-3 rounded-xl text-xs font-bold text-rose-300">
                Remove list
              </button>
            )}
          </div>
        </div>

        <Card className="p-0 overflow-hidden border border-white/[0.08]">
          <div className="p-4 border-b border-white/[0.08] flex items-center justify-between gap-3">
            <h2 className="text-sm font-bold text-white">{activeList}</h2>
            <div className="w-64">
              <input
                type="text"
                placeholder="Filter this list..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-8 rounded-lg bg-[#080d1a] border border-white/10 px-3 text-xs text-white outline-none focus:border-emerald-500/40"
              />
            </div>
          </div>

          {loading ? (
            <div className="p-6 space-y-3 animate-pulse">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-16 rounded-xl bg-white/5" />
              ))}
            </div>
          ) : boardItems.length === 0 ? (
            <div className="text-center py-16 px-4">
              <Bookmark size={28} className="text-gray-600 mx-auto mb-3" />
              <p className="text-sm font-bold text-white mb-1">{activeList} is empty</p>
              <p className="text-xs text-gray-500 max-w-sm mx-auto mb-4">
                Search above to add an NSE stock. Drag the grip to reorder, and tag names such as dividend or breakout.
              </p>
            </div>
          ) : (
            <SortableWatchlist
              items={boardItems}
              boards={boards}
              onReorder={handleReorder}
              onOpen={(sym) => navigate(`/stock/${sym}`)}
              onAlert={handleOpenAlert}
              onRemove={handleRemove}
              onMove={handleMove}
              onAddTag={handleAddTag}
              onRemoveTag={handleRemoveTag}
            />
          )}
        </Card>
      </div>

      <CreateAlertModal
        open={alertModalOpen}
        onClose={() => setAlertModalOpen(false)}
        stock={selectedStock}
      />
    </AppLayout>
  );
}

export default WatchlistPage;
