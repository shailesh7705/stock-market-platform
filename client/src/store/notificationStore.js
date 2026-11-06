import { create } from "zustand";

const useNotificationStore = create((set) => ({

  notifications: [],
  liveConnected: false,

  setNotifications: (notifications) =>

    set({
      notifications
    }),

  setLiveConnected: (liveConnected) => set({ liveConnected }),

  addNotification: (notification) =>

    set((state) => {
      if (state.notifications.some((item) => item._id === notification._id)) {
        return state;
      }
      return {
        notifications: [notification, ...state.notifications],
      };
    })

}));

export default useNotificationStore;