// client/src/hooks/queries/useWatchlist.js
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getWatchlist,
  addToWatchlist,
  removeFromWatchlist,
} from "../../services/watchlistService";
import { isMarketOpen } from "../../utils/marketHours";

export function useWatchlist(options = {}) {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  return useQuery({
    queryKey: ["user", "watchlist"],
    queryFn: getWatchlist,
    enabled: Boolean(token),
    refetchInterval: () => {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") {
        return false;
      }
      return isMarketOpen() ? 15000 : false;
    },
    staleTime: 10000,
    ...options,
  });
}

export function useAddToWatchlist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ symbol, name, listName, tags }) =>
      addToWatchlist({ symbol, companyName: name, listName, tags }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user", "watchlist"] });
    },
  });
}

export function useRemoveFromWatchlist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => removeFromWatchlist(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["user", "watchlist"] });
      const previous = queryClient.getQueryData(["user", "watchlist"]);
      queryClient.setQueryData(["user", "watchlist"], (old = []) =>
        old.filter((item) => item._id !== id)
      );
      return { previous };
    },
    onError: (err, id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["user", "watchlist"], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["user", "watchlist"] });
    },
  });
}
