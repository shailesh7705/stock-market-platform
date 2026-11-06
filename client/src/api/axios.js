// client/src/api/axios.js
import axios from "axios";
import useAuthStore from "../store/authStore";

// If running in local dev or on localhost, connect to local backend (port 5000)
// Otherwise in production deployment, connect to production Render backend
const isLocal =
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname.startsWith("192.168.") ||
    window.location.hostname.startsWith("10."));

const rawUrl = isLocal
  ? (import.meta.env.VITE_DEV_API_URL || "http://localhost:5000/api")
  : (import.meta.env.VITE_API_URL || "https://stock-market-platform-2j95.onrender.com/api");

const baseURL = rawUrl.replace(/\/+$/, "");

const API = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

// Attach JWT Token + cache buster to every request
API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }

  if (req.method === "get" || req.method === "GET") {
    req.params = {
      ...req.params,
      _t: Date.now(),
    };
  }

  return req;
});

// Graceful 401 handling (auto clear expired token & redirect to login)
API.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      const url = error.config?.url || "";
      const isAuthEndpoint =
        url.includes("/auth/login") ||
        url.includes("/auth/register") ||
        url.includes("/auth/forgot-password") ||
        url.includes("/auth/reset-password");
      if (!isAuthEndpoint) {
        console.warn("[Auth] Session expired or unauthorized. Clearing stored token.");
        useAuthStore.getState().logout();
        if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
          const returnTo = `${window.location.pathname}${window.location.search}`;
          window.history.pushState({ from: returnTo }, "", `/login?expired=1`);
          window.dispatchEvent(new PopStateEvent("popstate"));
        }
      }
    }
    return Promise.reject(error);
  }
);

export default API;
