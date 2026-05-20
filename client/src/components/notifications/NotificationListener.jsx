import {

  useEffect,
  useRef

} from "react";

import toast from "react-hot-toast";

import {

  getNotifications

} from "../../services/notificationService";

import useNotificationStore from "../../store/notificationStore";

function NotificationListener() {

  const {

    notifications,

    setNotifications

  } = useNotificationStore();

  const previousCount = useRef(0);

  useEffect(() => {

    fetchNotifications();

    const interval = setInterval(() => {

      fetchNotifications();

    }, 10000);

    return () => clearInterval(interval);

  }, []);

  const fetchNotifications = async () => {

    try {

      const data = await getNotifications();

      /* Trigger Toast */
      if (

        previousCount.current &&
        data.length > previousCount.current

      ) {

        const latest = data[0];

        toast.success(latest.message);

        /* Browser Notification */
        if (

          Notification.permission === "granted"

        ) {

          new Notification(

            "Stock Alert 🚀",

            {
              body: latest.message
            }

          );

        }

      }

      previousCount.current = data.length;

      setNotifications(data);

    } catch (error) {

      console.log(error);

    }

  };

  /* Browser Permission */
  useEffect(() => {

    if (

      Notification.permission !== "granted"

    ) {

      Notification.requestPermission();

    }

  }, []);

  return null;

}

export default NotificationListener;