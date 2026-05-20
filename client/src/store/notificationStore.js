import { create } from "zustand";

const useNotificationStore = create((set) => ({

  notifications: [],

  setNotifications: (notifications) =>

    set({
      notifications
    }),

  addNotification: (notification) =>

    set((state) => ({

      notifications: [

        notification,

        ...state.notifications

      ]

    }))

}));

export default useNotificationStore;