import { Search, Plus, Check, Bell, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";

import { searchStocks } from "../../services/stockService";
import { addToWatchlist } from "../../services/watchlistService";

import useWatchlistStore from "../../store/watchlistStore";

import CreateAlertModal from "../alerts/CreateAlertModal";

import { useToast, ToastContainer } from "../ui/Toast";

function StockSearch() {

  const [query, setQuery] = useState("");

  const [results, setResults] = useState([]);

  const [loading, setLoading] = useState(false);

  const [showDropdown, setShowDropdown] = useState(false);

  const [addingSymbol, setAddingSymbol] = useState("");

  const [alertStock, setAlertStock] = useState(null);

  const { watchlist, addStock } =
    useWatchlistStore();

  const navigate = useNavigate();

  const toast = useToast();

  const wrapperRef = useRef(null);

  // Close dropdown outside click
  useEffect(() => {

    const handler = (e) => {

      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target)
      ) {

        setShowDropdown(false);

      }

    };

    document.addEventListener(
      "mousedown",
      handler
    );

    return () =>
      document.removeEventListener(
        "mousedown",
        handler
      );

  }, []);

  // Debounced search
  useEffect(() => {

    const timeout = setTimeout(() => {

      if (query.trim().length >= 2) {

        fetchStocks();

      } else {

        setResults([]);

      }

    }, 220);

    return () => clearTimeout(timeout);

  }, [query]);

  const fetchStocks = async () => {

    try {

      setLoading(true);

      const data =
        await searchStocks(query);

      setResults(data);

      setShowDropdown(true);

    } catch (error) {

      console.log(error);

    } finally {

      setLoading(false);

    }

  };

  // Add to watchlist
  const handleAddWatchlist = async (stock) => {

    const exists = watchlist.find(
      (i) => i.symbol === stock.symbol
    );

    if (exists) {

      toast.info(
        "Already in watchlist",
        `${stock.symbol} is already tracked`
      );

      return;

    }

    try {

      setAddingSymbol(stock.symbol);

      const saved =
        await addToWatchlist(stock);

      addStock({

        _id: saved._id,

        name: stock.name,

        symbol: stock.symbol,

        exchange: "NSE",

        price: "₹0.00",

        change: "+0.00%",

        positive: true,

        data: [20, 25, 23, 30, 28, 35],

      });

      toast.success(
        "Added to watchlist",
        `${stock.name} is now being tracked`
      );

    } catch (error) {

      console.log(
        error.response?.data || error
      );

      toast.error(
        "Failed to add",
        "Could not add to watchlist"
      );

    } finally {

      setAddingSymbol("");

    }

  };

  // View stock details
  const handleViewStock = (stock) => {

    setShowDropdown(false);

    setQuery("");

    setResults([]);

    const clean = stock.symbol

      .replace(".NS", "")

      .replace(".BO", "");

    navigate(`/stock/${clean}`);

  };

  // Open alert modal
  const handleCreateAlert = (stock) => {

    setAlertStock(stock);

  };

  // Close dropdown helper
  const closeDropdown = () => {

    setShowDropdown(false);

    setQuery("");

    setResults([]);

  };

  return (

    <>

      <ToastContainer

        toasts={toast.toasts}

        onRemove={toast.remove}

      />

      <div

        className="relative w-full max-w-72"

        ref={wrapperRef}

      >

        {/* Search Input */}
        <div
          className="

            flex items-center

            bg-white/4

            border border-white/7

            rounded-xl

            px-3.5

            h-10

            transition-all

            focus-within:border-green-500/30

            focus-within:bg-white/6

          "
        >

          <Search
            size={14}
            className="text-gray-500 shrink-0"
          />

          <input

            type="text"

            placeholder="Search stocks..."

            value={query}

            onChange={(e) => {

              setQuery(e.target.value);

              if (!e.target.value) {

                setShowDropdown(false);

              }

            }}

            onFocus={() =>

              results.length > 0 &&
              setShowDropdown(true)

            }

            className="

              bg-transparent

              flex-1

              outline-none

              px-2.5

              text-[13px]

              placeholder:text-gray-600

              text-white

            "

          />

          {query && (

            <button

              onClick={() => {

                setQuery("");

                setResults([]);

                setShowDropdown(false);

              }}

              className="

                text-gray-600

                hover:text-gray-300

                transition-colors

                text-lg

                leading-none

              "

            >

              ×

            </button>

          )}

        </div>

        {/* Dropdown */}
        <AnimatePresence>

          {showDropdown && query && (

            <motion.div

              initial={{
                opacity: 0,
                y: 8,
                scale: 0.98
              }}

              animate={{
                opacity: 1,
                y: 0,
                scale: 1
              }}

              exit={{
                opacity: 0,
                y: 8,
                scale: 0.98
              }}

              transition={{
                duration: 0.15
              }}

              className="

                absolute

                top-12

                left-0

                w-[340px]

                rounded-2xl

                border border-white/[0.08]

                bg-[#0f1923]/98

                backdrop-blur-xl

                shadow-2xl

                shadow-black/50

                overflow-hidden

                z-[999]

              "

            >

              {/* Header */}
              <div
                className="

                  px-4 py-2.5

                  border-b border-white/[0.06]

                  flex items-center

                  justify-between

                "
              >

                <span
                  className="

                    text-[11px]

                    text-gray-500

                    font-medium

                    uppercase

                    tracking-wider

                  "
                >

                  {loading

                    ? "Searching..."

                    : `${results.length} result${results.length !== 1 ? "s" : ""}`}

                </span>

                {query && (

                  <span
                    className="

                      text-[11px]

                      text-gray-600

                    "
                  >

                    "{query}"

                  </span>

                )}

              </div>

              {/* Loading */}
              {loading && (

                <div className="p-3 space-y-2">

                  {[0, 1, 2].map((i) => (

                    <div

                      key={i}

                      className="

                        flex items-center gap-3

                        px-1 py-1

                        animate-pulse

                      "

                    >

                      <div
                        className="

                          w-8 h-8

                          rounded-lg

                          bg-white/5

                          shrink-0

                        "
                      />

                      <div className="flex-1">

                        <div
                          className="

                            h-3 w-32

                            bg-white/5

                            rounded

                            mb-1.5

                          "
                        />

                        <div
                          className="

                            h-2 w-20

                            bg-white/5

                            rounded

                          "
                        />

                      </div>

                    </div>

                  ))}

                </div>

              )}

              {/* Results */}
              {!loading && results.length > 0 && (

                <div
                  className="

                    max-h-[360px]

                    overflow-y-auto

                  "
                >

                  {results.map((stock) => {

                    const exists =
                      watchlist.find(
                        (i) =>
                          i.symbol === stock.symbol
                      );

                    const isAdding =
                      addingSymbol === stock.symbol;

                    const clean = stock.symbol

                      .replace(".NS", "")

                      .replace(".BO", "");

                    return (

                      <div

                        key={stock.symbol}

                        className="

                          flex items-center gap-3

                          px-4 py-3

                          border-b border-white/[0.04]

                          last:border-0

                          hover:bg-white/[0.03]

                          transition-all

                          group

                        "

                      >

                        {/* Avatar */}
                        <div
                          className="

                            w-8 h-8

                            rounded-lg

                            bg-white/5

                            border border-white/[0.07]

                            flex items-center

                            justify-center

                            text-[10px]

                            font-bold

                            text-gray-400

                            shrink-0

                          "
                        >

                          {clean.slice(0, 2)}

                        </div>

                        {/* Info */}
                        <div

                          className="

                            flex-1

                            min-w-0

                            cursor-pointer

                          "

                          onClick={() =>
                            handleViewStock(stock)
                          }

                        >

                          <p
                            className="

                              text-[13px]

                              font-semibold

                              text-white

                              truncate

                              leading-none

                              mb-0.5

                              group-hover:text-green-400

                              transition-colors

                            "
                          >

                            {stock.name}

                          </p>

                          <p
                            className="

                              text-[11px]

                              text-gray-500

                              leading-none

                            "
                          >

                            {clean} · NSE

                          </p>

                        </div>

                        {/* Actions */}
                        <div
                          className="

                            flex items-center

                            gap-1.5

                            shrink-0

                          "
                        >

                          {/* View */}
                          <button

                            onClick={() =>
                              handleViewStock(stock)
                            }

                            className="

                              w-7 h-7

                              rounded-lg

                              flex items-center

                              justify-center

                              bg-white/[0.04]

                              border border-white/[0.07]

                              text-gray-500

                              hover:text-white

                              hover:bg-white/10

                              transition-all

                            "

                          >

                            <ExternalLink size={12} />

                          </button>

                          {/* Alert */}
                          <button

                            onClick={(e) => {

                              e.preventDefault();

                              e.stopPropagation();

                              handleCreateAlert(stock);

                            }}

                            className="

                              w-7 h-7

                              rounded-lg

                              flex items-center

                              justify-center

                              bg-yellow-500/[0.08]

                              border border-yellow-500/20

                              text-yellow-500

                              hover:bg-yellow-500/20

                              transition-all

                            "

                          >

                            <Bell size={12} />

                          </button>

                          {/* Add */}
                          <button

                            disabled={
                              !!exists || isAdding
                            }

                            onClick={() =>
                              handleAddWatchlist(stock)
                            }

                            className={`

                              w-7 h-7

                              rounded-lg

                              flex items-center

                              justify-center

                              border

                              transition-all

                              ${exists

                                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 cursor-default"

                                : "bg-emerald-500/[0.08] border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/20"}

                            `}

                          >

                            {isAdding ? (

                              <div
                                className="

                                  w-3 h-3

                                  border-2

                                  border-emerald-400

                                  border-t-transparent

                                  rounded-full

                                  animate-spin

                                "
                              />

                            ) : exists ? (

                              <Check size={12} />

                            ) : (

                              <Plus size={12} />

                            )}

                          </button>

                        </div>

                      </div>

                    );

                  })}

                </div>

              )}

              {/* Empty */}
              {!loading &&
                results.length === 0 && (

                <div className="py-10 text-center">

                  <Search
                    size={24}
                    className="

                      text-gray-700

                      mx-auto

                      mb-2

                    "
                  />

                  <p
                    className="

                      text-[13px]

                      text-gray-500

                    "
                  >

                    No stocks found for "{query}"

                  </p>

                </div>

              )}

            </motion.div>

          )}

        </AnimatePresence>

      </div>

      {/* Alert Modal */}
      <CreateAlertModal

        open={!!alertStock}

        onClose={() => {

          setAlertStock(null);

          closeDropdown();

        }}

        stock={alertStock ? {

          symbol: alertStock.symbol,

          name: alertStock.name,

          price: null,

        } : null}

      />

    </>

  );

}

export default StockSearch;