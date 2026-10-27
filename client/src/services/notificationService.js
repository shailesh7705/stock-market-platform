// client/src/services/notificationService.js
import API from "../api/axios";

export const getNotifications = async () => {
  try {
    const response = await API.get("/notifications");
    return response.data;
  } catch (error) {
    console.error("Notification Fetch Error:", error);
    throw error;
  }
};

export const markAllRead = async () => {
  try {
    const response = await API.put("/notifications/read-all");
    return response.data;
  } catch (error) {
    console.error("Mark All Read Error:", error);
    throw error;
  }
};

export const clearAllNotifications = async () => {
  try {
    const response = await API.delete("/notifications/clear-all");
    return response.data;
  } catch (error) {
    console.error("Clear All Notifications Error:", error);
    throw error;
  }
};
