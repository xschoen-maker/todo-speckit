import api from "./services.js";
export default {
  getTodos: id => api.get(`lists/${id}/todos`),
  createTodo: (id, data) => api.post(`lists/${id}/todos`, data),
  updateTodo: (id, data) => api.put(`todos/${id}`, data),
  deleteTodo: id => api.delete(`todos/${id}`),
};
