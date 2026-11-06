// client/src/hooks/queries/useMarketMovers.js
import { useQuery } from "@tanstack/react-query";
import { getMarketMovers } from "../../services/marketService";
import { isMarketOpen } from "../../utils/marketHours";

export function useMarketMovers(options = {}) {
  return useQuery({
    queryKey: ["market", "movers"],
    queryFn: getMarketMovers,
    refetchInterval: () => {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") {
        return false;
      }
      return isMarketOpen() ? 30000 : 180000;
    },
    staleTime: 15000,
    ...options,
  });
}
