import { useEffect, useRef } from "react";
import toast from "react-hot-toast";
import API from "../../api/axios";
import { getNotifications } from "../../services/notificationService";
import useNotificationStore from "../../store/notificationStore";
import { alertSoundEnabled, playAlertChime, pulseAlertHaptic } from "../../utils/alertChime";

function NotificationListener() {
  const { setNotifications, addNotification, setLiveConnected } = useNotificationStore();
  const seenIds = useRef(new Set());
  const connected = useRef(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return undefined;

    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }

    const announce = (note) => {
      if (!note?._id || seenIds.current.has(String(note._id))) return;
      seenIds.current.add(String(note._id));
      toast.success(note.message, { icon: "🚀", duration: 5000 });
      pulseAlertHaptic();
      if (alertSoundEnabled() && document.visibilityState === "visible" && document.hasFocus()) {
        playAlertChime();
      }
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("StockPulse Alert", { body: note.message, icon: "/favicon.svg" });
      }
      window.dispatchEvent(new CustomEvent("stockpulse:alert", { detail: note }));
    };

    const absorb = (notes, { announceNew }) => {
      if (!Array.isArray(notes)) return;
      notes.forEach((note) => {
        if (!note?._id) return;
        const id = String(note._id);
        if (announceNew && !seenIds.current.has(id)) announce(note);
        else seenIds.current.add(id);
      });
      setNotifications(notes);
    };

    const fetchNotifications = async (announceNew) => {
      const activeToken = localStorage.getItem("token");
      if (!activeToken) return;
      try {
        const data = await getNotifications();
        absorb(data, { announceNew });
      } catch {
        // Background refresh can fail while the stream reconnects.
      }
    };

    fetchNotifications(false);

    const source = new EventSource(
      `${API.defaults.baseURL}/stream/alerts?token=${encodeURIComponent(token)}`
    );

    source.onopen = () => {
      connected.current = true;
      setLiveConnected(true);
    };

    source.addEventListener("alert", (event) => {
      try {
        const payload = JSON.parse(event.data);
        const note = payload.notification;
        if (!note) return;
        announce(note);
        addNotification(note);
      } catch {
        fetchNotifications();
      }
    });

    source.addEventListener("indices", (event) => {
      try {
        const data = JSON.parse(event.data);
        if (Array.isArray(data)) {
          window.dispatchEvent(new CustomEvent("stockpulse:indices", { detail: data }));
        }
      } catch {
        // Ignore a malformed index frame.
      }
    });

    source.onerror = () => {
      connected.current = false;
      setLiveConnected(false);
    };

    const interval = setInterval(() => {
      if (!connected.current) fetchNotifications(true);
    }, 60000);

    return () => {
      clearInterval(interval);
      source.close();
      connected.current = false;
      setLiveConnected(false);
    };
  }, [addNotification, setLiveConnected, setNotifications]);

  return null;
}

export default NotificationListener;
