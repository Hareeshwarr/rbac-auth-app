import api from "./axiosconfig";

// Original test endpoints (kept for access verification)
export const getUserData = () => api.get("/test/user");
export const getAdminData = () => api.get("/test/admin");
export const getModeratorData = () => api.get("/test/mod");

// ===== ADMIN APIs =====
export const getAdminUsers = () => api.get("/admin/users");
export const getAdminStats = () => api.get("/admin/stats");
export const changeUserRole = (userId, role) =>
  api.put(`/admin/users/${userId}/role`, { role });
export const deleteUser = (userId) => api.delete(`/admin/users/${userId}`);

// ===== MODERATOR APIs =====
export const getModUsers = () => api.get("/mod/users");
export const getModStats = () => api.get("/mod/stats");
export const deleteStudent = (userId) => api.delete(`/mod/users/${userId}`);
