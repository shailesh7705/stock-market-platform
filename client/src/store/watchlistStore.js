import { create } from "zustand";

const useWatchlistStore = create((set) => ({

  watchlist: [],

  setWatchlist: (stocks) =>

    set({
      watchlist: stocks
    }),

  addStock: (stock) =>

    set((state) => ({

      watchlist: [stock, ...state.watchlist]

    })),

  removeStock: (id) =>

    set((state) => ({

      watchlist: state.watchlist.filter(

        (item) => item._id !== id

      )

    }))

}));

export default useWatchlistStore;