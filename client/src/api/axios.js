// client/src/api/axios.js
import axios from "axios";

const rawUrl =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV
    ? "http://localhost:5000/api"
    : "https://stock-market-platform-2j95.onrender.com/api");

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

// Graceful 401 handling (auto clear expired token)
API.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      const isAuthEndpoint = error.config?.url?.includes("/auth/");
      if (!isAuthEndpoint) {
        // If an authorized call fails with 401, token expired
        console.warn("[Auth] Token expired or invalid session.");
      }
    }
    return Promise.reject(error);
  }
);

export default API;
