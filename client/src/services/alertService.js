// client/src/services/alertService.js
import API from "../api/axios";

/* Create Alert */
export const createAlert = async (alertData) => {
  try {
    const response = await API.post("/alerts", alertData);
    return response.data;
  } catch (error) {
    console.error("Create Alert Error:", error);
    throw error;
  }
};

/* Get Alerts */
export const getAlerts = async () => {
  try {
    const response = await API.get("/alerts");
    return response.data;
  } catch (error) {
    console.error("Get Alerts Error:", error);
    throw error;
  }
};

/* Delete Alert */
export const deleteAlert = async (id) => {
  try {
    const response = await API.delete(`/alerts/${id}`);
    return response.data;
  } catch (error) {
    console.error("Delete Alert Error:", error);
    throw error;
  }
};

/* Toggle / Re-arm Alert */
export const toggleAlert = async (id) => {
  try {
    const response = await API.patch(`/alerts/${id}/toggle`);
    return response.data;
  } catch (error) {
    console.error("Toggle Alert Error:", error);
    throw error;
  }
};

/* Send Test Alert Email */
export const sendTestAlert = async (payload = {}) => {
  try {
    const response = await API.post("/alerts/test", payload);
    return response.data;
  } catch (error) {
    console.error("Test Alert Error:", error);
    throw error;
  }
};
