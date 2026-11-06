// client/src/hooks/queries/useNotifications.js
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getNotifications,
  markAllRead,
  clearAllNotifications,
} from "../../services/notificationService";

export function useNotifications(options = {}) {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  return useQuery({
    queryKey: ["user", "notifications"],
    queryFn: getNotifications,
    enabled: Boolean(token),
    refetchInterval: () => {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") {
        return false;
      }
      return 15000;
    },
    staleTime: 10000,
    ...options,
  });
}

export function useMarkAllRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markAllRead,
    onSuccess: () => {
      queryClient.setQueryData(["user", "notifications"], (old = []) =>
        old.map((n) => ({ ...n, read: true }))
      );
      queryClient.invalidateQueries({ queryKey: ["user", "notifications"] });
    },
  });
}

export function useClearNotifications() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: clearAllNotifications,
    onSuccess: () => {
      queryClient.setQueryData(["user", "notifications"], []);
      queryClient.invalidateQueries({ queryKey: ["user", "notifications"] });
    },
  });
}
