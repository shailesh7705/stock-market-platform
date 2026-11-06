// client/src/api/axios.js
import axios from "axios";
import toast from "react-hot-toast";
import useAuthStore from "../store/authStore";

const isLocal =
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname.startsWith("192.168.") ||
    window.location.hostname.startsWith("10."));

// If deployed on Vercel with same-origin /api rewrite, use relative /api, or env URL
const rawUrl = isLocal
  ? (import.meta.env.VITE_DEV_API_URL || "http://localhost:5000/api")
  : (import.meta.env.VITE_API_URL || "/api");

const baseURL = rawUrl.replace(/\/+$/, "");

const API = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 20000,
});

let coldStartTimer = null;
let coldStartToastId = null;

// Attach JWT Token
API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }

  // Detect cold start (> 3 seconds) for slow cloud boot
  if (!coldStartTimer && typeof window !== "undefined") {
    coldStartTimer = setTimeout(() => {
      coldStartToastId = toast.loading("Waking up cloud server (Render spin-up)...", {
        id: "server-cold-start",
        duration: 8000,
      });
    }, 3000);
  }

  return req;
});

// Dismiss cold start toast and handle responses
API.interceptors.response.use(
  (res) => {
    if (coldStartTimer) {
      clearTimeout(coldStartTimer);
      coldStartTimer = null;
    }
    if (coldStartToastId) {
      toast.dismiss(coldStartToastId);
      coldStartToastId = null;
    }
    return res;
  },
  (error) => {
    if (coldStartTimer) {
      clearTimeout(coldStartTimer);
      coldStartTimer = null;
    }
    if (coldStartToastId) {
      toast.dismiss(coldStartToastId);
      coldStartToastId = null;
    }

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
