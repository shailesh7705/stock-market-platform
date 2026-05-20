import API from "../api/axios";

/* Create Alert */
export const createAlert = async (alertData) => {

  try {

    const response = await API.post(

      "/alerts",

      alertData

    );

    return response.data;

  } catch (error) {

    console.log("Create Alert Error:", error);

    throw error;

  }

};

/* Get Alerts */
export const getAlerts = async () => {

  try {

    const response = await API.get("/alerts");

    return response.data;

  } catch (error) {

    console.log("Get Alerts Error:", error);

    throw error;

  }

};

export const deleteAlert = async (id) => {

  try {

    const response = await API.delete(

      `/alerts/${id}`

    );

    return response.data;

  } catch (error) {

    console.log("Delete Alert Error:", error);

    throw error;

  }

};