import API from "../api/axios";

export const getPortfolio = async () => {
  const response = await API.get("/portfolio");
  return response.data;
};

export const addHolding = async (payload) => {
  const response = await API.post("/portfolio", payload);
  return response.data;
};

export const bulkImportHoldings = async (payload) => {
  const response = await API.post("/portfolio/bulk", payload);
  return response.data;
};

export const updateHolding = async (id, payload) => {
  const response = await API.put(`/portfolio/${id}`, payload);
  return response.data;
};

export const deleteHolding = async (id) => {
  const response = await API.delete(`/portfolio/${id}`);
  return response.data;
};
