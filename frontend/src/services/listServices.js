import api from "./services.js";
export default {
  getLists: () => api.get("lists"),
  createList: data => api.post("lists", data),
  updateList: (id, data) => api.put(`lists/${id}`, data),
  deleteList: id => api.delete(`lists/${id}`),
};
