// client/src/components/notifications/NotificationListener.jsx
import { useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { getNotifications } from "../../services/notificationService";
import useNotificationStore from "../../store/notificationStore";

function NotificationListener() {
  const { setNotifications } = useNotificationStore();
  const previousCount = useRef(0);

  useEffect(() => {
    // Only poll if authenticated
    const token = localStorage.getItem("token");
    if (!token) return;

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const data = await getNotifications();
      if (!Array.isArray(data)) return;

      // Detect new notification arrival
      if (previousCount.current && data.length > previousCount.current) {
        const latest = data[0];
        toast.success(latest.message, {
          icon: "🚀",
          duration: 5000,
        });

        if ("Notification" in window && Notification.permission === "granted") {
          new Notification("StockPulse Alert 🚀", {
            body: latest.message,
            icon: "/favicon.svg",
          });
        }
      }

      previousCount.current = data.length;
      setNotifications(data);
    } catch {
      // Silently ignore background polling failures
    }
  };

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  return null;
}

export default NotificationListener;
