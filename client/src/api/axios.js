// client/src/api/axios.js
import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach JWT Token + cache buster to every request
API.interceptors.request.use((req) => {
  // Attach token
  const token = localStorage.getItem("token");
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }

  // FIX — bust browser cache by adding timestamp to every GET request
  if (req.method === "get" || req.method === "GET") {
    req.params = {
      ...req.params,
      _t: Date.now(),
    };
  }

  return req;
});

export default API;