// client/src/store/authStore.js
import { create } from "zustand";
import API from "../api/axios";

const getStoredUser = () => {
  try {
    const storedUser = localStorage.getItem("user");
    if (!storedUser || storedUser === "undefined") {
      return null;
    }
    return JSON.parse(storedUser);
  } catch (error) {
    return null;
  }
};

const useAuthStore = create((set, get) => ({
  user: getStoredUser(),
  token: typeof window !== "undefined" ? localStorage.getItem("token") || null : null,
  isInitializing: false,

  setAuth: (user, token) => {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    }
    if (token) {
      localStorage.setItem("token", token);
    }
    set({ user, token: token || get().token });
  },

  patchUser: (partial) => {
    set((state) => {
      const user = { ...(state.user || {}), ...partial };
      localStorage.setItem("user", JSON.stringify(user));
      return { user };
    });
  },

  fetchProfile: async () => {
    try {
      const res = await API.get("/auth/me");
      if (res.data?.user) {
        get().patchUser(res.data.user);
        return res.data.user;
      }
    } catch {
      // If unauthorized, session expired or unauthenticated
    }
    return null;
  },

  logout: async () => {
    try {
      await API.post("/auth/logout");
    } catch {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      set({ user: null, token: null });
    }
  },

  logoutAll: async () => {
    try {
      await API.post("/auth/logout-all");
    } finally {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      set({ user: null, token: null });
    }
  },
}));

export default useAuthStore;
