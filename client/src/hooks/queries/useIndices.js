// client/src/hooks/queries/useIndices.js
import { useQuery } from "@tanstack/react-query";
import { getMarketIndices } from "../../services/marketService";
import { isMarketOpen } from "../../utils/marketHours";

export function useIndices(options = {}) {
  return useQuery({
    queryKey: ["market", "indices"],
    queryFn: async () => {
      const payload = await getMarketIndices();
      const rows = Array.isArray(payload) ? payload : payload?.data || [];
      return {
        data: rows,
        stale: Boolean(payload?.stale),
        asOf: payload?.asOf || null,
      };
    },
    refetchInterval: () => {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") {
        return false;
      }
      return isMarketOpen() ? 20000 : 120000;
    },
    staleTime: 10000,
    ...options,
  });
}
