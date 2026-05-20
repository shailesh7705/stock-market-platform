import { create } from "zustand";

const useAlertStore = create((set) => ({

  alerts: [],

  setAlerts: (alerts) =>

    set({
      alerts
    }),

  addAlert: (alert) =>

    set((state) => ({

      alerts: [alert, ...state.alerts]

    })),

  removeAlert: (id) =>

    set((state) => ({

      alerts: state.alerts.filter(

        (alert) => alert._id !== id

      )

    }))

}));

export default useAlertStore;