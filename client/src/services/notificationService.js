import API from "../api/axios";

/* Get Notifications */
export const getNotifications = async () => {

  try {

    const response = await API.get(

      "/notifications"

    );

    return response.data;

  } catch (error) {

    console.log(

      "Notification Fetch Error:",

      error

    );

    throw error;

  }

};