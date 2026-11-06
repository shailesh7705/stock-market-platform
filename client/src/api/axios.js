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
  withCredentials: true, // SP-29: Automatically send httpOnly cookies (access_token, refresh_token)
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 20000,
});

let coldStartTimer = null;
let coldStartToastId = null;

// Attach Bearer Token if stored (dual-mode: works with both cookies & Bearer headers)
API.interceptors.request.use((req) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (token && !req.headers.Authorization) {
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

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

// Dismiss cold start toast and handle automatic token refresh
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
  async (error) => {
    if (coldStartTimer) {
      clearTimeout(coldStartTimer);
      coldStartTimer = null;
    }
    if (coldStartToastId) {
      toast.dismiss(coldStartToastId);
      coldStartToastId = null;
    }

    const originalRequest = error.config;

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      const url = String(originalRequest.url || "");
      const isAuthEndpoint =
        url.includes("/auth/login") ||
        url.includes("/auth/register") ||
        url.includes("/auth/refresh") ||
        url.includes("/auth/forgot-password") ||
        url.includes("/auth/reset-password");

      if (!isAuthEndpoint) {
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then((newToken) => {
              if (newToken) {
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
              }
              return API(originalRequest);
            })
            .catch((err) => Promise.reject(err));
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          // Attempt silent session refresh via httpOnly refresh_token cookie
          const refreshRes = await axios.post(
            `${baseURL}/auth/refresh`,
            {},
            { withCredentials: true }
          );

          const newToken = refreshRes.data?.token;
          if (newToken) {
            localStorage.setItem("token", newToken);
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            if (refreshRes.data?.user) {
              useAuthStore.getState().patchUser(refreshRes.data.user);
            }
          }

          processQueue(null, newToken);
          isRefreshing = false;
          return API(originalRequest);
        } catch (refreshErr) {
          processQueue(refreshErr, null);
          isRefreshing = false;
          console.warn("[Auth] Silent refresh failed, logging out.");
          useAuthStore.getState().logout();
          if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
            const returnTo = `${window.location.pathname}${window.location.search}`;
            window.history.pushState({ from: returnTo }, "", `/login?expired=1`);
            window.dispatchEvent(new PopStateEvent("popstate"));
          }
          return Promise.reject(refreshErr);
        }
      }
    }

    return Promise.reject(error);
  }
);

export default API;
