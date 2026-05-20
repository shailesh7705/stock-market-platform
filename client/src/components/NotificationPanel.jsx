import { useEffect, useState } from "react";

import {
  fetchNotifications
} from "../services/notificationService";

function NotificationPanel() {

  const [notifications, setNotifications] =
    useState([]);

  useEffect(() => {

    async function loadNotifications() {

      try {

        const data =
          await fetchNotifications();

        setNotifications(data);

      } catch (error) {

        console.log(error);

      }

    }

    loadNotifications();

  }, []);

  return (

    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mt-10">

      <div className="flex items-center justify-between mb-6">

        <h2 className="text-3xl font-bold">
          Notifications
        </h2>

        <div className="bg-red-500 w-8 h-8 rounded-full flex items-center justify-center font-bold">

          {notifications.length}

        </div>

      </div>

      <div className="space-y-4">

        {notifications.length === 0 ? (

          <p className="text-gray-400">
            No Notifications
          </p>

        ) : (

          notifications.map((notification, index) => (

            <div
              key={index}
              className="bg-black border border-gray-700 rounded-xl p-4"
            >

              <p>
                {notification.message}
              </p>

            </div>

          ))

        )}

      </div>

    </div>

  );
}

export default NotificationPanel;