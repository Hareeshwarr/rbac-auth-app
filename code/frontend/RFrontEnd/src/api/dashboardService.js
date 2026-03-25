import api from "./axiosconfig";

export const getUserData = () => api.get("/test/user");
export const getAdminData = () => api.get("/test/admin");
export const getModeratorData = () => api.get("/test/mod");
