import API from "../api/axios";

export const registerUser = async (

  userData

) => {

  const response =
    await API.post(

      "/auth/register",

      userData

    );

  return response.data;

};

export const loginUser = async (

  userData

) => {

  const response =
    await API.post(

      "/auth/login",

      userData

    );

  return response.data;

};

export const forgotPassword = async (email) => {
  const response = await API.post("/auth/forgot-password", { email });
  return response.data;
};

export const resetPassword = async ({ token, password }) => {
  const response = await API.post("/auth/reset-password", { token, password });
  return response.data;
};

export const updateAlertSound = async (alertSound) => {
  const response = await API.patch("/auth/preferences", { alertSound });
  return response.data;
};