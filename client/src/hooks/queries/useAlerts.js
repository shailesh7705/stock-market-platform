// client/src/hooks/queries/useAlerts.js
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAlerts, createAlert, deleteAlert, toggleAlert } from "../../services/alertService";
import { isMarketOpen } from "../../utils/marketHours";

export function useAlerts(options = {}) {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  return useQuery({
    queryKey: ["user", "alerts"],
    queryFn: getAlerts,
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

export function useCreateAlert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => createAlert(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user", "alerts"] });
    },
  });
}

export function useDeleteAlert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => deleteAlert(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["user", "alerts"] });
      const previous = queryClient.getQueryData(["user", "alerts"]);
      queryClient.setQueryData(["user", "alerts"], (old = []) =>
        old.filter((item) => item._id !== id)
      );
      return { previous };
    },
    onError: (err, id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["user", "alerts"], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["user", "alerts"] });
    },
  });
}

export function useToggleAlert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => toggleAlert(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user", "alerts"] });
    },
  });
}
