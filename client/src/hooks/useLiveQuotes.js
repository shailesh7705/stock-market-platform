// client/src/hooks/useLiveQuotes.js
import { useState, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import API from "../api/axios";

export function useLiveQuotes(symbols = []) {
  const [quotes, setQuotes] = useState({});
  const [flashStates, setFlashStates] = useState({}); // symbol -> 'up' | 'down' | null
  const [isConnected, setIsConnected] = useState(false);
  const queryClient = useQueryClient();
  const eventSourceRef = useRef(null);
  const prevPricesRef = useRef({});

  const validSymbols = Array.isArray(symbols)
    ? [...new Set(symbols.map((s) => String(s).trim().toUpperCase()).filter(Boolean))]
    : [];
  const symbolKey = validSymbols.slice().sort().join(",");

  useEffect(() => {
    if (!symbolKey || typeof window === "undefined" || !window.EventSource) {
      return;
    }

    const base = API.defaults.baseURL || "/api";
    const url = `${base.replace(/\/+$/, "")}/stream?symbols=${encodeURIComponent(symbolKey)}`;

    try {
      const es = new EventSource(url);
      eventSourceRef.current = es;

      es.onopen = () => {
        setIsConnected(true);
      };

      es.addEventListener("quote", (event) => {
        try {
          const tick = JSON.parse(event.data);
          if (!tick?.symbol || tick.price === undefined) return;

          const sym = tick.symbol.toUpperCase();
          const prevPrice = prevPricesRef.current[sym];
          const newPrice = Number(tick.price);

          let flash = null;
          if (prevPrice !== undefined && Number.isFinite(prevPrice)) {
            if (newPrice > prevPrice) flash = "up";
            else if (newPrice < prevPrice) flash = "down";
          }
          prevPricesRef.current[sym] = newPrice;

          setQuotes((prev) => ({ ...prev, [sym]: tick }));

          // Update React Query cache so any useQuery(["quote", sym]) updates instantly
          queryClient.setQueryData(["quote", sym], tick);

          if (flash) {
            setFlashStates((prev) => ({ ...prev, [sym]: flash }));
            setTimeout(() => {
              setFlashStates((prev) => ({ ...prev, [sym]: null }));
            }, 1200);
          }
        } catch (parseErr) {
          console.warn("[useLiveQuotes] Parse tick error:", parseErr);
        }
      });

      es.onerror = () => {
        setIsConnected(false);
      };

      return () => {
        es.close();
        eventSourceRef.current = null;
        setIsConnected(false);
      };
    } catch (err) {
      console.warn("[useLiveQuotes] SSE initialization error:", err);
    }
  }, [symbolKey, queryClient]);

  return {
    quotes,
    flashStates,
    isConnected,
  };
}
